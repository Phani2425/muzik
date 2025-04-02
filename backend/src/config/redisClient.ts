import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis({
    host:process.env.REDIS_PUBLIC_ENDPOINT,
    port:process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT,10) : undefined,
    password:process.env.REDIS_PASSWORD,
    retryStrategy:(times) => Math.min(times*50,2000)
});

redis.on('connect',() => {
    console.log('redis connected successfully');
})

redis.on('error',(err) => {
    console.error(err.message);
    console.log('error occured while connecting to redis',err.message);
})

export default redis;