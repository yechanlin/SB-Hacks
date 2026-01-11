import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables in this module
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-agent';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  // Log connection attempt (mask password for security)
  const maskedUri = MONGODB_URI.includes('@')
    ? MONGODB_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
    : MONGODB_URI;
  console.log(`\n🔌 Attempting to connect to MongoDB: ${maskedUri}`);

  // Extract and log cluster info for debugging (without credentials)
  try {
    const uriMatch = MONGODB_URI.match(/mongodb\+srv:\/\/[^:]+:[^@]+@([^/]+)\/([^?]+)/);
    if (uriMatch) {
      console.log(`   Cluster: ${uriMatch[1]}`);
      console.log(`   Database: ${uriMatch[2]}`);
    }
  } catch (e) {
    // Ignore parsing errors
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased to 30s for Atlas
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Connection timeout
      retryWrites: true,
      retryReads: true,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message || error);

    // Provide specific guidance for common errors
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Troubleshooting tips:');

      // Check if it's a ReplicaSetNoPrimary error (common with Atlas)
      if (error.reason?.type === 'ReplicaSetNoPrimary') {
        console.error('⚠️  Detected ReplicaSetNoPrimary - connection reached servers but can\'t find primary');
        console.error('   This usually indicates:');
        console.error('   1. ❌ Authentication failed - WRONG USERNAME OR PASSWORD');
        console.error('      → Verify username/password in MongoDB Atlas → Database Access');
        console.error('      → Make sure password has no typos or extra spaces');
        console.error('   2. Network latency/timeout (try again in a moment)');
        console.error('   3. Cluster is still initializing');
        console.error('\n   🔍 Quick check:');
        console.error('   - Go to MongoDB Atlas → Database Access');
        console.error('   - Find user "sbHacks_db" and verify password matches');
        console.error('   - Check user has "Read and write to any database" role');
      }

      // Check for authentication errors
      if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
        console.error('\n❌ AUTHENTICATION FAILED');
        console.error('   Your username or password is incorrect');
        console.error('   Double-check your MONGODB_URI in .env file');
        console.error('   Verify credentials in MongoDB Atlas → Database Access');
      }

      console.error('\n1. Verify your MONGODB_URI in .env file is correct');
      console.error('   Format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
      console.error('2. Check your MongoDB Atlas credentials:');
      console.error('   - Username and password are correct');
      console.error('   - Database user has proper permissions');
      console.error('3. Ensure your IP is whitelisted (you mentioned this is done):');
      console.error('   https://www.mongodb.com/docs/atlas/security-whitelist/');
      console.error('4. Try connecting directly from MongoDB Compass or Atlas UI to verify');
      console.error('5. For local development:');
      console.error('   brew services start mongodb-community (macOS)');
      console.error('   or: mongod --dbpath /path/to/data');
    }

    // Don't throw - let the server continue without database
    isConnected = false;
    return;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
    throw error;
  }
}

export { mongoose };
