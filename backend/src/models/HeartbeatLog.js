const mongoose = require('mongoose');

const HeartbeatLogSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  responseTime: {
    type: Number, // latency in milliseconds
    default: 0
  },
  statusCode: {
    type: Number // HTTP response code (e.g., 200, 404, 502)
  },
  success: {
    type: Boolean,
    required: [true, 'Heartbeat success status is required']
  },
  error: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound Index to query logs by service and timestamp quickly
HeartbeatLogSchema.index({ service: 1, timestamp: -1 });

module.exports = mongoose.model('HeartbeatLog', HeartbeatLogSchema);
