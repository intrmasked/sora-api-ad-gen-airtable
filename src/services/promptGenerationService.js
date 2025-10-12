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

STEP 3: SPLIT INTO 2 PARTS (10 seconds each)
- Part 1 (0-10s): Hook + introduce yourself + Tool #2
- Part 2 (10-20s): Tool #1 + why it's #1

STEP 4: CREATE SCENE + VOICEOVER FOR EACH PART
- Scene: Visual description (person talking → shows screen → reaction)
- Voiceover: Exact words spoken during those 10 seconds

UGC SCRIPT FORMAT (CRITICAL):
- Hook (2-3s): "After testing 200+ AI tools..." or "I found 2 tools that changed everything..."
- Personal experience: "I use this every day for..."
- Specific examples: "It wrote my 10-page report in 2 minutes"
- Authentic tone: Not salesy, like talking to a friend
- Benefits focused: "Saved me hours" "10x my output"

SORA COMPLIANCE (NO BRAND VIOLATIONS):
- NO brand logos visible (no ChatGPT logo, Midjourney logo, etc.)
- USE generic interfaces: "AI chat interface" not "ChatGPT interface"
- USE generic devices: "smartphone" not "iPhone"
- Tool names in TEXT OVERLAYS only (Sora can generate text)
- Focus on action/concept, not branded UI

SCENE STRUCTURE FOR EACH 10-SECOND PART:
1. Person talking to camera (0-3s)
   - Casual setting, good lighting
   - Authentic expression (excited, amazed)
   - Text overlay appears with tool name

2. Transition to screen (3s)
   - Quick cut or zoom to device screen
   - Hand visible holding phone/using laptop

3. Screen demonstration (3-7s)
   - Generic interface showing tool in action
   - Visible results appearing on screen
   - No brand logos, generic UI only

4. Back to person or continue screen (7-10s)
   - Quick reaction shot OR
   - Final result on screen with wow moment

VOICEOVER = EXACT SCRIPT:
- The voiceover IS the script you wrote in Step 2
- Split naturally between Part 1 (0-10s) and Part 2 (10-20s)
- Must fit timing: ~30-35 words per 10 seconds
- Natural pacing, not rushed

RESPONSE FORMAT (JSON WITH VOICEOVER):
{
  "prompt1": "Visual description starting with person, transitioning to screen...",
  "voiceover1": "Voiceover script explaining the tool (what AI thinks is worth mentioning)...",
  "prompt2": "Visual description starting with person, transitioning to screen...",
  "voiceover2": "Voiceover script explaining the tool (what AI thinks is worth mentioning)..."
}

EXAMPLE (UGC FORMAT - SCRIPT FIRST):
Master Prompt: "Top 2 AI Tools That Feel Illegal"

STEP 1 - Tools Picked: ChatGPT (#2) and Midjourney (#1)

STEP 2 - Full 20-Second Script:
"I tested over 200 AI tools and these 2 are absolutely insane. Number 2 is ChatGPT - I use it every single day to write my emails, scripts, even code in literally seconds. It's saved me hours. And number 1 is Midjourney - it creates professional images from just text. I've made hundreds of graphics and people think I hired a designer. Both are free to start."

STEP 3 - Split Script:
Part 1 (0-10s): "I tested over 200 AI tools and these 2 are absolutely insane. Number 2 is ChatGPT - I use it every single day to write my emails, scripts, even code in literally seconds."
Part 2 (10-20s): "And number 1 is Midjourney - it creates professional images from just text. I've made hundreds of graphics and people think I hired a designer. Both are free to start."

STEP 4 - Scene + Voiceover:

Response:
{
  "prompt1": "10-second video: Young woman in casual hoodie sitting in bright modern room, looking at camera with excited expression (0-2s), text overlay '#2 CHATGPT' appears in bold (1s), she gestures enthusiastically while talking (2-3s), quick cut to smartphone screen in her hands (3s), shows generic AI chat interface with blue/purple gradient, text rapidly generating 'Subject: Project Update' email with full paragraphs appearing automatically (3-7s), her hand scrolls through perfectly written text (7-9s), cut back to her nodding impressed (9-10s). Natural window lighting, vertical format",

  "voiceover1": "I tested over 200 AI tools and these 2 are absolutely insane. Number 2 is ChatGPT - I use it every single day to write my emails, scripts, even code in literally seconds.",

  "prompt2": "10-second video: Same woman in same room, now looking amazed at camera (0-2s), text overlay '#1 MIDJOURNEY' appears (1s), she leans forward excitedly (2-3s), quick transition to laptop screen (3s), shows generic AI image generator with dark interface, text prompt 'mountain landscape sunset' being typed (3-5s), stunning photorealistic image materializing on screen from top to bottom (5-8s), her hand points at screen, camera shows her wide-eyed reaction (8-10s). Same lighting, same setting, consistent energy",

  "voiceover2": "And number 1 is Midjourney - it creates professional images from just text. I've made hundreds of graphics and people think I hired a designer. Both are free to start."
}

Notice:
- Script written FIRST, then split
- Specific tools identified (ChatGPT, Midjourney)
- UGC tone: "I tested...", "I use it every day..."
- Voiceover is the exact script, split into 10s chunks
- Scenes match what's being said
- NO brand logos, generic interfaces only`;
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
      const userMessage = `Master Prompt: "${masterPrompt}"\n\n${aspectRatioGuidance}\n\nFOLLOW THIS PROCESS (SCRIPT-FIRST APPROACH):\n\nSTEP 1: Pick 2 SPECIFIC REAL TOOLS from this category
- Be specific: ChatGPT, Midjourney, Notion, etc. (actual product names)
- Tool #2 and Tool #1 (save the best for last)

STEP 2: Write FULL 20-SECOND UGC SCRIPT (what you'd actually say)
- Start with hook: "I tested 200+ tools..." or similar
- Natural first-person: "I use this every day..."
- Specific examples: "It wrote my report in 2 minutes"
- Authentic, not salesy
- ~60-70 words total

STEP 3: Split script into 2 parts
- Part 1 (0-10s): Hook + Tool #2 (~30-35 words)
- Part 2 (10-20s): Tool #1 + closing (~30-35 words)

STEP 4: Create scene + voiceover for each part
- Scene describes person → screen → reaction
- Voiceover is the exact script from Step 3
- Scenes match what's being said

SORA COMPLIANCE:
- NO brand logos (generic interfaces only)
- Tool names in TEXT OVERLAYS
- Generic devices (smartphone, laptop)

RETURN FORMAT:
{
  "prompt1": "Scene description for Part 1 (person → screen → reaction)",
  "voiceover1": "Exact script for Part 1 (0-10s)",
  "prompt2": "Scene description for Part 2 (person → screen → reaction)",
  "voiceover2": "Exact script for Part 2 (10-20s)"
}`;

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
