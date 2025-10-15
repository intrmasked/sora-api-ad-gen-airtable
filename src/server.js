const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const videoRoutes = require('./routes/videoRoutes');
const videoService = require('./services/videoService');
const Logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
  });
  next();
});

// Routes
app.use('/api', videoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Sora Video Stitcher API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      generateVideo: 'POST /api/generate-video',
      processRecord: 'POST /api/process-record',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  Logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  Logger.info(`Server running on port ${PORT}`);
  Logger.info(`Environment: ${config.nodeEnv}`);
  Logger.info(`API endpoints available at http://localhost:${PORT}/api`);

  // Start periodic cleanup of old temp files (every hour)
  const cleanupInterval = 60 * 60 * 1000; // 1 hour
  setInterval(async () => {
    Logger.info('Running periodic temp file cleanup');
    try {
      await videoService.cleanupOldFiles(2); // Delete files older than 2 hours
      Logger.info('Periodic cleanup completed');
    } catch (error) {
      Logger.error('Error during periodic cleanup', error);
    }
  }, cleanupInterval);

  // Run cleanup on startup
  videoService.cleanupOldFiles(2).catch((error) => {
    Logger.error('Error during startup cleanup', error);
  });

  Logger.info('Periodic cleanup scheduler started (runs every hour)');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;
