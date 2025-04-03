import React, { useEffect, useMemo } from 'react';
import YoutubePlayer from './YoutubePlayer';

interface Track {
  id: string;
  title: string;
  smallThumbnail: string;
  bigThumbnail: string;
  votes: number;
}

interface YouTubePlayerWrapperProps {
  tracks: Track[];
  currentId: string | null;
  setCurrentId: (id: string) => void;
}

const YouTubePlayerWrapper: React.FC<YouTubePlayerWrapperProps> = ({ 
  tracks, 
  currentId, 
  setCurrentId 
}) => {
  // Set initial track if none is playing
  useEffect(() => {
    if (tracks.length > 0 && !currentId) {
      setCurrentId(tracks[0].id);
    }
  }, [tracks, currentId, setCurrentId]);

  // Handle video end by playing the top-voted track
  const handleVideoEnd = () => {
    if (tracks.length > 0) {
      setCurrentId(tracks[0].id);
    }
  };

  // Handle track selection
  const handleTrackSelect = (trackId: string) => {
    setCurrentId(trackId);
  };

  // Memoize the current track to prevent unnecessary re-renders
  const currentTrack = useMemo(() => {
    if (!currentId) return null;
    return tracks.find(t => t.id === currentId) || (tracks.length > 0 ? tracks[0] : null);
  }, [currentId, tracks]);

  // Memoize upcoming tracks
  const upNextTracks = useMemo(() => {
    if (!currentId) return [];
    return tracks.filter(t => t.id !== currentId).slice(0, 3);
  }, [currentId, tracks]);

  if (!currentTrack) return null;

  return (
    <YoutubePlayer
      currentTrack={currentTrack}
      upNextTracks={upNextTracks}
      onVideoEnd={handleVideoEnd}
      onTrackSelect={handleTrackSelect}
    />
  );
};

export default YouTubePlayerWrapper;