import redis from "../config/redisClient";
import Track from "../models/Track";
import { searchonYtById } from "../controllers/ytSearchController";
import { multiplier } from "./constants";

export const getQueue = async (roomId: string) => {
    const key = `room:${roomId}`;
    // Get already sorted data from Redis (highest score first)
    const trackList = await redis.zrevrange(key, 0, -1, "WITHSCORES");
    
    // If no tracks, return empty array immediately
    if (trackList.length === 0) return [];
    
    // Create a position map to preserve Redis's sort order
    const orderMap: Record<string, number> = {};
    const trackIds: string[] = [];
    const votesByTrackId: Record<string, number> = {};
    
    // Extract IDs and votes while recording original positions
    for (let i = 0; i < trackList.length; i += 2) {
      const trackId = trackList[i];
      const scoreStr = trackList[i + 1];
      const score = parseInt(scoreStr);
      
      const voteCount = Math.floor(score / multiplier);
      const position = i / 2;
      
      trackIds.push(trackId);
      votesByTrackId[trackId] = voteCount;
      orderMap[trackId] = position;
    }
    
    // Pre-allocate result array with null placeholders to preserve order
    const resultArray = new Array(trackIds.length).fill(null);
    
    // Find existing tracks in MongoDB
    const existingTracks = await Track.find({ id: { $in: trackIds } });
    const existingTrackMap = existingTracks.reduce((map, track) => {
      map[track.id] = track;
      return map;
    }, {} as Record<string, any>);
    
    // Process tracks in parallel
    const fetchPromises = trackIds.map(async (trackId) => {
      const position = orderMap[trackId];
      let trackData;
      
      if (existingTrackMap[trackId]) {
        // If track exists in MongoDB, use that data
        const track = existingTrackMap[trackId];
        trackData = {
          id: track.id,
          title: track.title,
          smallThumbnail: track.smallThumbnail,
          bigThumbnail: track.bigThumbnail,
          votes: votesByTrackId[trackId]
        };
      } else {
        // If not in MongoDB, fetch directly from YouTube API
        const apiData = await searchonYtById(trackId);
        
        // Store in MongoDB asynchronously (don't await)
        Track.create(apiData).catch(err => 
          console.error(`Failed to save track ${trackId} to MongoDB:`, err)
        );
        
        trackData = {
          ...apiData,
          votes: votesByTrackId[trackId]
        };
      }
      
      // Place data at the correct position in the pre-allocated array
      resultArray[position] = trackData;
    });
    
    // Wait for all fetch operations to complete
    await Promise.all(fetchPromises);
    
    return resultArray;
  };