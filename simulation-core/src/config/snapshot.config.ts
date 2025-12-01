// Configuration for Phase 4 State Synchronization
export const SNAPSHOT_CONFIG = {
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SNAPSHOT_TTL: parseInt(process.env.SNAPSHOT_TTL || '600'), // 10 minutes in seconds
  ARCHIVE_INTERVAL: parseInt(process.env.ARCHIVE_INTERVAL || '100'), // Archive every 100 ticks
  WORLD_ID: process.env.WORLD_ID || 'default'
};
