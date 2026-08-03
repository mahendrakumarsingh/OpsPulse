const Incident = require('../models/Incident');
const Service = require('../models/Service');

// @desc    Get all incident logs
// @route   GET /api/incidents
// @access  Private
exports.getIncidents = async (req, res) => {
  try {
    const { status, severity } = req.query;
    let query = {};

    // Apply filtering query params if present
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const incidents = await Incident.find(query)
      .populate('service', 'name url status')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch incidents: ${error.message}`
    });
  }
};

// @desc    Manually trigger a new incident
// @route   POST /api/incidents
// @access  Private (Admin, Responder)
exports.createIncident = async (req, res) => {
  try {
    const { title, description, severity, serviceId } = req.body;

    if (!title || !description || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description and serviceId.'
      });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Associated service not found.'
      });
    }

    // Create incident
    const incident = await Incident.create({
      title,
      description,
      severity: severity || 'Medium',
      service: serviceId
    });

    // Update service status to Degraded/Major Outage based on severity
    service.status = (severity === 'Critical' || severity === 'High') ? 'Major Outage' : 'Degraded';
    await service.save();

    // Broadcast manually triggered incident via Socket.io
    req.io.emit('incident:triggered', {
      incident,
      service: { _id: service._id, name: service.name, status: service.status, latency: 0 }
    });

    res.status(201).json({
      success: true,
      message: 'Incident triggered and broadcasted.',
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to trigger incident: ${error.message}`
    });
  }
};

// @desc    Acknowledge an incident
// @route   PUT /api/incidents/:id/acknowledge
// @access  Private (Admin, Responder)
exports.acknowledgeIncident = async (req, res) => {
  try {
    let incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident record not found.'
      });
    }

    if (incident.status !== 'Triggered') {
      return res.status(400).json({
        success: false,
        message: `Incident is already ${incident.status.toLowerCase()}.`
      });
    }

    // Update fields
    incident.status = 'Acknowledged';
    incident.acknowledgedAt = new Date();
    incident.assignedTo = req.user._id;
    await incident.save();

    // Re-query to populate details
    incident = await Incident.findById(incident._id)
      .populate('service', 'name url status')
      .populate('assignedTo', 'name email');

    // Broadcast incident update
    req.io.emit('incident:acknowledged', incident);

    res.status(200).json({
      success: true,
      message: 'Incident acknowledged.',
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Acknowledge failed: ${error.message}`
    });
  }
};

// @desc    Resolve an incident
// @route   PUT /api/incidents/:id/resolve
// @access  Private (Admin, Responder)
exports.resolveIncident = async (req, res) => {
  try {
    let incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident record not found.'
      });
    }

    if (incident.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Incident is already resolved.'
      });
    }

    // Update incident status
    incident.status = 'Resolved';
    incident.resolvedAt = new Date();
    if (!incident.assignedTo) {
      incident.assignedTo = req.user._id; // assign to resolver if not already acked
    }
    await incident.save();

    // Restore associated service health back to Operational
    const service = await Service.findById(incident.service);
    if (service) {
      service.status = 'Operational';
      await service.save();
    }

    incident = await Incident.findById(incident._id)
      .populate('service', 'name url status')
      .populate('assignedTo', 'name email');

    // Broadcast incident resolution
    req.io.emit('incident:resolved', {
      incident,
      service: service ? { _id: service._id, name: service.name, status: 'Operational', latency: 25 } : null
    });

    res.status(200).json({
      success: true,
      message: 'Incident marked resolved. Service health restored.',
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Resolution failed: ${error.message}`
    });
  }
};

// @desc    Get aggregate MTTA, MTTR and severity counts
// @route   GET /api/incidents/stats
// @access  Private
exports.getIncidentStats = async (req, res) => {
  try {
    const allIncidents = await Incident.find({});

    let totalAcked = 0;
    let totalResolved = 0;
    let sumMTTA = 0; // in milliseconds
    let sumMTTR = 0; // in milliseconds

    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const statusCounts = { Triggered: 0, Acknowledged: 0, Resolved: 0 };

    allIncidents.forEach(inc => {
      // Count severities & statuses
      if (severityCounts[inc.severity] !== undefined) severityCounts[inc.severity]++;
      if (statusCounts[inc.status] !== undefined) statusCounts[inc.status]++;

      // Calculate MTTA (Acknowledge Duration)
      if (inc.acknowledgedAt) {
        totalAcked++;
        sumMTTA += (new Date(inc.acknowledgedAt) - new Date(inc.createdAt));
      }

      // Calculate MTTR (Resolution Duration)
      if (inc.resolvedAt) {
        totalResolved++;
        sumMTTR += (new Date(inc.resolvedAt) - new Date(inc.createdAt));
      }
    });

    // Convert milliseconds to minutes
    const avgMTTAMin = totalAcked > 0 ? parseFloat(((sumMTTA / totalAcked) / 1000 / 60).toFixed(2)) : 0;
    const avgMTTRMin = totalResolved > 0 ? parseFloat(((sumMTTR / totalResolved) / 1000 / 60).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalIncidents: allIncidents.length,
        avgMTTAMin,
        avgMTTRMin,
        severityDistribution: severityCounts,
        statusDistribution: statusCounts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to calculate incident telemetry: ${error.message}`
    });
  }
};
