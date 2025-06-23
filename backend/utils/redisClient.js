const redis = require('redis');

const client = redis.createClient({
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis server refused connection');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 5) { // 5 minutes
      console.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('Redis max retry attempts reached');
      return undefined; // End reconnecting
    }
    // Retry with exponential backoff, capped at 3 seconds
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('error', err => console.error('Redis error:', err));
client.on('reconnecting', () => console.log('Redis reconnecting...'));
client.on('connect', () => console.log('Redis connected'));

// Connect with proper error handling
async function connectRedis() {
  try {
    await client.connect();
    console.log('Redis connection established');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    // Don't terminate the process, as we have retry logic in place
  }
}

connectRedis();

module.exports = client;
