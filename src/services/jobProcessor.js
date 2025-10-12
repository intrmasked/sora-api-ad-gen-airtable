const redisService = require('./redisService');
const videoService = require('./videoService');
const airtableService = require('./airtableService');
const Logger = require('../utils/logger');

/**
 * Service for processing video generation jobs asynchronously
 */
class JobProcessor {
  /**
   * Process a completed Sora task callback
   * @param {string} taskId - Sora task ID
   * @param {Object} taskData - Task data from Sora callback
   */
  async processCallback(taskId, taskData) {
    try {
      Logger.info('Processing Sora callback', { taskId, state: taskData.state });

      // Get job info from task ID
      const taskMapping = await redisService.getJobFromTask(taskId);
      if (!taskMapping) {
        Logger.warn('No job mapping found for task', { taskId });
        return;
      }

      const { jobId, videoNumber } = taskMapping;
      Logger.info('Found job mapping', { taskId, jobId, videoNumber });

      // Get job data
      const job = await redisService.getJob(jobId);
      if (!job) {
        Logger.warn('Job not found', { jobId });
        return;
      }

      // Check if task failed
      const soraService = require('./soraService');
      const error = soraService.getTaskError(taskData);
      if (error) {
        Logger.error('Sora task failed', { taskId, jobId, error });
        await this.handleJobFailure(jobId, job, `Video ${videoNumber} generation failed: ${error.message}`);
        return;
      }

      // Extract video URL
      const videoUrl = soraService.extractVideoUrl(taskData);
      if (!videoUrl) {
        Logger.error('No video URL in callback', { taskId, jobId });
        await this.handleJobFailure(jobId, job, `Video ${videoNumber} generation completed but no URL found`);
        return;
      }

      Logger.info('Video generated successfully', { taskId, jobId, videoNumber, videoUrl });

      // Store video URL in Redis
      await redisService.storeVideoUrl(jobId, videoNumber, videoUrl);

      // Check if both videos are ready
      const bothReady = await redisService.areBothVideosReady(jobId);
      if (bothReady) {
        Logger.info('Both videos ready, starting stitching', { jobId });
        await this.processStitching(jobId);
      } else {
        Logger.info('Waiting for other video', { jobId, videoNumber });
        await redisService.updateJob(jobId, {
          status: 'processing',
          [`video${videoNumber}Status`]: 'ready'
        });
      }
    } catch (error) {
      Logger.error('Error processing callback', error);
      throw error;
    }
  }

  /**
   * Stitch videos and upload to Airtable
   * @param {string} jobId - Job ID
   */
  async processStitching(jobId) {
    let stitchedVideoPath = null;

    try {
      // Get job data
      const job = await redisService.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const { video1Url, video2Url, recordId } = job;

      Logger.info('Starting video stitching', { jobId, video1Url, video2Url });

      // Update status
      await redisService.updateJob(jobId, { status: 'stitching' });
      if (recordId) {
        await airtableService.updateRecordStatus(recordId, 'Stitching');
      }

      // Download and stitch videos
      stitchedVideoPath = await videoService.processVideos(video1Url, video2Url);
      Logger.info('Videos stitched successfully', { jobId, stitchedVideoPath });

      // Upload to Airtable if recordId provided
      if (recordId) {
        Logger.info('Uploading to Airtable', { jobId, recordId });
        await redisService.updateJob(jobId, { status: 'uploading' });

        await airtableService.uploadVideoAttachment(
          recordId,
          stitchedVideoPath,
          'Video'
        );

        await airtableService.updateRecordStatus(recordId, 'Completed');
        Logger.info('Video uploaded to Airtable', { jobId, recordId });
      }

      // Update job status to completed
      await redisService.updateJob(jobId, {
        status: 'completed',
        completedAt: Date.now(),
        stitchedVideoPath: stitchedVideoPath,
      });

      // Clean up stitched video
      await videoService.deleteFile(stitchedVideoPath);

      Logger.info('Job completed successfully', { jobId });
    } catch (error) {
      Logger.error('Error processing stitching', { jobId, error });

      // Clean up stitched video if exists
      if (stitchedVideoPath) {
        await videoService.deleteFile(stitchedVideoPath);
      }

      const job = await redisService.getJob(jobId);
      await this.handleJobFailure(jobId, job, `Stitching/upload failed: ${error.message}`);

      throw error;
    }
  }

  /**
   * Handle job failure
   * @param {string} jobId - Job ID
   * @param {Object} job - Job data
   * @param {string} errorMessage - Error message
   */
  async handleJobFailure(jobId, job, errorMessage) {
    try {
      Logger.error('Handling job failure', { jobId, errorMessage });

      // Update job status
      await redisService.updateJob(jobId, {
        status: 'failed',
        error: errorMessage,
        failedAt: Date.now(),
      });

      // Update Airtable if recordId exists
      if (job?.recordId) {
        await airtableService.updateRecordStatus(
          job.recordId,
          'Failed',
          errorMessage
        );
      }
    } catch (error) {
      Logger.error('Error handling job failure', error);
    }
  }
}

module.exports = new JobProcessor();
