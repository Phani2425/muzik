import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import {createServer} from 'http';
import { Server } from 'socket.io';
import { connectToDb } from './config/db';
import redis from './config/redisClient';
import Room from './models/Room';

const app = express();
app.use(cors({}));
const server = createServer(app);
const io = new Server(server, {cors: {origin: "*"}});

const getQueue = async (roomId:string) => {
    const key = `room:${roomId}`;
    const trackList = await redis.zrevrange(key, 0, -1, "WITHSCORES");
  
    let queue = [];
    for (let i = 0; i < trackList.length; i += 2) {
        const track = {
            name:trackList[i],
            votes:trackList[i + 1]
        }
      queue.push(track);
    }
  
    return queue;
  };

connectToDb();

app.set('io',io);

io.on('connection', (socket) => {
    console.log('user connected with socketid', socket.id);

    socket.on('createRoom', async (data) => {
        try {
          const { roomId, userId, userName } = data;

          const room = new Room({
            roomId,
            admin: {
              userId,
              userName
            }
          });

          await room.save();

          console.log(`Room ${roomId} created with admin ${userName}`);
          socket.emit('roomCreated', { success: true, roomId });
        } catch (error) {
          console.error('Error creating room:', error);
          socket.emit('roomCreated', { success: false, error: 'Failed to create room' });
        }
      });

    socket.on('joinroom',(roomId) => {
       socket.join(roomId);
       console.log(`user with socketId ${socket.id} joined in room having id ${roomId}`);
       io.to(roomId).emit('newuser',`welcome to room ${roomId}`);
    });

    socket.on('addtrack',async ({track,roomId}) => {
        //if the track already exist in the set then increase its vote else add it
        await redis.zadd(`room:${roomId}`,1,track);
        const queue = await getQueue(roomId);
        console.log('updated queue',queue);
        io.to(roomId).emit('queue_updated',queue);
    });

    socket.on('upvote',async({track,roomid}) => {
        //increase the votes of the track
        await redis.zincrby(`room:${roomid}`,1,track);
        const queue = await getQueue(roomid);
        io.to(roomid).emit('queue_updated',queue);
    })

    socket.on('downvote',async({track,roomid}) => {
        // decrease the vote of the track
        await redis.zincrby(`room:${roomid}`,-1,track);
        const queue = await getQueue(roomid);
        io.to(roomid).emit('queue_updated',queue);
    })

    socket.on('disconnect', () => {
        console.log(`user with socketid ${socket.id} got disconnected`);
    })
})

app.use('/', (req,resp) => {
    resp.send('server is up and running');
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=>{
  console.log(`server is up and running on port :- ${PORT}`)
})
