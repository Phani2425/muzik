import { YoutubePlayerProps } from "@/utils/types";
import useUserStore from "@/zustand/userStore";
import { debounce } from "lodash";
import { SkipForward } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import YouTubePlayer from "youtube-player";

const YoutubePlayer: React.FC<YoutubePlayerProps> = React.memo(
  ({
    currentTrack,
    onVideoEnd,
    socket,
    roomId,
    currentPlayerState,
    setcurrentPlyerState,
  }) => {
    const [isReady, setIsReady] = useState(false);
    const playerRef = useRef<any>(null);
    const playerElementRef = useRef<HTMLDivElement>(null);
    const currentVideoIdRef = useRef<string>(currentTrack.id);
    const videoEndedRef = useRef<boolean>(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { userState } = useUserStore();
    const isAdmin = userState.role === "admin";
    const processingControlUpdateRef = useRef<boolean>(false);

    // Handle player state change (play, pause, etc)
    const handlePlayerStateChange = useCallback(
      (event: any) => {
        // If we're processing a remote control update, ignore this state change
        if (processingControlUpdateRef.current) {
          processingControlUpdateRef.current = false;
          return;
        }

        // Video ended
        if (event.data === 0) {
          if (!videoEndedRef.current) {
            videoEndedRef.current = true;
            onVideoEnd();
          }
          return;
        }

        // Only broadcast if admin and not already processing an update
        if (isAdmin && socket) {
          const action =
            event.data === 1 ? "play" : event.data === 2 ? "pause" : null;

          if (action) {
            // Get current time to sync all players
            playerRef.current.getCurrentTime().then((currentTime: number) => {
              socket.emit("videoControl", {
                action,
                timestamp: currentTime,
                roomId,
              });
            });
          }
        }
      },
      [isAdmin, socket, roomId, onVideoEnd]
    );

    // Setup player
    useEffect(() => {
      if (!playerElementRef.current) return;

      playerRef.current = YouTubePlayer(playerElementRef.current, {
        height: "100%",
        width: "100%",
        videoId: currentTrack.id,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
          controls: isAdmin ? 1 : 0,
          disablekb: isAdmin ? 0 : 1,
          fs: isAdmin ? 1 : 0,
          playsinline: 1,
        },
      });

      playerRef.current.on("ready", () => {
        setIsReady(true);

        // If we have a stored player state with timestamp, seek to it
        if (currentPlayerState && currentPlayerState.timeStamp) {
          // Calculate time offset since last update
          const lastUpdateTime = currentPlayerState.lastUpdated || Date.now();
          const elapsedTime = (Date.now() - lastUpdateTime) / 1000; // in seconds

          // Add elapsed time to the stored timestamp for more accuracy
          const targetTime = currentPlayerState.timeStamp + elapsedTime;

          // Seek to the target time
          playerRef.current.seekTo(targetTime + 1);

          playerRef.current.playVideo();
          setcurrentPlyerState(null);
        }
      });
      playerRef.current.on("stateChange", handlePlayerStateChange);

      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }, [isAdmin, handlePlayerStateChange]);

    const emitPlayerState = () => {
      if (!isAdmin || !socket) return;
      playerRef.current
        .getCurrentTime()
        .then((currentTime: number) => {
          const playerState = {
            roomId,
            currTrack: currentTrack.id,
            timeStamp: currentTime,
            lastUpdated: Date.now(),
          };

          socket.emit("savePlayerState", playerState);
        })
        .catch((err: Error) => {
          console.error("Error getting current time:", err);
        });
    };

    //setting up the setinterval for sending the cuurrent track along with the curretnt timestamp for synchronsing the new users
    useEffect(() => {
      if (!isAdmin) return;

      const intervalId = setInterval(() => {
        emitPlayerState();
      }, 1000);

      return () => {
        clearInterval(intervalId);
      };
    }, [isReady, isAdmin, socket, roomId]);

    // Handle seek events from admin
    const debouncedSeekEmit = useRef(
      debounce((timestamp: number) => {
        if (socket && isAdmin && roomId) {
          socket.emit("videoSeek", {
            timestamp,
            roomId,
          });
        }
      }, 200)
    ).current;

    const handleSeekChange = useCallback(
      (e: any) => {
        if (isAdmin && socket && isReady) {
          playerRef.current.getCurrentTime().then((currentTime: number) => {
            // Use the debounced function
            debouncedSeekEmit(currentTime);
          });
        }
      },
      [isAdmin, socket, isReady, debouncedSeekEmit]
    );

    // Add seeking event listener
    useEffect(() => {
      if (isReady && isAdmin && playerRef.current) {
        playerRef.current.addEventListener("seeking", handleSeekChange);

        return () => {
          if (playerRef.current) {
            playerRef.current.removeEventListener("seeking", handleSeekChange);
          }
        };
      }
    }, [isReady, isAdmin, handleSeekChange]);

    useEffect(() => {
      if (!socket || isAdmin) return;

      // Handle play/pause events
      const handleControlUpdate = (data: {
        action: string;
        timestamp: number;
      }) => {
        if (!playerRef.current || !isReady) return;

        processingControlUpdateRef.current = true;

        const { action, timestamp } = data;

        // Synchronize time first
        playerRef.current.seekTo(timestamp);

        // Then play or pause
        if (action === "play") {
          playerRef.current.playVideo();
        } else if (action === "pause") {
          playerRef.current.pauseVideo();
        }
      };

      const handleSeekUpdate = (data: { timestamp: number }) => {
        if (!playerRef.current || !isReady) return;

        processingControlUpdateRef.current = true;
        playerRef.current.seekTo(data.timestamp);
      };

      socket.on("videoControlUpdate", handleControlUpdate);
      socket.on("videoSeekUpdate", handleSeekUpdate);

      return () => {
        socket.off("videoControlUpdate", handleControlUpdate);
        socket.off("videoSeekUpdate", handleSeekUpdate);
      };
    }, [socket, isAdmin, isReady]);

    // Handle track change
    useEffect(() => {
      videoEndedRef.current = false;
    }, [currentTrack.id]);

    // Load new video when track changes
    useEffect(() => {
      if (!isReady) return;

      if (currentTrack.id !== currentVideoIdRef.current) {
        currentVideoIdRef.current = currentTrack.id;
        videoEndedRef.current = false;

        playerRef.current
          .loadVideoById(currentTrack.id)
          .then(() => playerRef.current.playVideo())
          .catch(() => {
            videoEndedRef.current = true;
            onVideoEnd();
          });
      }
    }, [isReady, currentTrack.id, onVideoEnd]);

    const handleSkipTrack = useCallback(() => {
      if (isAdmin) {
        videoEndedRef.current = true;

        if (socket) {
          socket.emit("skipTrack", roomId);
        }

        onVideoEnd();
      }
    }, [isAdmin, onVideoEnd, socket, roomId]);

    const handleOverlayClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      return false;
    };

    return (
      <div className="w-full flex flex-col">
        <div className="aspect-video relative bg-black rounded-lg overflow-hidden shadow-lg">
          <div ref={playerElementRef} className="w-full h-full" />

          {!isAdmin && (
            <div
              ref={overlayRef}
              className="absolute inset-0 z-10"
              onClick={handleOverlayClick}
              onContextMenu={handleContextMenu}
            />
          )}
        </div>

        <div className="mt-3 bg-white p-3 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Now Playing:</p>
              <p className="font-medium truncate">{currentTrack.title}</p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkipTrack}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 transition-colors text-xs"
                  aria-label="Skip track"
                  title="Skip to next track"
                >
                  <SkipForward size={14} />
                  Skip
                </button>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                  Admin Controls
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the track ID changes
    return (
      prevProps.currentTrack.id === nextProps.currentTrack.id &&
      prevProps.socket === nextProps.socket &&
      prevProps.roomId === prevProps.roomId &&
      prevProps.currentPlayerState === nextProps.currentPlayerState
    );
  }
);

export default YoutubePlayer;
