const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide service name'],
    trim: true,
    unique: true
  },
  url: {
    type: String,
    required: [true, 'Please provide service target health url'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Operational', 'Degraded', 'Major Outage'],
    default: 'Operational'
  },
  checkInterval: {
    type: Number,
    default: 60, // in seconds
    min: [10, 'Minimum check interval is 10 seconds']
  },
  lastChecked: {
    type: Date
  },
  uptimePercent: {
    type: Number,
    default: 100.0,
    min: 0,
    max: 100
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', ServiceSchema);
