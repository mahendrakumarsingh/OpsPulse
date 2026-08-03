const Service = require('../models/Service');
const Incident = require('../models/Incident');
const HeartbeatLog = require('../models/HeartbeatLog');

// Execute ping check for a single service
const checkService = async (service, io) => {
  const startTime = Date.now();
  let success = false;
  let statusCode = null;
  let errorMsg = null;
  let responseTime = 0;

  try {
    // Perform synthetic HTTP check with a 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'OpsPulse-Uptime-Monitor/1.0' }
    });

    clearTimeout(timeoutId);
    
    statusCode = response.status;
    responseTime = Date.now() - startTime;
    success = response.ok; // true if status in range 200-299

    if (!success) {
      errorMsg = `Status code: ${statusCode}`;
    }
  } catch (error) {
    responseTime = Date.now() - startTime;
    success = false;
    errorMsg = error.name === 'AbortError' ? 'Ping Request Timeout (5s)' : error.message;
  }

  // 1. Log Heartbeat Telemetry
  await HeartbeatLog.create({
    service: service._id,
    responseTime: success ? responseTime : 0,
    statusCode,
    success,
    error: errorMsg
  });

  // 2. Query historical logs to recalculate Uptime Percentage (last 100 checks)
  const totalLogs = await HeartbeatLog.countDocuments({ service: service._id });
  const successLogs = await HeartbeatLog.countDocuments({ service: service._id, success: true });
  const uptimePercent = totalLogs > 0 ? parseFloat(((successLogs / totalLogs) * 100).toFixed(2)) : 100.0;

  const previousStatus = service.status;
  const currentStatus = success ? 'Operational' : 'Major Outage';

  // 3. Update Service state in database
  service.status = currentStatus;
  service.lastChecked = new Date();
  service.uptimePercent = uptimePercent;
  await service.save();

  // 4. Handle Incident lifecycle transitions
  if (previousStatus === 'Operational' && currentStatus === 'Major Outage') {
    // Transition: Operational -> Down (Trigger Alert)
    // Check if there is already an active (unresolved) incident
    const existingIncident = await Incident.findOne({
      service: service._id,
      status: { $ne: 'Resolved' }
    });

    if (!existingIncident) {
      const newIncident = await Incident.create({
        title: `Synthetic Failure: ${service.name} Outage`,
        description: `Synthetic health checks failed to reach ${service.url}. Diagnostics: ${errorMsg || 'HTTP response error'}.`,
        severity: 'Critical',
        status: 'Triggered',
        service: service._id
      });

      console.log(`[Alert] Critical outage detected on ${service.name}. Incident triggered: ${newIncident._id}`);

      // Broadcast alert in real-time via Socket.io
      io.emit('incident:triggered', {
        incident: newIncident,
        service: { _id: service._id, name: service.name, status: currentStatus, latency: 0 }
      });
    }
  } else if (previousStatus === 'Major Outage' && currentStatus === 'Operational') {
    // Transition: Down -> Recovered (Heal Alert)
    // Find active incidents for this service and resolve them
    const activeIncidents = await Incident.find({
      service: service._id,
      status: { $ne: 'Resolved' }
    });

    for (const incident of activeIncidents) {
      incident.status = 'Resolved';
      incident.resolvedAt = new Date();
      await incident.save();

      console.log(`[Alert] Service ${service.name} has recovered. Incident resolved: ${incident._id}`);

      // Broadcast recovery event via Socket.io
      io.emit('incident:resolved', {
        incident,
        service: { _id: service._id, name: service.name, status: currentStatus, latency: responseTime }
      });
    }
  } else {
    // No status change: Broadcast simple metrics update
    io.emit('service:metrics', {
      serviceId: service._id,
      status: currentStatus,
      latency: success ? responseTime : 0,
      uptimePercent
    });
  }
};

// Scheduler: Fetch all services and verify their health status
const runMonitor = async (io) => {
  try {
    const services = await Service.find({});
    for (const service of services) {
      // For real-world scale, these checks could be run in parallel, but sequential is safe here.
      await checkService(service, io);
    }
  } catch (error) {
    console.error(`[Monitor Service] Running scheduler failed: ${error.message}`);
  }
};

module.exports = { runMonitor };
