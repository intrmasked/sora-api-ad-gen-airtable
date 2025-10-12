const express = require('express');
const videoController = require('../controllers/videoController');

const router = express.Router();

/**
 * @route   POST /api/generate-video
 * @desc    Generate and stitch videos from two prompts (async with callbacks)
 * @access  Public
 */
router.post('/generate-video', (req, res) =>
  videoController.generateAndStitch(req, res)
);

/**
 * @route   POST /api/process-record
 * @desc    Process an Airtable record
 * @access  Public
 */
router.post('/process-record', (req, res) =>
  videoController.processRecord(req, res)
);

/**
 * @route   POST /api/generate-prompts
 * @desc    Generate Prompt 1 and Prompt 2 from a Master Prompt
 * @access  Public
 */
router.post('/generate-prompts', (req, res) =>
  videoController.generatePromptsFromMaster(req, res)
);

/**
 * @route   POST /api/process-master-prompt
 * @desc    Process Airtable record with Master Prompt (auto-generates Prompt 1 & 2)
 * @access  Public
 */
router.post('/process-master-prompt', (req, res) =>
  videoController.processMasterPrompt(req, res)
);

/**
 * @route   POST /api/callback/sora
 * @desc    Receive Sora API callbacks
 * @access  Public (called by Sora API)
 */
router.post('/callback/sora', (req, res) =>
  videoController.handleSoraCallback(req, res)
);

/**
 * @route   GET /api/job/:jobId
 * @desc    Get job status
 * @access  Public
 */
router.get('/job/:jobId', (req, res) =>
  videoController.getJobStatus(req, res)
);

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => videoController.healthCheck(req, res));

module.exports = router;
