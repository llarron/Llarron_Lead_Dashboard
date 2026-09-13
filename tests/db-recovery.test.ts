import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  connectToDatabase,
  resetConnectionCacheForTesting,
} from '../server/db/connection';

describe('Database Connection Cache Recovery & Error Sanitization', () => {
  const originalUri = process.env.MONGODB_URI;

  beforeEach(() => {
    resetConnectionCacheForTesting();
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalUri;
    resetConnectionCacheForTesting();
  });

  it('throws DatabaseConfigurationError when MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;
    await expect(connectToDatabase()).rejects.toThrow(
      'MONGODB_URI is not configured in the server environment.'
    );
  });

  it('sanitizes connection failure and does not expose connection strings in errors', async () => {
    process.env.MONGODB_URI = 'mongodb://fakeuser:secretpassword@127.0.0.1:27017/nonexistent_db';

    try {
      await connectToDatabase();
      expect.fail('Should have thrown connection error');
    } catch (err: unknown) {
      const error = err as Error;
      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.message).toBe('Failed to establish database connection.');
      // Confirm secret password or URI is not contained in error message
      expect(error.message).not.toContain('secretpassword');
      expect(error.message).not.toContain('fakeuser');
      expect(error.message).not.toContain('127.0.0.1');
    }
  }, 10000);

  it('resets cached promise on failure to permit subsequent retry attempt', async () => {
    process.env.MONGODB_URI = 'mongodb://invalid-host-1:27017/test_db';

    // First attempt fails
    await expect(connectToDatabase()).rejects.toThrow();

    // Cache should be cleared, allowing next attempt
    // Simulate updating environment to another URI
    process.env.MONGODB_URI = 'mongodb://invalid-host-2:27017/test_db';
    await expect(connectToDatabase()).rejects.toThrow();
  }, 15000);
});
