const Service = require('../models/Service');
const HeartbeatLog = require('../models/HeartbeatLog');
const Incident = require('../models/Incident');

// @desc    Get all monitored services
// @route   GET /api/services
// @access  Private
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({}).populate('owner', 'name email');
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch services: ${error.message}`
    });
  }
};

// @desc    Get metrics for a specific service
// @route   GET /api/services/:id/metrics
// @access  Private
exports.getServiceMetrics = async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Monitored service not found.'
      });
    }

    // Retrieve last 30 heartbeat logs
    const logs = await HeartbeatLog.find({ service: serviceId })
      .sort({ timestamp: -1 })
      .limit(30);

    // Calculate aggregated values
    const responseTimes = logs.filter(l => l.success).map(l => l.responseTime);
    const avgLatency = responseTimes.length > 0 
      ? parseFloat((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)) 
      : 0;

    res.status(200).json({
      success: true,
      service: {
        _id: service._id,
        name: service.name,
        status: service.status,
        uptimePercent: service.uptimePercent
      },
      metrics: {
        avgLatencyMs: avgLatency,
        totalChecks: logs.length,
        successChecks: logs.filter(l => l.success).length,
        history: logs.reverse() // Sort chronologically for frontend charting
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch service metrics: ${error.message}`
    });
  }
};

// @desc    Add a new service to monitor
// @route   POST /api/services
// @access  Private (Admin, Responder)
exports.createService = async (req, res) => {
  try {
    const { name, url, checkInterval } = req.body;

    // Validate inputs
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and URL.'
      });
    }

    // Check if name already registered
    const exists = await Service.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A monitored service with this name already exists.'
      });
    }

    const service = await Service.create({
      name,
      url,
      checkInterval: checkInterval || 60,
      owner: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Service registered for monitoring.',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to register service: ${error.message}`
    });
  }
};

// @desc    Update monitored service parameters
// @route   PUT /api/services/:id
// @access  Private (Admin, Responder)
exports.updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    let service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Monitored service not found.'
      });
    }

    // Perform updates
    service = await Service.findByIdAndUpdate(serviceId, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Service monitor settings updated.',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update service: ${error.message}`
    });
  }
};

// @desc    Delete service monitor and clear logs
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
exports.deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Monitored service not found.'
      });
    }

    // Delete associated heartbeat logs, active incidents, and service itself
    await HeartbeatLog.deleteMany({ service: serviceId });
    await Incident.deleteMany({ service: serviceId });
    await Service.findByIdAndDelete(serviceId);

    res.status(200).json({
      success: true,
      message: 'Service monitor and associated metrics deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete service: ${error.message}`
    });
  }
};
