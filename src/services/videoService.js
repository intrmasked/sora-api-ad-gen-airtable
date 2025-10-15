const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Service for video download and stitching operations
 * Optimized for Railway's memory constraints to prevent SIGKILL
 */
class VideoService {
  constructor() {
    this.tempDir = config.video.tempDir;
    this.ensureTempDir();

    // Concurrency control: Only allow 1 ffmpeg operation at a time
    this.isProcessing = false;
    this.queue = [];

    // Railway free tier has ~512MB RAM, reserve margin
    this.maxConcurrentJobs = 1;
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
   * Stitch two videos together with memory optimization
   * @param {string} video1Path - Path to first video
   * @param {string} video2Path - Path to second video
   * @param {string} outputFilename - Output filename
   * @returns {Promise<string>} - Path to stitched video
   */
  async stitchVideos(video1Path, video2Path, outputFilename) {
    const outputPath = path.join(this.tempDir, outputFilename);
    const listFilePath = path.join(this.tempDir, `concat_${Date.now()}.txt`);

    try {
      Logger.info('Stitching videos with memory optimization', {
        video1Path,
        video2Path,
        outputPath
      });

      // Create concat list file for ffmpeg
      const concatList = `file '${video1Path}'\nfile '${video2Path}'`;
      await fs.writeFile(listFilePath, concatList);

      return new Promise((resolve, reject) => {
        ffmpeg()
          // Use concat protocol (most memory-efficient)
          .input(listFilePath)
          .inputOptions([
            '-f', 'concat',
            '-safe', '0'
          ])
          // Memory-optimized output options
          .outputOptions([
            '-c', 'copy',           // Copy codec (no re-encoding, saves RAM)
            '-threads', '2',        // Limit CPU threads to prevent overload
            '-max_muxing_queue_size', '1024',  // Limit buffer size
            '-movflags', '+faststart'  // Optimize for streaming
          ])
          .on('start', (commandLine) => {
            Logger.debug('FFmpeg command (optimized)', { commandLine });
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              Logger.debug('FFmpeg progress', {
                progress: Math.round(progress.percent) + '%'
              });
            }
          })
          .on('end', async () => {
            Logger.info('Videos stitched successfully', { outputPath });
            // Clean up concat list file
            await fs.remove(listFilePath).catch(() => {});
            resolve(outputPath);
          })
          .on('error', async (error) => {
            Logger.error('Error stitching videos', error);
            // Clean up on error
            await fs.remove(listFilePath).catch(() => {});
            await fs.remove(outputPath).catch(() => {});
            reject(new Error(`Failed to stitch videos: ${error.message}`));
          })
          .output(outputPath)
          .run();
      });
    } catch (error) {
      Logger.error('Error in stitch operation', error);
      // Clean up on exception
      await fs.remove(listFilePath).catch(() => {});
      await fs.remove(outputPath).catch(() => {});
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
   * Concurrency control wrapper
   * Ensures only one ffmpeg operation runs at a time to prevent memory exhaustion
   */
  async withConcurrencyControl(operation) {
    // If already processing, queue this operation
    if (this.isProcessing) {
      Logger.warn('FFmpeg operation queued (preventing concurrent processing)');
      return new Promise((resolve, reject) => {
        this.queue.push({ operation, resolve, reject });
      });
    }

    // Mark as processing and execute
    this.isProcessing = true;
    try {
      const result = await operation();
      return result;
    } finally {
      this.isProcessing = false;

      // Process next item in queue
      if (this.queue.length > 0) {
        const { operation: nextOp, resolve, reject } = this.queue.shift();
        this.withConcurrencyControl(nextOp).then(resolve).catch(reject);
      }
    }
  }

  /**
   * Complete video processing workflow with memory optimization
   * @param {string} url1 - First video URL
   * @param {string} url2 - Second video URL
   * @returns {Promise<string>} - Path to stitched video
   */
  async processVideos(url1, url2) {
    const timestamp = Date.now();
    let video1Path, video2Path, stitchedPath;

    try {
      // Download videos (can be done in parallel safely)
      Logger.info('Starting video processing workflow', { timestamp });

      [video1Path, video2Path] = await Promise.all([
        this.downloadVideo(url1, `video1_${timestamp}.mp4`),
        this.downloadVideo(url2, `video2_${timestamp}.mp4`)
      ]);

      Logger.info('Both videos downloaded, starting stitch with concurrency control');

      // Stitch with concurrency control to prevent multiple ffmpeg instances
      stitchedPath = await this.withConcurrencyControl(async () => {
        return await this.stitchVideos(
          video1Path,
          video2Path,
          `stitched_${timestamp}.mp4`
        );
      });

      Logger.info('Stitching complete, cleaning up temp files');

      // Clean up individual videos, keep stitched video
      await this.deleteFiles([video1Path, video2Path]);

      return stitchedPath;

    } catch (error) {
      Logger.error('Error in processVideos workflow', error);

      // Clean up all files on error
      const filesToClean = [video1Path, video2Path, stitchedPath].filter(Boolean);
      await this.deleteFiles(filesToClean);

      throw error;
    }
  }

  /**
   * Clean up old temporary files to prevent disk space issues
   * Call this periodically or after processing
   */
  async cleanupOldFiles(maxAgeHours = 2) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await this.deleteFile(filePath);
          Logger.info('Cleaned up old temp file', { file });
        }
      }
    } catch (error) {
      Logger.error('Error cleaning up old files', error);
    }
  }
}

module.exports = new VideoService();
