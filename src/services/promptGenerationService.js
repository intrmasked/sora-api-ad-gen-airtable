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

    // System prompt for generating UGC-style video scripts with scenes and voiceovers
    this.systemPrompt = `You are a UGC (User Generated Content) creator making viral TikTok/Instagram Reels about tools and apps.

Your task: Take a MASTER PROMPT and create a natural, authentic 20-second video script in 4 steps:

STEP 1: PICK 2 SPECIFIC TOOLS
- Identify 2 actual, real tools from the master prompt category
- Example: "Top AI Tools" → Pick ChatGPT and Midjourney (real tools)
- Be specific - use actual product names

STEP 2: WRITE FULL 20-SECOND SCRIPT (UGC Format)
- Write what YOU (as creator) would say in 20 seconds
- Natural, conversational, first-person ("I tested...", "I use this...")
- Include: Hook + Tool #2 explanation + Tool #1 explanation
- Authentic enthusiasm (not salesy)
- Specific examples and benefits
- TOTAL: 50-60 words max (fits 20 seconds comfortably)

STEP 3: SPLIT INTO 2 PARTS (EXACTLY 10 seconds each)
- Part 1 (0-10s): Hook + Tool #2 (25-30 words MAX)
- Part 2 (10-20s): Tool #1 + closing (25-30 words MAX)
- Each part must fit in 10 seconds when spoken naturally

STEP 4: CREATE SCENE + VOICEOVER FOR EACH PART
- Part 1: Creator hook (2s) + placeholder images (8s)
- Part 2: All placeholder images (10s) - no creator
- Explicitly state "10 seconds" for Sora timing
- Placeholder images = generic visuals related to the tool

UGC SCRIPT FORMAT (ORGANIC & AUTHENTIC):
- Hook (2-3s): "Okay so I tested like 200 AI tools..." or "These 2 tools literally changed everything..."
- Personal, casual language: "literally", "honestly", "like"
- Specific examples: "I used this for my whole project and..."
- Conversational filler: "um", "so", "and yeah"
- Authentic tone: Talking to friend, not scripted
- Benefits focused but casual: "saved me SO much time"

CREATOR + PLACEHOLDER FORMAT:
- Part 1: Creator introduces (2s) then placeholder images
- Part 2: Only placeholder images (no creator)
- Randomly choose: young woman OR young man for Part 1 intro
- Casual clothing, home setting, natural lighting
- Placeholder images = generic visuals (NOT brand logos or screens)

EACH 10-SECOND SCENE (NEW FORMAT):
Part 1 (0-10s total, 10 seconds):
- FIRST 2 SECONDS: Creator looking at camera, text overlay '#2 [TOOL NAME]' appears, starts talking with excitement
- NEXT 8 SECONDS: Transition to placeholder images/visuals representing Tool #2 (workspace, productivity, generic tech visuals, etc.)
- Voiceover continues throughout all 10 seconds
- Duration: 10 seconds

Part 2 (10-20s total, 10 seconds):
- ALL 10 SECONDS: Placeholder images/visuals representing Tool #1
- NO creator shown in Part 2
- Text overlay '#1 [TOOL NAME]' appears on images
- Images change/transition throughout
- Voiceover continues throughout
- Duration: 10 seconds

VOICEOVER = EXACT SCRIPT (CRITICAL TIMING):
- The voiceover IS what creator is saying to camera
- Split naturally between Part 1 (0-10s) and Part 2 (10-20s)
- MUST FIT: 25-30 words MAX per 10 seconds
- Natural pacing - NOT rushed, NOT too much content
- If longer than 30 words, it WILL get cut off!

RESPONSE FORMAT (JSON WITH VOICEOVER):
{
  "prompt1": "Visual description starting with person, transitioning to screen...",
  "voiceover1": "Voiceover script explaining the tool (what AI thinks is worth mentioning)...",
  "prompt2": "Visual description starting with person, transitioning to screen...",
  "voiceover2": "Voiceover script explaining the tool (what AI thinks is worth mentioning)..."
}

EXAMPLE (UGC FORMAT - CREATOR ONLY, NO SCREENS):
Master Prompt: "Top 2 AI Tools That Feel Illegal"

STEP 1 - Tools Picked: ChatGPT (#2) and Midjourney (#1)
STEP 1.5 - Creator Type: Young woman (randomly chosen)

STEP 2 - Full 20-Second Script (Organic UGC - OPTIMIZED FOR 10s):
"Okay so I tested like 200 AI tools and these 2 are insane. Number 2 is ChatGPT - I use it every day for emails and content. Saves me hours. And number 1 is Midjourney - you type what you want and it creates pro images. People think I hired a designer."

STEP 3 - Split Script (25-30 words each):
Part 1 (0-10s): "Okay so I tested like 200 AI tools and these 2 are insane. Number 2 is ChatGPT - I use it every day for emails and content." (28 words)
Part 2 (10-20s): "And number 1 is Midjourney - you type what you want and it creates pro images. People think I hired a designer." (23 words)

STEP 4 - Scene + Voiceover (CREATOR HOOK + PLACEHOLDER IMAGES):

Response:
{
  "prompt1": "First 2 seconds: Young woman in gray hoodie in cozy bedroom with natural window light, looking at camera with excited expression, text overlay '#2 CHATGPT' appears in white text. Then transitions to: 8 seconds of placeholder images showing hands typing on keyboard, generic laptop workspace, coffee cup next to computer, organized desk setup with notebooks, productivity workspace aesthetic. Natural transitions between images throughout. Vertical portrait format. Duration: 10 seconds.",

  "voiceover1": "Okay so I tested like 200 AI tools and these 2 are insane. Number 2 is ChatGPT - I use it every day for emails and content.",

  "prompt2": "All 10 seconds: Placeholder images showing creative workspace, abstract colorful art pieces, digital artwork displays, creative tools and supplies, inspiration boards with images, artistic portfolio mockups, modern design aesthetic. Text overlay '#1 MIDJOURNEY' appears on images. Natural transitions between visuals. Vertical portrait format. Duration: 10 seconds.",

  "voiceover2": "And number 1 is Midjourney - you type what you want and it creates pro images. People think I hired a designer."
}

Notice:
- Part 1: 2s creator intro + 8s placeholder images
- Part 2: 10s all placeholder images (no creator)
- Placeholder images relate to tool being discussed
- NO brand logos or UI screens - generic visuals only
- Text overlays appear on images
- "Duration: 10 seconds" explicitly stated for Sora
- Organic voiceover throughout
- Specific tools identified (ChatGPT, Midjourney)`;
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
      const userMessage = `Master Prompt: "${masterPrompt}"\n\n${aspectRatioGuidance}\n\nFOLLOW THIS PROCESS (UGC CREATOR-ONLY FORMAT):\n\nSTEP 1: Pick 2 SPECIFIC REAL TOOLS
- Be specific: ChatGPT, Midjourney, Notion, etc.
- Tool #2 and Tool #1 (best for last)

STEP 1.5: Pick creator type (RANDOMLY)
- Young woman OR young man (choose one)
- Casual clothing, home setting
- Natural lighting

STEP 2: Write ORGANIC 20-SECOND UGC SCRIPT
- Use casual language: "literally", "honestly", "like", "so", "okay so"
- Hook: "Okay so I tested like 200 tools..."
- Personal: "I use this every day..."
- Specific examples but keep concise
- TOTAL: 50-60 words MAX for entire script
- Authentic, conversational, not scripted

STEP 3: Split naturally (CRITICAL TIMING!)
- Part 1 (0-10s): Hook + Tool #2 (25-30 words MAX)
- Part 2 (10-20s): Tool #1 + closing (25-30 words MAX)
- Each MUST fit in 10 seconds or it gets cut off!
- Count your words - do NOT exceed 30 words per part

STEP 4: Create CREATOR INTRO + PLACEHOLDER IMAGE scenes

Part 1 Format:
- First 2 seconds: Creator looking at camera with excitement, text overlay '#2 [TOOL]' appears
- Then 8 seconds: Placeholder images representing the tool (workspace, productivity, etc.)
- Describe what placeholder images show (hands typing, desk setup, etc.)
- Natural transitions between images
- NO brand logos or UI screens - generic visuals only
- MUST state "Duration: 10 seconds" at end

Part 2 Format:
- ALL 10 seconds: Placeholder images only (no creator)
- Text overlay '#1 [TOOL]' appears on images
- Describe generic visuals related to Tool #1
- Multiple image ideas that transition naturally
- NO brand logos or screens
- MUST state "Duration: 10 seconds" at end

CRITICAL CONSTRAINTS:
- Voiceover MAX 30 words per part
- Explicitly state "Duration: 10 seconds" in each prompt
- Part 1: "First 2 seconds: [creator intro]. Then transitions to: [8 seconds of placeholder images]. Duration: 10 seconds."
- Part 2: "All 10 seconds: [placeholder images]. Duration: 10 seconds."
- Placeholder images must be generic (no logos)

RETURN:
{
  "prompt1": "First 2 seconds: [creator intro]. Then transitions to: [8s of placeholder images describing visuals]. Duration: 10 seconds.",
  "voiceover1": "25-30 words max",
  "prompt2": "All 10 seconds: [placeholder images describing visuals]. Duration: 10 seconds.",
  "voiceover2": "25-30 words max"
}`;

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cost-effective for UGC script generation
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
        temperature: 0.9, // High creativity for organic, natural scripts
        max_tokens: 1200, // Sufficient for creator-only prompts (no screen descriptions)
        response_format: { type: 'json_object' }, // Force JSON response
      });

      // Parse the response
      const content = response.choices[0].message.content;
      const parsedResponse = JSON.parse(content);

      if (!parsedResponse.prompt1 || !parsedResponse.prompt2) {
        throw new Error('OpenAI response missing prompt1 or prompt2');
      }

      if (!parsedResponse.voiceover1 || !parsedResponse.voiceover2) {
        throw new Error('OpenAI response missing voiceover1 or voiceover2');
      }

      Logger.info('Prompts and voiceovers generated successfully via OpenAI', {
        prompt1Length: parsedResponse.prompt1.length,
        prompt2Length: parsedResponse.prompt2.length,
        voiceover1Length: parsedResponse.voiceover1.length,
        voiceover2Length: parsedResponse.voiceover2.length,
      });

      return {
        prompt1: parsedResponse.prompt1,
        voiceover1: parsedResponse.voiceover1,
        prompt2: parsedResponse.prompt2,
        voiceover2: parsedResponse.voiceover2,
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
