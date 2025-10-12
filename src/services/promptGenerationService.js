const OpenAI = require('openai');
const Logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Service for generating Prompt 1 and Prompt 2 from a Master Prompt using OpenAI
 * Optimized for list-based viral content with visual consistency
 */
class PromptGenerationService {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
    });

    // System prompt for generating visually consistent prompts
    this.systemPrompt = `You are an expert AI prompt engineer specializing in generating prompts for Sora video generation.

Your task is to take a MASTER PROMPT (usually a list-based concept like "Top 3 AI Tools" or "5 Best Apps") and generate TWO separate video prompts (Prompt 1 and Prompt 2) that will be stitched together.

CRITICAL REQUIREMENTS:

1. VISUAL CONSISTENCY:
   - Both prompts MUST share the same visual style, lighting, color palette, and camera angles
   - Use consistent cinematic techniques (depth of field, color grading, composition)
   - Maintain the same tone and atmosphere throughout

2. LIST-BASED CONTENT STRUCTURE:
   - Each prompt describes a SELF-CONTAINED scene (one item from the list)
   - Prompt 1 = First item in the list (e.g., #3 or #2)
   - Prompt 2 = Second item in the list (e.g., #2 or #1)
   - Scenes are connected THEMATICALLY, not through visual transitions
   - Each scene can stand alone but feels part of the same series

3. PROMPT STRUCTURE:
   Each prompt should include:
   - Main subject/focus (the specific item being showcased)
   - Visual style (cinematic, tech-forward, mysterious, etc.)
   - Camera work (wide shot, close-up, tracking, etc.)
   - Lighting and atmosphere
   - Color palette and mood
   - Specific details that make it visually rich
   - Technical quality indicators (4K, professional color grading, etc.)

4. TONE ADAPTATION:
   - Tech/AI content: Sleek, futuristic, neon accents, holographic elements
   - Mystery/Creepy: Dark, moody, dramatic shadows, unsettling atmosphere
   - Inspirational: Bright, epic, dramatic lighting, optimistic
   - Humor/Wild: Vibrant, slightly surreal, dynamic, bold colors

5. AVOID:
   - Do NOT create visual transitions or continuity between scenes
   - Do NOT reference previous or next items
   - Do NOT use phrases like "continuing from" or "building on"
   - Keep each scene independent but stylistically identical

RESPONSE FORMAT:
You must respond with a valid JSON object in this exact format:
{
  "prompt1": "Detailed first video prompt here...",
  "prompt2": "Detailed second video prompt here..."
}

EXAMPLE:
Master Prompt: "Top 3 AI Tools That Feel Illegal"

Response:
{
  "prompt1": "Modern tech workspace with glowing holographic interface displaying AI-powered automation tool, sleek futuristic aesthetic with neon blue and purple accents, dramatic cinematic lighting with strong rim lights, wide-angle shot with shallow depth of field, floating data particles and subtle lens flares, professional color grading with teal and orange tones, mysterious high-tech ambiance, 4K quality",
  "prompt2": "Futuristic device screen showcasing advanced AI voice cloning application, identical sleek aesthetic with neon blue and purple interface elements, same dramatic cinematic lighting setup, wide-angle composition with consistent depth of field, floating holographic waveforms and data streams, matching professional color grading, mysterious cutting-edge atmosphere, 4K quality"
}

Notice: Both prompts share lighting, colors, camera work, and mood while describing different specific tools.`;
  }

  /**
   * Generate two prompts from a master prompt using OpenAI
   * @param {string} masterPrompt - The master concept/theme
   * @param {string} aspectRatio - Video aspect ratio (landscape/portrait/square)
   * @returns {Promise<{prompt1: string, prompt2: string}>}
   */
  async generatePrompts(masterPrompt, aspectRatio = 'landscape') {
    Logger.info('Generating prompts from master prompt using OpenAI', {
      masterPrompt,
      aspectRatio,
    });

    try {
      // Add aspect ratio guidance to the user message
      const aspectRatioGuidance = this.getAspectRatioGuidance(aspectRatio);
      const userMessage = `Master Prompt: "${masterPrompt}"\n\n${aspectRatioGuidance}\n\nGenerate Prompt 1 and Prompt 2 with perfect visual consistency.`;

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo', // Using GPT-4 Turbo (latest available model)
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7, // Balanced creativity
        max_tokens: 1000,
        response_format: { type: 'json_object' }, // Force JSON response
      });

      // Parse the response
      const content = response.choices[0].message.content;
      const parsedResponse = JSON.parse(content);

      if (!parsedResponse.prompt1 || !parsedResponse.prompt2) {
        throw new Error('OpenAI response missing prompt1 or prompt2');
      }

      Logger.info('Prompts generated successfully via OpenAI', {
        prompt1Length: parsedResponse.prompt1.length,
        prompt2Length: parsedResponse.prompt2.length,
      });

      return {
        prompt1: parsedResponse.prompt1,
        prompt2: parsedResponse.prompt2,
      };
    } catch (error) {
      Logger.error('Error generating prompts with OpenAI', error);
      throw new Error(`Failed to generate prompts: ${error.message}`);
    }
  }

  /**
   * Get aspect ratio specific guidance
   */
  getAspectRatioGuidance(aspectRatio) {
    const guidance = {
      landscape:
        'Use wide cinematic framing optimized for 16:9 landscape format. Think epic establishing shots.',
      portrait:
        'Use vertical framing optimized for 9:16 mobile/portrait format. Frame subjects centered for vertical viewing.',
      square:
        'Use centered square composition for 1:1 format. Balance the frame equally on all sides.',
    };

    return (
      guidance[aspectRatio] ||
      'Use wide cinematic framing optimized for landscape viewing.'
    );
  }
}

module.exports = new PromptGenerationService();
