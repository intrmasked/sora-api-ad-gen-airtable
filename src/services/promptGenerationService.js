const Logger = require('../utils/logger');

/**
 * Service for generating Prompt 1 and Prompt 2 from a Master Prompt
 * Uses structured prompt engineering to ensure visual consistency
 */
class PromptGenerationService {
  /**
   * Generate two prompts from a master prompt
   * @param {string} masterPrompt - The master concept/theme
   * @param {string} aspectRatio - Video aspect ratio (landscape/portrait/square)
   * @returns {Promise<{prompt1: string, prompt2: string}>}
   */
  async generatePrompts(masterPrompt, aspectRatio = 'landscape') {
    Logger.info('Generating prompts from master prompt', { masterPrompt, aspectRatio });

    // Parse the master prompt to understand the structure
    const structure = this.analyzeMasterPrompt(masterPrompt);

    // Generate two prompts based on the structure
    const { prompt1, prompt2 } = this.createPrompts(structure, aspectRatio);

    Logger.info('Prompts generated successfully', { prompt1, prompt2 });

    return { prompt1, prompt2 };
  }

  /**
   * Analyze the master prompt to extract key elements
   */
  analyzeMasterPrompt(masterPrompt) {
    // Extract list type (e.g., "Top 3", "5 Best", "10 Amazing")
    const listMatch = masterPrompt.match(/(?:top|best|amazing|weirdest|creepiest)\s+(\d+)/i);
    const listCount = listMatch ? parseInt(listMatch[1]) : 2;

    // Extract topic/theme
    const topic = this.extractTopic(masterPrompt);

    // Extract tone/style
    const tone = this.extractTone(masterPrompt);

    // Determine visual style
    const visualStyle = this.determineVisualStyle(masterPrompt, tone);

    return {
      listCount,
      topic,
      tone,
      visualStyle,
      originalPrompt: masterPrompt,
    };
  }

  /**
   * Extract the main topic from the master prompt
   */
  extractTopic(prompt) {
    // Common patterns: "AI tools", "apps", "predictions", etc.
    const topicPatterns = [
      /(?:ai\s+)?tools?/i,
      /apps?/i,
      /predictions?/i,
      /glitches?/i,
      /inventions?/i,
      /moments?/i,
      /videos?/i,
      /things?/i,
    ];

    for (const pattern of topicPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        // Extract surrounding context
        const startIndex = Math.max(0, match.index - 30);
        const endIndex = Math.min(prompt.length, match.index + match[0].length + 30);
        return prompt.substring(startIndex, endIndex).trim();
      }
    }

    return prompt;
  }

  /**
   * Extract the tone from the master prompt
   */
  extractTone(prompt) {
    const toneKeywords = {
      cinematic: ['cinematic', 'epic', 'dramatic', 'stunning'],
      mystery: ['mysterious', 'creepy', 'weird', 'strange', 'unexplained'],
      'tech-thriller': ['illegal', 'dangerous', 'powerful', 'insane'],
      futuristic: ['future', 'ai', 'tech', 'innovation', 'advanced'],
      'dark-humor': ['crazy', 'wild', 'insane', 'unbelievable'],
    };

    const lowerPrompt = prompt.toLowerCase();

    for (const [tone, keywords] of Object.entries(toneKeywords)) {
      if (keywords.some((keyword) => lowerPrompt.includes(keyword))) {
        return tone;
      }
    }

    return 'cinematic'; // Default
  }

  /**
   * Determine visual style based on prompt and tone
   */
  determineVisualStyle(prompt, tone) {
    const styles = {
      cinematic: 'High-quality cinematic shot with dramatic lighting, professional color grading, shallow depth of field',
      mystery: 'Dark, moody atmosphere with dramatic shadows, mysterious lighting, unsettling ambiance',
      'tech-thriller': 'Sleek modern aesthetic, neon accents, tech-forward visuals, glowing interfaces',
      futuristic: 'Clean futuristic design, holographic elements, advanced technology, bright modern lighting',
      'dark-humor': 'Vibrant, slightly surreal visuals, bold colors, dynamic composition',
    };

    return styles[tone] || styles.cinematic;
  }

  /**
   * Create two prompts that maintain visual consistency
   */
  createPrompts(structure, aspectRatio) {
    const { topic, tone, visualStyle, originalPrompt } = structure;

    // Create a visual consistency template
    const visualTemplate = this.createVisualTemplate(visualStyle, aspectRatio);

    // Generate Prompt 1 - First item in the list (e.g., #3 or #2)
    const prompt1 = this.buildPrompt({
      ...structure,
      visualTemplate,
      position: 'first',
      description: `First scene introducing ${topic}`,
    });

    // Generate Prompt 2 - Second item in the list (e.g., #2 or #1)
    const prompt2 = this.buildPrompt({
      ...structure,
      visualTemplate,
      position: 'second',
      description: `Second scene continuing ${topic}`,
    });

    return { prompt1, prompt2 };
  }

  /**
   * Create a visual template to ensure consistency
   */
  createVisualTemplate(visualStyle, aspectRatio) {
    const cameraAngles = {
      landscape: 'wide cinematic framing',
      portrait: 'vertical framing optimized for mobile',
      square: 'centered square composition',
    };

    return {
      baseStyle: visualStyle,
      cameraAngle: cameraAngles[aspectRatio] || cameraAngles.landscape,
      lighting: 'consistent professional lighting throughout',
      colorPalette: 'cohesive color scheme',
    };
  }

  /**
   * Build a complete prompt with all elements
   */
  buildPrompt({ topic, tone, visualTemplate, position, originalPrompt }) {
    // Extract key elements from original prompt
    const elements = this.extractKeyElements(originalPrompt);

    // Build structured prompt parts
    const parts = [];

    // Subject/Main Focus
    parts.push(this.generateSubject(elements, position));

    // Visual Style
    parts.push(visualTemplate.baseStyle);

    // Camera & Composition
    parts.push(visualTemplate.cameraAngle);

    // Specific Details
    parts.push(this.generateDetails(elements, position, tone));

    // Mood & Atmosphere
    parts.push(this.generateMood(tone));

    // Combine into final prompt
    return parts.filter(Boolean).join(', ');
  }

  /**
   * Extract key elements from the original prompt
   */
  extractKeyElements(prompt) {
    return {
      hasBranding: /cracked\.ai|cracked ai/i.test(prompt),
      hasTools: /tools?|apps?/i.test(prompt),
      hasPredictions: /prediction|future/i.test(prompt),
      hasGlitch: /glitch|bug|error/i.test(prompt),
      hasPerson: /creator|person|human/i.test(prompt),
      isListBased: /top|best|\d+/i.test(prompt),
    };
  }

  /**
   * Generate the main subject for each prompt
   */
  generateSubject(elements, position) {
    if (elements.hasTools) {
      return position === 'first'
        ? 'Modern tech workspace with glowing holographic interface displaying AI tool dashboard'
        : 'Sleek futuristic device screen showing advanced AI application interface';
    }

    if (elements.hasPredictions) {
      return position === 'first'
        ? 'Futuristic data visualization with floating holographic predictions'
        : 'Advanced analytics display showing AI-generated future scenarios';
    }

    if (elements.hasGlitch) {
      return position === 'first'
        ? 'Digital screen with glitching AI interface and corrupted data streams'
        : 'Technological malfunction visualization with cascading digital artifacts';
    }

    // Default tech-focused subject
    return position === 'first'
      ? 'High-tech environment showcasing cutting-edge AI technology'
      : 'Advanced digital interface displaying innovative AI capabilities';
  }

  /**
   * Generate specific details for visual richness
   */
  generateDetails(elements, position, tone) {
    const details = [];

    // Add tech elements
    details.push('floating particles of data');
    details.push('subtle lens flares');

    // Add branding if present
    if (elements.hasBranding) {
      if (position === 'second') {
        details.push('subtle "Cracked.ai" branding visible on screen');
      }
    }

    // Add tone-specific details
    if (tone === 'mystery') {
      details.push('mysterious shadows');
      details.push('atmospheric fog');
    } else if (tone === 'tech-thriller') {
      details.push('neon blue accents');
      details.push('glowing circuit patterns');
    }

    return details.join(', ');
  }

  /**
   * Generate mood and atmosphere
   */
  generateMood(tone) {
    const moods = {
      cinematic: 'epic and inspiring atmosphere, professional color grading, 4K quality',
      mystery: 'dark and enigmatic mood, tension in the air, cinematic mystery',
      'tech-thriller': 'intense high-tech ambiance, cutting-edge feel, futuristic energy',
      futuristic: 'clean modern aesthetic, optimistic future vision, bright and advanced',
      'dark-humor': 'slightly surreal atmosphere, vibrant energy, unexpected visual flair',
    };

    return moods[tone] || moods.cinematic;
  }
}

module.exports = new PromptGenerationService();
