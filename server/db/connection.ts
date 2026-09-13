import mongoose from 'mongoose';
import '../models';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Safe cached database connection helper.
 * - Reuses existing active connection (readyState === 1).
 * - Shares single in-flight connection promise to prevent stampede.
 * - Resets cache on connection failure to allow subsequent retries.
 * - Enforces finite server selection timeout (5000ms).
 * - Sanitizes error messages to protect connection strings and credentials.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const error = new Error('MONGODB_URI is not configured in the server environment.');
    error.name = 'DatabaseConfigurationError';
    throw error;
  }

  // If already connected and connection is alive, return cached connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If previous connection died or is disconnected, clear cached connection
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      dbName: 'llarron_db',
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        // Reset both connection and promise cache on failure to allow retry
        cached.conn = null;
        cached.promise = null;
        const sanitizedErr = new Error('Failed to establish database connection.');
        sanitizedErr.name = 'DatabaseConnectionError';
        sanitizedErr.cause = err instanceof Error ? err.name : 'UnknownError';
        throw sanitizedErr;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

/**
 * Utility for testing cache reset behavior
 */
export function resetConnectionCacheForTesting(): void {
  cached.conn = null;
  cached.promise = null;
}

export default connectToDatabase;
