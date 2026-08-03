const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment configurations
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS settings matching frontend
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Connect to Database
connectDB();

// Global Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Web Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} request received at ${req.originalUrl}`);
  next();
});

// Share Socket.io instance with Express Request contexts
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/incidents', require('./routes/incidents'));

// Basic Health Check Endpoint
app.get('/health', (req, res) => {
  const dbStatus = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const mongoose = require('mongoose');
  
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    database: dbStatus[mongoose.connection.readyState] || 'Disconnected',
    system: {
      memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      nodeVersion: process.version
    }
  });
});

// Socket.io Connection Handlers
io.on('connection', (socket) => {
  console.log(`[WebSocket] New client session connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client session disconnected: ${socket.id}`);
  });
});

// Uptime Monitor Cron Scheduler (Runs every 30 seconds)
const cron = require('node-cron');
const { runMonitor } = require('./services/monitor');

cron.schedule('*/30 * * * * *', () => {
  console.log('[Scheduler] Executing synthetic monitoring loop...');
  runMonitor(io);
});

// Start Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] OpsPulse Core API listening on port ${PORT}`);
});

module.exports = { app, server };
