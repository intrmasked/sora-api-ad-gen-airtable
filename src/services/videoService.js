const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Service for video download and stitching operations
 */
class VideoService {
  constructor() {
    this.tempDir = config.video.tempDir;
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    try {
      await fs.ensureDir(this.tempDir);
      Logger.debug('Temp directory ensured', { tempDir: this.tempDir });
    } catch (error) {
      Logger.error('Error creating temp directory', error);
      throw error;
    }
  }

  /**
   * Download video from URL
   * @param {string} url - Video URL
   * @param {string} filename - Output filename
   * @returns {Promise<string>} - Local file path
   */
  async downloadVideo(url, filename) {
    const filePath = path.join(this.tempDir, filename);

    try {
      Logger.info('Downloading video', { url, filePath });

      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          Logger.info('Video downloaded successfully', { filePath });
          resolve(filePath);
        });
        writer.on('error', (error) => {
          Logger.error('Error downloading video', error);
          reject(error);
        });
      });
    } catch (error) {
      Logger.error('Error downloading video', error);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * Stitch two videos together
   * @param {string} video1Path - Path to first video
   * @param {string} video2Path - Path to second video
   * @param {string} outputFilename - Output filename
   * @returns {Promise<string>} - Path to stitched video
   */
  async stitchVideos(video1Path, video2Path, outputFilename) {
    const outputPath = path.join(this.tempDir, outputFilename);

    try {
      Logger.info('Stitching videos', { video1Path, video2Path, outputPath });

      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(video1Path)
          .input(video2Path)
          .on('start', (commandLine) => {
            Logger.debug('FFmpeg command', { commandLine });
          })
          .on('progress', (progress) => {
            Logger.debug('FFmpeg progress', { progress: progress.percent });
          })
          .on('end', () => {
            Logger.info('Videos stitched successfully', { outputPath });
            resolve(outputPath);
          })
          .on('error', (error) => {
            Logger.error('Error stitching videos', error);
            reject(new Error(`Failed to stitch videos: ${error.message}`));
          })
          .mergeToFile(outputPath, this.tempDir);
      });
    } catch (error) {
      Logger.error('Error in stitch operation', error);
      throw error;
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - Path to file to delete
   */
  async deleteFile(filePath) {
    try {
      await fs.remove(filePath);
      Logger.info('File deleted', { filePath });
    } catch (error) {
      Logger.error('Error deleting file', error);
      // Don't throw, just log the error
    }
  }

  /**
   * Delete multiple files
   * @param {string[]} filePaths - Array of file paths to delete
   */
  async deleteFiles(filePaths) {
    for (const filePath of filePaths) {
      await this.deleteFile(filePath);
    }
  }

  /**
   * Complete video processing workflow
   * @param {string} url1 - First video URL
   * @param {string} url2 - Second video URL
   * @returns {Promise<string>} - Path to stitched video
   */
  async processVideos(url1, url2) {
    const timestamp = Date.now();
    const video1Path = await this.downloadVideo(url1, `video1_${timestamp}.mp4`);
    const video2Path = await this.downloadVideo(url2, `video2_${timestamp}.mp4`);
    const stitchedPath = await this.stitchVideos(
      video1Path,
      video2Path,
      `stitched_${timestamp}.mp4`
    );

    // Clean up individual videos, keep stitched video
    await this.deleteFiles([video1Path, video2Path]);

    return stitchedPath;
  }
}

module.exports = new VideoService();
