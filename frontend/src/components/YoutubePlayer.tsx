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

  // Initialize YouTube player
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
        controls:0,
        disablekb: 1, 
        fs: 0,     
        iv_load_policy: 3
      }
    });

    playerRef.current.on('ready', () => setIsReady(true));

    playerRef.current.on('stateChange', (event: any) => {
      if (event.data === 0) { // Video ended
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
  }, []);

  // Reset ended flag when track changes
  useEffect(() => {
    videoEndedRef.current = false;
  }, [currentTrack.id]);

  // Load new video when track changes
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

  // Prevent context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div className="w-full flex flex-col">
      <div className="aspect-video relative bg-black rounded-lg overflow-hidden shadow-lg">
        <div ref={playerElementRef} className="w-full h-full" />
        <div 
          ref={overlayRef}
          className="absolute inset-0 z-10" 
          onClick={handleOverlayClick}
          onContextMenu={handleContextMenu}
        />
      </div>
      <div className="mt-3 bg-white p-3 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm">Now Playing:</p>
        <p className="font-medium truncate">{currentTrack.title}</p>
      </div>
    </div>
  );
});

export default YoutubePlayer;