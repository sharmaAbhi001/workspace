import {Redis} from"ioredis"


export const redis = new Redis({
    host:'127.0.0.1',
    port:6379,
     password: process.env.REDIS_PASSWORD
})


redis.on('error', (err) => {
  console.error('[ioredis] Managed Connection Error Alert:', err.message);
})

redis.on('connect', () => {
    console.log('Successfully authenticated and connected to Redis container instance.');
  });
