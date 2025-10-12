const { Redis } = require('@upstash/redis');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Service for Upstash Redis operations
 */
class RedisService {
  constructor() {
    if (config.upstash.url && config.upstash.token) {
      this.redis = new Redis({
        url: config.upstash.url,
        token: config.upstash.token,
      });
      Logger.info('Redis service initialized');
    } else {
      Logger.warn('Redis not configured - running without persistence');
      this.redis = null;
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobId, data) {
    if (!this.redis) {
      Logger.warn('Redis not available, cannot persist job');
      return;
    }

    try {
      const jobData = {
        jobId,
        status: 'pending',
        createdAt: Date.now(),
        ...data,
      };

      await this.redis.set(
        `job:${jobId}`,
        JSON.stringify(jobData),
        { ex: config.job.ttl }
      );

      Logger.info('Job created in Redis', { jobId });
      return jobData;
    } catch (error) {
      Logger.error('Error creating job in Redis', error);
      throw error;
    }
  }

  /**
   * Get job data
   */
  async getJob(jobId) {
    if (!this.redis) {
      return null;
    }

    try {
      const data = await this.redis.get(`job:${jobId}`);
      if (!data) {
        return null;
      }

      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      Logger.error('Error getting job from Redis', error);
      return null;
    }
  }

  /**
   * Update job data
   */
  async updateJob(jobId, updates) {
    if (!this.redis) {
      Logger.warn('Redis not available, cannot update job');
      return;
    }

    try {
      const job = await this.getJob(jobId);
      if (!job) {
        Logger.warn('Job not found in Redis', { jobId });
        return null;
      }

      const updatedJob = {
        ...job,
        ...updates,
        updatedAt: Date.now(),
      };

      await this.redis.set(
        `job:${jobId}`,
        JSON.stringify(updatedJob),
        { ex: config.job.ttl }
      );

      Logger.info('Job updated in Redis', { jobId, updates });
      return updatedJob;
    } catch (error) {
      Logger.error('Error updating job in Redis', error);
      throw error;
    }
  }

  /**
   * Store Sora task mapping (jobId -> taskId)
   */
  async mapTaskToJob(taskId, jobId, videoNumber) {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.set(
        `task:${taskId}`,
        JSON.stringify({ jobId, videoNumber }),
        { ex: config.job.ttl }
      );

      Logger.info('Task mapped to job', { taskId, jobId, videoNumber });
    } catch (error) {
      Logger.error('Error mapping task to job', error);
      throw error;
    }
  }

  /**
   * Get job ID from Sora task ID
   */
  async getJobFromTask(taskId) {
    if (!this.redis) {
      return null;
    }

    try {
      const data = await this.redis.get(`task:${taskId}`);
      if (!data) {
        return null;
      }

      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      Logger.error('Error getting job from task', error);
      return null;
    }
  }

  /**
   * Delete job data
   */
  async deleteJob(jobId) {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.del(`job:${jobId}`);
      Logger.info('Job deleted from Redis', { jobId });
    } catch (error) {
      Logger.error('Error deleting job from Redis', error);
    }
  }

  /**
   * Check if both videos are ready for a job
   */
  async areBothVideosReady(jobId) {
    const job = await this.getJob(jobId);
    if (!job) {
      return false;
    }

    return !!(job.video1Url && job.video2Url);
  }

  /**
   * Store video URL for a job
   */
  async storeVideoUrl(jobId, videoNumber, url) {
    const field = `video${videoNumber}Url`;
    return await this.updateJob(jobId, { [field]: url });
  }
}

module.exports = new RedisService();
