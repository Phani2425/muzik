import { Request, Response } from "express";
import { getQueue } from "../utils/utils";
import Room from "../models/Room";
import redis from "../config/redisClient";

export const getRoomTracks = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const tracks = await getQueue(roomId);
    let currPlyerState = null;
    //getting the current player state
    const result = await redis.hexists(`room:${roomId}:currTrack`,"currentTrack");
    if(result){
      currPlyerState = JSON.parse(await redis.hget(`room:${roomId}:currTrack`, "currentTrack") as string); 
    }

    return res.status(200).json({
      success: true,
      message: "Tracks fetched successfully",
      tracks,
      currPlyerState
    });
  } catch (error) {
    console.error("Error fetching room tracks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch room tracks",
    });
  }
};

export const getAdminId = async (req: Request, resp: Response) => {
  try {
    const {roomId} = req.params;
    if(!roomId){
        return resp.status(400).json({
            success:false,
            message:"roomid is not sent"
        })
    }

    const room = await Room.findOne({roomId:roomId});
    if(!room){
        return resp.status(404).json({
            success:false,
            message:"room with this roomid doesnot exists"
        })
    }

    const adminId = room.admin?.userId;

    return resp.status(200).json({
        success:true,
        data:adminId
    })

  } catch (err) {
    console.log("error occured while fetching the adminid",err);
    return resp.status(500).json({
        success:false,
        message:"internal server error"
    })
  }
};
