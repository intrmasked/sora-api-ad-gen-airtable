require('dotenv').config();

module.exports = {
  // Server config
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',

  // Sora API config
  sora: {
    apiKey: process.env.SORA_API_KEY,
    baseUrl: process.env.SORA_API_BASE_URL || 'https://api.kie.ai/api/v1',
  },

  // Airtable config
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    tableName: process.env.AIRTABLE_TABLE_NAME,
  },

  // Upstash Redis config
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },

  // OpenAI config
  openaiApiKey: process.env.OPENAI_API_KEY,

  // Video config
  video: {
    tempDir: './temp',
    defaultAspectRatio: 'landscape',
  },

  // Job config
  job: {
    timeout: parseInt(process.env.JOB_TIMEOUT) || 600000, // 10 minutes
    ttl: 3600, // 1 hour TTL for job data in Redis
  },
};
