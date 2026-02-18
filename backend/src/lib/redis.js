import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1
});

redis.on('error', (error) => {
  console.error('Redis error:', error.message);
});

export default redis;
