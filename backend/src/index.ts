import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import { connectToDb } from "./config/db";
import redis from "./config/redisClient";
import Room from "./models/Room";
import router from "./routes/ytSearchRoutes";
import { getQueue, putCurrTrackToTop } from "./utils/utils";
import roomRoutes from "./routes/roomRoutes";
import { max_timestamp, multiplier } from "./utils/constants";

const app = express();
app.use(express.json());
app.use(cors({}));
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use("/api", router);
app.use("/api/rooms", roomRoutes);

connectToDb();

app.set("io", io);

io.on("connection", (socket) => {
  console.log("user connected with socketid", socket.id);

  socket.on("createRoom", async (data) => {
    try {
      const { roomId, userId, userName } = data;

      const room = new Room({
        roomId,
        admin: {
          userId,
          userName,
        },
      });

      await room.save();

      console.log(`Room ${roomId} created with admin ${userName}`);
      socket.emit("roomCreated", roomId);
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("roomCreationFailed");
    }
  });

  socket.on("joinroom", async (roomId) => {
    try {
      const room = await Room.findOne({ roomId: roomId });

      if (!room) {
        console.log(
          `user with socketId ${socket} trying to access a non existent room having roomId ${roomId}`
        );
        socket.emit(
          "no_room",
          `the room with roomId ${roomId} you are trying to join do not exist. Create one to Continue`
        );
        return;
      }

      socket.join(roomId);
      console.log(
        `user with socketId ${socket.id} joined in room having id ${roomId}`
      );
      io.to(roomId).emit("newuser", `welcome to room ${roomId}`);
    } catch (err) {
      console.log("error occured while joining the room", err);
      return;
    }
  });

  socket.on("addtrack", async ({ track, roomId }) => {
    //if the track already exist in the set then increase its vote else add it
    const score = await redis.zscore(`room:${roomId}`, track);
    if (score) {
      const intScore = parseInt(score);
      const votes = Math.round(intScore / multiplier);
      const timesatmp = intScore % multiplier;
      const newScore = (votes + 1) * multiplier + timesatmp;
      await redis.zadd(`room:${roomId}`, newScore, track);
    } else {
      const newScore =
        1 * multiplier + (max_timestamp - Math.floor(Date.now() / 1000));
      await redis.zadd(`room:${roomId}`, newScore, track);
    }
    const queue = await getQueue(roomId);
    // console.log("updated queue", queue);
    io.to(roomId).emit("queue_updated", queue);
  });

  socket.on("trackCompleted", async ({ track, roomId }) => {
    await redis.zrem(`room:${roomId}`, track);

    const queue = await getQueue(roomId);

    io.to(roomId).emit("queue_updated", queue);
  });

  socket.on("upvote", async ({ track, roomid }) => {
    //increase the votes of the track
    const score = await redis.zscore(`room:${roomid}`, track);
    const intScore = parseInt(score!);
    const votes = Math.round(intScore / multiplier);
    const timesatmp = intScore % multiplier;
    const newScore = (votes + 1) * multiplier + timesatmp;
    await redis.zadd(`room:${roomid}`, newScore, track);
    const queue = await getQueue(roomid);
    io.to(roomid).emit("queue_updated", queue);
    io.to(roomid).emit("track_removed");
  });

  socket.on("downvote", async ({ track, roomid }) => {
    const score = await redis.zscore(`room:${roomid}`, track);
    const intScore = parseInt(score!);
    const votes = Math.round(intScore / multiplier);
    const timesatmp = intScore % multiplier;
    const newScore = Math.max(0, votes - 1) * multiplier + timesatmp;
    await redis.zadd(`room:${roomid}`, newScore, track);
    const queue = await getQueue(roomid);
    io.to(roomid).emit("queue_updated", queue);
  });

  socket.on("videoControl", async ({ action, timestamp, roomId }) => {
    // Broadcast the control action to all users in the room except the sender
    socket.to(roomId).emit("videoControlUpdate", {
      action,
      timestamp,
    });
  });

  socket.on("videoSeek", async ({ timestamp, roomId }) => {
    // Broadcast the seek action to all users in the room except the sender
    socket.to(roomId).emit("videoSeekUpdate", {
      timestamp,
    });
  });

  socket.on("skipTrack", (roomId) => {
    socket.to(roomId).emit("track_skipped");
  });

  socket.on("end_space", async (roomId) => {
    try {
      const room = await Room.findOneAndDelete({ roomId: roomId });

      if (!room) {
        console.log(
          `admin is trying to delete room with id ${roomId} which do not exists`
        );
        return;
      }

      const clients = io.sockets.adapter.rooms.get(roomId);
      if (clients) {
        for (const socketId of clients) {
          const socket = io.sockets.sockets.get(socketId);
          socket?.emit(
            "space_ended",
            "Thank you for being part of this space...see you soon 🤗"
          );
          socket?.leave(roomId);
        }
      }
    } catch (err) {
      console.log("error occured while ending space", err);
    }
  });

  socket.on("savePlayerState", async (playerState) => {
    const key = `room:${playerState.roomId}:currTrack`;

    const prevStateStr = await redis.hget(key, "currentTrack");

    if (prevStateStr) {
      try {
        const prevState = JSON.parse(prevStateStr);

        if (prevState.currTrack !== playerState.currTrack) {
          await putCurrTrackToTop(playerState);

          const queue = await getQueue(playerState.roomId);
          io.to(playerState.roomId).emit("queue_updated", queue);
        }
      } catch (err) {
        console.error("Error parsing previous state:", err);
      }
    } else {
      await putCurrTrackToTop(playerState);
      const queue = await getQueue(playerState.roomId);
      io.to(playerState.roomId).emit("queue_updated", queue);
    }

    await redis.hset(key, "currentTrack", JSON.stringify(playerState));
  });

  socket.on("disconnect", () => {
    console.log(`user with socketid ${socket.id} got disconnected`);
  });
});

app.use("/", (req, resp) => {
  resp.send("server is up and running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`server is up and running on port :- ${PORT}`);
});
