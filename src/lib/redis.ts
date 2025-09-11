import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set in environment variables');
}

// Create a new Redis client instance.
// The client will be reused across different parts of the application.
// This syntax ensures the full URL, including password, is used for connection.
const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => console.error('Redis Client Error', err));

export default redis;
