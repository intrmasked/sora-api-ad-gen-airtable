const Airtable = require('airtable');
const fs = require('fs-extra');
const FormData = require('form-data');
const axios = require('axios');
const config = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Service for Airtable operations
 */
class AirtableService {
  constructor() {
    this.apiKey = config.airtable.apiKey;
    this.baseId = config.airtable.baseId;
    this.tableName = config.airtable.tableName;

    if (this.apiKey && this.baseId) {
      Airtable.configure({
        apiKey: this.apiKey,
      });
      this.base = Airtable.base(this.baseId);
    }
  }

  /**
   * Get a record from Airtable
   * @param {string} recordId - The record ID
   * @returns {Promise<Object>} - Record data
   */
  async getRecord(recordId) {
    try {
      Logger.info('Fetching Airtable record', { recordId });

      const record = await this.base(this.tableName).find(recordId);

      Logger.info('Record fetched successfully', {
        recordId,
        fields: record.fields,
      });

      return record;
    } catch (error) {
      Logger.error('Error fetching Airtable record', error);
      throw new Error(`Failed to fetch Airtable record: ${error.message}`);
    }
  }

  /**
   * Upload video to Airtable as attachment
   * @param {string} recordId - The record ID to update
   * @param {string} videoPath - Path to the video file
   * @param {string} fieldName - Name of the attachment field
   * @returns {Promise<Object>} - Updated record
   */
  async uploadVideoAttachment(recordId, videoPath, fieldName = 'Video') {
    try {
      Logger.info('Uploading video to Airtable', {
        recordId,
        videoPath,
        fieldName,
      });

      // Read the file
      const fileBuffer = await fs.readFile(videoPath);
      const filename = `stitched_${Date.now()}.mp4`;

      // Upload to a temporary public URL first (using file.io as a free temporary host)
      // Note: Airtable accepts URLs to upload attachments
      const uploadUrl = await this.uploadToTempHost(fileBuffer, filename);

      // Update Airtable record with the attachment URL
      const updatedRecord = await this.base(this.tableName).update(recordId, {
        [fieldName]: [
          {
            url: uploadUrl,
          },
        ],
      });

      Logger.info('Video uploaded to Airtable successfully', {
        recordId,
        attachmentUrl: uploadUrl,
      });

      return updatedRecord;
    } catch (error) {
      Logger.error('Error uploading video to Airtable', error);
      throw new Error(`Failed to upload video to Airtable: ${error.message}`);
    }
  }

  /**
   * Upload file to temporary public host
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - Filename
   * @returns {Promise<string>} - Public URL
   */
  async uploadToTempHost(fileBuffer, filename) {
    try {
      Logger.info('Uploading to temporary host', { filename });

      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'video/mp4',
      });

      // Using file.io for temporary hosting (free, auto-deletes after download)
      const response = await axios.post('https://file.io', formData, {
        headers: formData.getHeaders(),
      });

      if (!response.data.success) {
        throw new Error('Failed to upload to temporary host');
      }

      const publicUrl = response.data.link;
      Logger.info('File uploaded to temporary host', { publicUrl });

      return publicUrl;
    } catch (error) {
      Logger.error('Error uploading to temporary host', error);
      throw error;
    }
  }

  /**
   * Update record with status and error message
   * @param {string} recordId - Record ID
   * @param {string} status - Status ('Processing', 'Completed', 'Failed')
   * @param {string} error - Error message (optional)
   */
  async updateRecordStatus(recordId, status, error = null) {
    try {
      const fields = { Status: status };
      if (error) {
        fields['Error'] = error;
      }

      await this.base(this.tableName).update(recordId, fields);
      Logger.info('Record status updated', { recordId, status, error });
    } catch (error) {
      Logger.error('Error updating record status', error);
      // Don't throw, just log
    }
  }
}

module.exports = new AirtableService();
