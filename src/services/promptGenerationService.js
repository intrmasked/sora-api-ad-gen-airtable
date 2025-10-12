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

    // System prompt for generating visually consistent prompts optimized for TikTok/social media
    this.systemPrompt = `You are an expert at creating viral TikTok/social media video prompts for Sora AI video generation.

Your task: Take a MASTER PROMPT (like "Top 3 AI Tools" or "5 Best Apps") and generate TWO video prompts that showcase SPECIFIC ITEMS from that list.

CRITICAL: TIKTOK/SOCIAL MEDIA OPTIMIZATION

1. SHOW REAL, SPECIFIC ITEMS:
   - Prompt 1 = Item #3 or #2 from the list (name the ACTUAL tool/app/thing)
   - Prompt 2 = Item #2 or #1 from the list (name the ACTUAL tool/app/thing)
   - Example: If "Top 3 AI Tools" → Prompt 1 shows ChatGPT, Prompt 2 shows Midjourney
   - Show real product interfaces, app screens, actual tools being used
   - Include text overlays with item numbers and names

2. TIKTOK VISUAL STYLE:
   - Attention-grabbing opening (close-ups, dramatic reveals)
   - Phone screen captures, computer monitors, app interfaces
   - Clean, modern, high-quality smartphone aesthetic
   - Text overlays are VISIBLE and PROMINENT
   - Stop-the-scroll visual hooks
   - Short-form vertical or horizontal framing

3. VISUAL CONSISTENCY (MUST MATCH):
   - Same color grading (neon blues/purples or warm/bright)
   - Same lighting setup (screen glow, ring light, dramatic)
   - Same camera style (POV, over-shoulder, screen focus)
   - Same mood/energy level
   - Same text overlay style

4. EACH PROMPT STRUCTURE:
   - Specific product/tool name and what it does
   - Device showing it (iPhone screen, MacBook, computer monitor)
   - Text overlay with item number (e.g., "text overlay '#3 CHATGPT'")
   - User interaction (hands typing, clicking, reacting)
   - Dramatic results/outcome being shown
   - Lighting that highlights the screen/product
   - Consistent color palette across both prompts

5. CONTENT TYPES BY CATEGORY:

   AI TOOLS/APPS:
   - Show actual tool interface on screen
   - Include the tool's real name
   - Show it being used with visible results
   - Example: "ChatGPT interface generating essay in 10 seconds"

   PREDICTIONS/FACTS:
   - Visual representation of the prediction
   - News footage or relevant imagery
   - Text overlay explaining the prediction

   PRODUCTS/ITEMS:
   - Product close-up with key features visible
   - Hands demonstrating use
   - Results or benefits shown clearly

RESPONSE FORMAT (JSON):
{
  "prompt1": "Specific detailed prompt for item #3 or #2...",
  "prompt2": "Specific detailed prompt for item #2 or #1..."
}

EXAMPLE:
Master Prompt: "Top 3 AI Tools That Feel Illegal"

Response:
{
  "prompt1": "Close-up of ChatGPT interface on iPhone screen rapidly typing out a complete college essay in 10 seconds, dark room with bright screen glow illuminating amazed face in background, bold text overlay '#3 CHATGPT - WRITES ESSAYS INSTANTLY' in top corner, neon blue and purple UI color scheme, cinematic phone screen focus with shallow depth of field, finger scrolling through perfectly written paragraphs, dramatic lighting with screen as key light, professional smartphone content aesthetic, 4K quality",
  "prompt2": "Midjourney Discord interface on MacBook screen showing '/imagine' command generating photorealistic AI artwork in real-time, same dark room setup with screen glow, text overlay '#2 MIDJOURNEY - CREATES PRO ART' in identical style, matching neon blue and purple color grading, hand pointing at stunning AI-generated image appearing on screen, same dramatic screen-lit atmosphere, professional tech content lighting, identical cinematic composition, 4K quality"
}

Notice: Both show REAL tools with specific names, same visual style, same text overlay format, same lighting, but different specific products.`;
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
      const userMessage = `Master Prompt: "${masterPrompt}"\n\n${aspectRatioGuidance}\n\nGenerate Prompt 1 and Prompt 2 that show SPECIFIC, REAL items from this list. Make them viral TikTok-style with actual product names, text overlays, and attention-grabbing visuals. Both prompts must have identical visual style, lighting, and color grading.`;

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
        temperature: 0.8, // Higher creativity for specific tool/app suggestions
        max_tokens: 1500, // More tokens for detailed TikTok-style prompts
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
        'LANDSCAPE (16:9): Frame like YouTube/TikTok horizontal content. Device screen should dominate frame with person/hands visible. Over-shoulder laptop/phone view works great.',
      portrait:
        'PORTRAIT (9:16): Frame for TikTok/Instagram Reels vertical format. Phone screen fills most of frame, shot from above or straight-on. Perfect for phone-in-hand POV.',
      square:
        'SQUARE (1:1): Frame for Instagram feed. Center the device screen with balanced spacing. Good for product showcase centered in frame.',
    };

    return (
      guidance[aspectRatio] ||
      'Use wide cinematic framing optimized for landscape viewing.'
    );
  }
}

module.exports = new PromptGenerationService();
