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
- Scene: Just CREATOR talking to camera (NO screens, NO demonstrations)
- Voiceover: Exact words spoken during those 10 seconds
- Same creator in both parts (consistency)

UGC SCRIPT FORMAT (ORGANIC & AUTHENTIC):
- Hook (2-3s): "Okay so I tested like 200 AI tools..." or "These 2 tools literally changed everything..."
- Personal, casual language: "literally", "honestly", "like"
- Specific examples: "I used this for my whole project and..."
- Conversational filler: "um", "so", "and yeah"
- Authentic tone: Talking to friend, not scripted
- Benefits focused but casual: "saved me SO much time"

CREATOR FORMAT (NO SCREENS - JUST PERSON):
- Randomly choose: young woman OR young man
- Casual clothing (hoodie, t-shirt, casual shirt)
- Home/casual setting (bedroom, living room, coffee shop)
- Natural lighting (window light, lamp, outdoor)
- Talking directly to camera entire time
- Natural gestures and expressions
- Text overlay with tool name appears

EACH 10-SECOND SCENE (CREATOR ONLY):
Part 1 (0-10s):
- Creator talking to camera, casual setting
- Text overlay '#2 [TOOL NAME]' appears at top
- Creator uses hands to gesture while explaining
- Natural expressions (excited, nodding, smiling)
- NO screen recordings, NO demonstrations
- Just authentic person talking

Part 2 (10-20s):
- SAME creator, SAME setting (consistency!)
- Text overlay '#1 [TOOL NAME]' appears
- Creator continues talking, more enthusiasm
- Natural body language and gestures
- Maybe leans closer to camera for emphasis
- NO screens, just creator talking throughout

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

STEP 4 - Scene + Voiceover (CREATOR ONLY):

Response:
{
  "prompt1": "Young woman in gray hoodie sitting in cozy bedroom with plants, natural window light, looking at camera talking enthusiastically, text overlay '#2 CHATGPT' appears in white bold text, she gestures naturally with hands while speaking, nodding and smiling throughout. Casual authentic energy, vertical portrait format, 10 seconds.",

  "voiceover1": "Okay so I tested like 200 AI tools and these 2 are insane. Number 2 is ChatGPT - I use it every day for emails and content.",

  "prompt2": "Same woman in same gray hoodie and bedroom, same lighting, talking with more excitement, text overlay '#1 MIDJOURNEY' appears in white text, she gestures animatedly while explaining, smiles and nods at end. Same casual energy, vertical format, 10 seconds.",

  "voiceover2": "And number 1 is Midjourney - you type what you want and it creates pro images. People think I hired a designer."
}

Notice:
- NO screen recordings, just creator talking entire time
- Same creator, same setting, consistent throughout
- Organic language: "literally", "honestly", "like", "so"
- Natural gestures and expressions described
- Voiceover matches what creator is saying on camera
- Specific tools identified (ChatGPT, Midjourney)
- Text overlays only mention for tool names`;
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

STEP 4: Create SIMPLE CREATOR-ONLY scenes
- Just person talking to camera entire time
- Same creator, same setting in both parts
- Keep scene descriptions SHORT and simple
- Text overlays with tool names
- NO screen recordings, NO demonstrations
- NO complex timing breakdowns (0-2s, 3-5s, etc.)
- Just describe: person, setting, general energy

CRITICAL CONSTRAINTS:
- Voiceover MAX 30 words per part (will get cut if longer)
- Scene descriptions: simple and brief
- NO screens or demonstrations
- Same person/setting throughout
- Keep it natural and authentic

RETURN:
{
  "prompt1": "Simple description: creator in setting, talking to camera, text overlay appears, natural gestures. 10 seconds.",
  "voiceover1": "25-30 words max for Part 1",
  "prompt2": "Same creator, same setting, more enthusiasm, text overlay, gestures. 10 seconds.",
  "voiceover2": "25-30 words max for Part 2"
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
