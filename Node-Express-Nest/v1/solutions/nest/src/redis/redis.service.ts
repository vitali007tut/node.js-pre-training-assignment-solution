import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client = createClient({
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  });

  constructor() {
    this.client.on('error', (error) => {
      console.error('[Redis] Client error:', error);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
