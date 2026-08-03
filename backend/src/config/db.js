const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opspulse';
  
  try {
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    console.log('[Database] Running in database-disconnected fallback mode. Database dependencies will fail.');
  }
};

module.exports = connectDB;
