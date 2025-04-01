import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import {createServer} from 'http';
import { Server } from 'socket.io';
import { connectToDb } from './config/db';
import redis from './config/redisClient';

const app = express();
app.use(cors({}));
const server = createServer(app);
const io = new Server(server, {cors: {origin: "*"}});

connectToDb();

app.set('io',io);

io.on('connection', (socket) => {
    console.log('user connected with socketid', socket.id);

    socket.on('joinroom',(roomId) => {
       socket.join(roomId);
       console.log(`user with socketId ${socket.id} joined in room having id ${roomId}`);
       io.to(roomId).emit('newuser',`welcome to room ${roomId}`);
    });

    socket.on('addTrack',(track) => {
        //if the track already exist in the set then increase its vote else add it
    });

    socket.on('upvote',(track) => {
        //increase the votes of the track
    })

    socket.on('downvote',(track) => {
        // decrease the vote of the track
    })

    io.on('disconnect', () => {
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
