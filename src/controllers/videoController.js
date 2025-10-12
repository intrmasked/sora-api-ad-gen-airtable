const { v4: uuidv4 } = require('crypto');
const soraService = require('../services/soraService');
const redisService = require('../services/redisService');
const jobProcessor = require('../services/jobProcessor');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Generate a unique job ID
 */
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Controller for video generation and stitching workflow
 */
class VideoController {
  /**
   * Generate and stitch videos from two prompts (async with callbacks)
   * POST /api/generate-video
   * Body: { prompt1, prompt2, recordId, aspectRatio }
   */
  async generateAndStitch(req, res) {
    const { prompt1, prompt2, recordId, aspectRatio = 'landscape' } = req.body;

    // Validate inputs
    if (!prompt1 || !prompt2) {
      return res.status(400).json({
        success: false,
        error: 'Both prompt1 and prompt2 are required',
      });
    }

    const jobId = generateJobId();

    Logger.info('Starting async video generation workflow', {
      jobId,
      prompt1,
      prompt2,
      recordId,
      aspectRatio,
    });

    try {
      // Create job in Redis
      await redisService.createJob(jobId, {
        prompt1,
        prompt2,
        recordId,
        aspectRatio,
        status: 'pending',
      });

      // Build callback URL
      const callbackUrl = `${config.publicUrl}/api/callback/sora`;

      // Create both Sora tasks with callback URLs
      Logger.info('Creating Sora tasks with callbacks', { jobId });

      const [taskId1, taskId2] = await Promise.all([
        soraService.createTask(prompt1, aspectRatio, callbackUrl),
        soraService.createTask(prompt2, aspectRatio, callbackUrl),
      ]);

      Logger.info('Both Sora tasks created', { jobId, taskId1, taskId2 });

      // Map tasks to job in Redis
      await Promise.all([
        redisService.mapTaskToJob(taskId1, jobId, 1),
        redisService.mapTaskToJob(taskId2, jobId, 2),
      ]);

      // Update job with task IDs
      await redisService.updateJob(jobId, {
        taskId1,
        taskId2,
        status: 'generating',
      });

      // Return immediately with job ID
      return res.status(202).json({
        success: true,
        message: 'Video generation started. Use the jobId to check status.',
        data: {
          jobId,
          taskId1,
          taskId2,
          statusUrl: `${config.publicUrl}/api/job/${jobId}`,
        },
      });
    } catch (error) {
      Logger.error('Error starting video generation', error);

      // Clean up job on error
      if (jobId) {
        await jobProcessor.handleJobFailure(jobId, { recordId }, error.message);
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Receive Sora callback notifications
   * POST /api/callback/sora
   * Body: Sora callback payload (same as Query Task API response)
   */
  async handleSoraCallback(req, res) {
    try {
      const callbackData = req.body;

      Logger.info('Received Sora callback', {
        taskId: callbackData.data?.taskId,
        state: callbackData.data?.state,
      });

      // Validate callback data
      if (!callbackData.data || !callbackData.data.taskId) {
        Logger.warn('Invalid callback data received', callbackData);
        return res.status(400).json({
          success: false,
          error: 'Invalid callback data',
        });
      }

      const taskData = callbackData.data;

      // Process callback asynchronously (don't wait)
      jobProcessor.processCallback(taskData.taskId, taskData).catch((error) => {
        Logger.error('Error in async callback processing', error);
      });

      // Respond immediately to Sora
      return res.status(200).json({
        success: true,
        message: 'Callback received',
      });
    } catch (error) {
      Logger.error('Error handling Sora callback', error);

      // Still return 200 to Sora to prevent retries
      return res.status(200).json({
        success: true,
        message: 'Callback received with errors',
      });
    }
  }

  /**
   * Get job status
   * GET /api/job/:jobId
   */
  async getJobStatus(req, res) {
    const { jobId } = req.params;

    try {
      const job = await redisService.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }

      // Build response based on job status
      const response = {
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
      };

      // Add additional fields based on status
      if (job.status === 'completed') {
        response.data.completedAt = job.completedAt;
        response.data.video1Url = job.video1Url;
        response.data.video2Url = job.video2Url;
        if (job.recordId) {
          response.data.recordId = job.recordId;
        }
      } else if (job.status === 'failed') {
        response.data.failedAt = job.failedAt;
        response.data.error = job.error;
      } else if (job.status === 'generating' || job.status === 'processing') {
        response.data.video1Status = job.video1Status || 'pending';
        response.data.video2Status = job.video2Status || 'pending';
      }

      return res.status(200).json(response);
    } catch (error) {
      Logger.error('Error getting job status', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Process an Airtable record by fetching prompts from it
   * POST /api/process-record
   * Body: { recordId, aspectRatio }
   */
  async processRecord(req, res) {
    const { recordId, aspectRatio = 'landscape' } = req.body;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'recordId is required',
      });
    }

    try {
      // Fetch record from Airtable
      Logger.info('Fetching record from Airtable', { recordId });
      const airtableService = require('../services/airtableService');
      const record = await airtableService.getRecord(recordId);

      const prompt1 = record.fields['Prompt 1'] || record.fields['Prompt1'];
      const prompt2 = record.fields['Prompt 2'] || record.fields['Prompt2'];

      if (!prompt1 || !prompt2) {
        throw new Error(
          'Record must have "Prompt 1" and "Prompt 2" fields (or "Prompt1" and "Prompt2")'
        );
      }

      // Use the generateAndStitch workflow
      req.body.prompt1 = prompt1;
      req.body.prompt2 = prompt2;
      return await this.generateAndStitch(req, res);
    } catch (error) {
      Logger.error('Error processing record', error);

      if (recordId) {
        const airtableService = require('../services/airtableService');
        await airtableService.updateRecordStatus(
          recordId,
          'Failed',
          error.message
        );
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/health
   */
  async healthCheck(req, res) {
    return res.status(200).json({
      success: true,
      message: 'API is running',
      mode: 'async-callback',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new VideoController();
