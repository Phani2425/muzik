import { Request, Response } from "express";
import { getQueue } from "../utils/utils";

export const getRoomTracks = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required"
      });
    }

    const tracks = await getQueue(roomId);
    
    return res.status(200).json({
      success: true,
      message: "Tracks fetched successfully",
      tracks
    });
  } catch (error) {
    console.error("Error fetching room tracks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch room tracks"
    });
  }
};