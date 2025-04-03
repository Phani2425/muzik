import useUserStore from '@/zustand/userStore';
import React, { useEffect, useRef, useState } from 'react';
import YouTubePlayer from 'youtube-player';

interface Track {
  id: string;
  title: string;
  smallThumbnail: string;
  bigThumbnail: string;
  votes: number;
}

interface YoutubePlayerProps {
  currentTrack: Track;
  onVideoEnd: () => void;
}

const YoutubePlayer: React.FC<YoutubePlayerProps> = React.memo(({ currentTrack, onVideoEnd }) => {
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const currentVideoIdRef = useRef<string>(currentTrack.id);
  const videoEndedRef = useRef<boolean>(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { userState } = useUserStore();
  
  const isAdmin = userState.role === "admin";

  useEffect(() => {
    if (!playerElementRef.current) return;
    
    playerRef.current = YouTubePlayer(playerElementRef.current, {
      height: '100%',
      width: '100%',
      videoId: currentTrack.id,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
        controls: isAdmin ? 1 : 0,
        disablekb: isAdmin ? 0 : 1, 
        fs: isAdmin ? 1 : 0,     
        iv_load_policy: 3
      }
    });

    playerRef.current.on('ready', () => setIsReady(true));

    playerRef.current.on('stateChange', (event: any) => {
      if (event.data === 0) { 
        if (!videoEndedRef.current) {
          videoEndedRef.current = true;
          onVideoEnd();
        }
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [isAdmin]);

  useEffect(() => {
    videoEndedRef.current = false;
  }, [currentTrack.id]);

  useEffect(() => {
    if (!isReady) return;
    
    if (currentTrack.id !== currentVideoIdRef.current) {
      currentVideoIdRef.current = currentTrack.id;
      videoEndedRef.current = false;
      
      playerRef.current.loadVideoById(currentTrack.id)
        .then(() => playerRef.current.playVideo())
        .catch(() => {
          videoEndedRef.current = true;
          onVideoEnd();
        });
    }
  }, [isReady, currentTrack.id, onVideoEnd]);

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
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
              Admin Controls Enabled
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default YoutubePlayer;