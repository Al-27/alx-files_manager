import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    const client = createClient();
    client.on('error', (e) => {
      console.log(e);
    });

    this.getAsync = promisify(client.get).bind(client);
    this.client = client;
  }

  async get(key) {
    const val = await this.getAsync(key);
    return val;
  }

  async set(key, val, dur) {
    await this.client.set(key, val, 'EX', dur);
    // setTimeout(() => this.del(key), dur * 1000);
  }

  async del(key) {
    await this.client.del(key);
  }

  isAlive() {
    return this.client.connected;
  }
}

const redisClient = new RedisClient();

export default redisClient;
