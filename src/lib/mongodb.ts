import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as { mongoose?: { conn: null | typeof mongoose; promise: null | Promise<typeof mongoose> } }).mongoose;

if (!cached) {
  cached = (global as { mongoose?: { conn: null | typeof mongoose; promise: null | Promise<typeof mongoose> } }).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If already connected, return cached connection
  if (cached?.conn) {
    console.log('🔄 Using cached MongoDB connection');
    return cached.conn;
  }

  // If no promise exists, create one
  if (!cached?.promise) {
    console.log('🔌 Connecting to MongoDB...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 MongoDB URI:', MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    if (cached) {
      cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        console.log('📊 Database name:', mongoose.connection.name);
        return mongoose;
      });
    }
  }

  try {
    if (cached) {
      cached.conn = await cached.promise;
    }
  } catch (e) {
    console.error('❌ MongoDB connection failed:', e);
    if (cached) {
      cached.promise = null;
    }
    throw e;
  }

  return cached?.conn;
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

export default connectDB;