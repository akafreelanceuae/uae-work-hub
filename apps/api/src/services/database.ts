/**
 * Database Connection Service
 * MongoDB connection with UAE-specific configurations and compliance
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uae_workhub';

// Connection options for GCC compliance
const connectionOptions: mongoose.ConnectOptions = {
  // Connection pool settings
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  
  // Enable compression for Arabic text
  compressors: ['zlib'],
  
  // Authentication and security
  authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Write concern for data integrity (required for compliance)
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 5000
  }
};

/**
 * Connect to MongoDB with retry logic
 */
export async function connectDatabase(): Promise<void> {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Set up event listeners before connection
    mongoose.connection.on('connected', () => {
      console.log('✅ Connected to MongoDB');
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    // Configure mongoose for UAE-specific requirements
    mongoose.set('sanitizeFilter', true);
    mongoose.set('runValidators', true);
    mongoose.set('strictQuery', true);
    
    console.log('✅ Database connection established');
    console.log(`📍 Connected to: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`🗄️ Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    
    // Retry connection after 5 seconds
    setTimeout(connectDatabase, 5000);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Check database connection health
 */
export function getDatabaseHealth() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[state as keyof typeof states] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name,
    collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0
  };
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

export { mongoose };