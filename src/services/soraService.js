const axios = require('axios');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Service for interacting with Sora 2 Text To Video API with callback support
 */
class SoraService {
  constructor() {
    this.baseUrl = config.sora.baseUrl;
    this.apiKey = config.sora.apiKey;
  }

  /**
   * Create a video generation task with callback URL
   * @param {string} prompt - The video prompt
   * @param {string} aspectRatio - 'portrait' or 'landscape'
   * @param {string} callbackUrl - URL to receive completion notification
   * @returns {Promise<string>} - Task ID
   */
  async createTask(prompt, aspectRatio = 'landscape', callbackUrl = null) {
    try {
      Logger.info('Creating Sora task with callback', {
        prompt,
        aspectRatio,
        callbackUrl
      });

      const requestBody = {
        model: 'sora-2-pro-text-to-video',
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          n_frames: '15',
          size: "standard",
          remove_watermark: true
        },
      };

      // Add callback URL if provided
      if (callbackUrl) {
        requestBody.callBackUrl = callbackUrl;
      }

      const response = await axios.post(
        `${this.baseUrl}/jobs/createTask`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Failed to create task: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;
      Logger.info('Task created successfully', { taskId });
      return taskId;
    } catch (error) {
      Logger.error('Error creating Sora task', error);
      throw new Error(`Failed to create Sora task: ${error.message}`);
    }
  }

  /**
   * Query task status (for manual checking if needed)
   * @param {string} taskId - The task ID
   * @returns {Promise<Object>} - Task data
   */
  async queryTask(taskId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/jobs/recordInfo`,
        {
          params: { taskId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Failed to query task: ${response.data.msg}`);
      }

      return response.data.data;
    } catch (error) {
      Logger.error('Error querying Sora task', error);
      throw new Error(`Failed to query Sora task: ${error.message}`);
    }
  }

  /**
   * Extract video URL from Sora callback/result data
   * @param {Object} taskData - Task data from Sora
   * @returns {string|null} - Video URL or null
   */
  extractVideoUrl(taskData) {
    try {
      if (taskData.state !== 'success') {
        return null;
      }

      const resultJson = typeof taskData.resultJson === 'string'
        ? JSON.parse(taskData.resultJson)
        : taskData.resultJson;

      return resultJson?.resultUrls?.[0] || null;
    } catch (error) {
      Logger.error('Error extracting video URL', error);
      return null;
    }
  }

  /**
   * Check if task failed
   * @param {Object} taskData - Task data from Sora
   * @returns {Object|null} - Error info or null
   */
  getTaskError(taskData) {
    if (taskData.state === 'fail') {
      return {
        code: taskData.failCode,
        message: taskData.failMsg || 'Unknown error',
      };
    }
    return null;
  }
}

module.exports = new SoraService();
