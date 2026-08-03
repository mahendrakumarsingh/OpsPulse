const mongoose = require('mongoose');

const seedDefaultServices = async () => {
  try {
    const Service = require('../models/Service');
    const serviceCount = await Service.countDocuments();
    
    if (serviceCount === 0) {
      console.log('[Database] Seeding default microservice monitoring targets...');
      
      const defaults = [
        { name: 'User Authentication Portal', url: 'https://auth.opspulse.local/health', checkInterval: 30, uptimePercent: 99.98 },
        { name: 'Billing & Subscriptions API', url: 'https://billing.opspulse.local/health', checkInterval: 60, uptimePercent: 99.85 },
        { name: 'Asset Delivery CDN', url: 'https://cdn.opspulse.local/status', checkInterval: 30, uptimePercent: 100.00 },
        { name: 'Primary Mongo Database Cluster', url: 'mongodb://db-primary.opspulse.local:27017', checkInterval: 30, uptimePercent: 99.99 }
      ];
      
      await Service.create(defaults);
      console.log('[Database] Seeded 4 default services.');
    }
  } catch (error) {
    console.error(`[Database] Auto-seeding failed: ${error.message}`);
  }
};

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opspulse';
  
  try {
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    
    // Run the auto-seed routine
    await seedDefaultServices();
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    console.log('[Database] Running in database-disconnected fallback mode. Database dependencies will fail.');
  }
};

module.exports = connectDB;
