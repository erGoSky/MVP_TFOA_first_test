import { createClient, RedisClientType } from 'redis';
import { SNAPSHOT_CONFIG } from '../config/snapshot.config';

export class RedisClient {
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.client = createClient({
        url: SNAPSHOT_CONFIG.REDIS_URL
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
      });

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      console.log('Redis Client Disconnected');
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) throw new Error('Redis client not connected');
    
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not connected');
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.keys(pattern);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
export const redisClient = new RedisClient();
