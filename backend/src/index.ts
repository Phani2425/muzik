import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import {Server} from 'http'

const app = express();
app.use(cors({}));
const server = new Server(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, ()=>{
  console.log(`server is up and runni g on port :- ${PORT}`)
})
