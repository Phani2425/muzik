import React, { useEffect, useState, useRef } from 'react';
import YouTubePlayer from 'youtube-player';

interface Track {
  id: string;
  title: string;
  smallThumbnail: string;
  bigThumbnail: string;
  votes: number;
}

interface YoutubePlayerProps {
  tracks: Track[];
  onVideoEnd?: () => void;
}

const YoutubePlayer: React.FC<YoutubePlayerProps> = ({ tracks, onVideoEnd }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerElementRef.current) return;
    
    playerRef.current = YouTubePlayer(playerElementRef.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0
      }
    });

    playerRef.current.on('ready', () => {
      setIsReady(true);
    });

    playerRef.current.on('stateChange', (event: any) => {
      if (event.data === 0) {
        if (currentTrackIndex < tracks.length - 1) {
          setCurrentTrackIndex(prev => prev + 1);
        } else {
          if (onVideoEnd) onVideoEnd();
        }
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || tracks.length === 0) return;
    
    playerRef.current.loadVideoById(tracks[currentTrackIndex].id)
      .then(() => {
        return playerRef.current.playVideo();
      })
      .catch((err:Error) => {
        console.error('Error playing video:', err);
        if (currentTrackIndex < tracks.length - 1) {
          setCurrentTrackIndex(prev => prev + 1);
        }
      });
  }, [isReady, currentTrackIndex, tracks]);

  useEffect(() => {
    setCurrentTrackIndex(0);
  }, [tracks.length]);

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="aspect-video relative bg-black rounded-lg overflow-hidden shadow-lg">
        <div ref={playerElementRef} className="w-full h-full" />
      </div>
      <div className="mt-3 bg-white p-3 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm">Now Playing:</p>
        <p className="font-medium truncate">{tracks[currentTrackIndex]?.title}</p>
      </div>
      {tracks.length > 1 && (
        <div className="mt-3 bg-white p-3 rounded-lg shadow-md">
          <p className="font-medium text-sm mb-2">Up Next:</p>
          <div className="flex overflow-x-auto gap-2 pb-1">
            {tracks.slice(currentTrackIndex + 1, currentTrackIndex + 4).map((track, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 w-40 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                onClick={() => setCurrentTrackIndex(currentTrackIndex + index + 1)}
              >
                <img 
                  src={track.smallThumbnail} 
                  alt={track.title} 
                  className="w-full h-20 object-cover rounded" 
                />
                <p className="text-xs mt-1 line-clamp-2">{track.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubePlayer;