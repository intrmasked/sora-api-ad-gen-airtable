const Logger = require('../utils/logger');
const config = require('../config/config');
const promptConfig = require('../config/promptConfig.json');

/**
 * Service for generating Prompt 1 and Prompt 2 programmatically
 * Uses comprehensive config with variable libraries for Cracked.ai viral UGC videos
 */
class PromptGenerationService {
  constructor() {
    this.config = promptConfig;

    // Helper function to randomly select from array
    this.randomSelect = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Helper function to count words
    this.countWords = (text) => text.trim().split(/\s+/).length;

    // Helper function to truncate to word limit
    this.truncateToWordLimit = (text, maxWords) => {
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    };
  }

  /**
   * Programmatically generate prompts and voiceovers using template system
   * @param {string} masterPrompt - The master concept/theme (currently ignored in favor of config templates)
   * @param {string} aspectRatio - Video aspect ratio (landscape/portrait/square)
   * @returns {Promise<{prompt1: string, voiceover1: string, prompt2: string, voiceover2: string, metadata: object}>}
   */
  async generatePrompts(masterPrompt, aspectRatio = 'landscape') {
    Logger.info('Generating prompts programmatically using config', {
      masterPrompt,
      aspectRatio,
    });

    try {
      // Step 1: Random selection from config lists
      const lists = this.config.lists;

      // Select variables
      const topicStyle = this.randomSelect(lists.topic_style);
      const emotionArc = this.randomSelect(lists.emotion_arc);
      const hook = this.randomSelect(lists.hooks);

      // PART 1 (0-10s): Tool #2 ONLY - all info must be self-contained
      const tool2 = this.randomSelect(lists.tool2);
      const benefit2 = this.randomSelect(lists.benefit2_by_tool[tool2]);
      const benefit2Impact = this.randomSelect(lists.benefit2_impact_by_tool[tool2]);

      // PART 2 (10-20s): Cracked.ai (#1) ONLY - all info must be self-contained
      const benefit1 = this.randomSelect(lists.benefit1_cracked);
      const reactionPhrase = this.randomSelect(lists.reaction_phrases);
      const ctaLine = this.randomSelect(lists.cta_lines);

      const p1Setting = this.randomSelect(lists.p1_settings_variants);

      // Select 1-2 overlay visuals for Part 2
      const numOverlays = Math.random() > 0.5 ? 2 : 1;
      const p2Overlays = [];
      const overlaysCopy = [...lists.p2_visual_overlays];
      for (let i = 0; i < numOverlays; i++) {
        const idx = Math.floor(Math.random() * overlaysCopy.length);
        p2Overlays.push(overlaysCopy.splice(idx, 1)[0]);
      }
      const p2OverlaysText = p2Overlays.join(', ');

      const p2OutroText = this.randomSelect(this.config.globals.overlay_text.p2_last_1s_required);

      // Select creator type (young woman or young man)
      const creatorObj = this.randomSelect(lists.creator_types);
      const creatorType = creatorObj.type;
      const creatorClothing = this.randomSelect(creatorObj.clothing);
      const creatorSetting = this.randomSelect(creatorObj.settings);

      // Select placeholder images for each tool
      const p1PlaceholderImages = this.randomSelect(this.config.placeholder_images[tool2]);

      // Get aspect ratio format string
      const aspectRatioFormat = this.getAspectRatioFormat(aspectRatio);

      // Step 2: Fill voiceover templates
      // PART 1: ONLY about Tool #2 - complete thought within 10 seconds
      let voiceover1 = this.config.templates.voiceover1
        .replace('{hook}', hook)
        .replace('{tool2}', tool2)
        .replace('{benefit2}', benefit2)
        .replace('{benefit2_impact}', benefit2Impact);

      // PART 2: ONLY about Cracked.ai (#1) - complete thought within 10 seconds
      let voiceover2 = this.config.templates.voiceover2
        .replace('{benefit1}', benefit1)
        .replace('{reaction_phrase}', reactionPhrase)
        .replace('{cta_line}', ctaLine);

      // Step 3: Validate and truncate word counts
      const v1Words = this.countWords(voiceover1);
      const v2Words = this.countWords(voiceover2);
      const maxWordsPerSegment = this.config.globals.segment_words_range[1];

      if (v1Words > maxWordsPerSegment) {
        Logger.warn(`Voiceover1 has ${v1Words} words, truncating to ${maxWordsPerSegment}`);
        voiceover1 = this.truncateToWordLimit(voiceover1, maxWordsPerSegment);
      }

      if (v2Words > maxWordsPerSegment) {
        Logger.warn(`Voiceover2 has ${v2Words} words, truncating to ${maxWordsPerSegment}`);
        voiceover2 = this.truncateToWordLimit(voiceover2, maxWordsPerSegment);
      }

      // Step 4: Fill prompt templates
      // PART 1 VISUAL: 10-second segment about Tool #2 ONLY
      const prompt1 = this.config.templates.prompt1
        .replace('{creator_type}', creatorType)
        .replace('{creator_clothing}', creatorClothing)
        .replace('{creator_setting}', creatorSetting)
        .replace('{rank2}', '2')
        .replace('{tool2_upper}', tool2.toUpperCase())
        .replace('{tool2}', tool2)
        .replace('{p1_placeholder_images}', p1PlaceholderImages)
        .replace('{aspect_ratio_format}', aspectRatioFormat);

      // PART 2 VISUAL: 10-second segment about Cracked.ai (#1) ONLY
      const prompt2 = this.config.templates.prompt2
        .replace('{p2_placeholder_images}', p2OverlaysText)
        .replace('{rank1}', '1')
        .replace('{aspect_ratio_format}', aspectRatioFormat)
        .replace('{p2_outro_text}', p2OutroText);

      // Step 5: Build metadata for tracking
      const v1FinalWords = this.countWords(voiceover1);
      const v2FinalWords = this.countWords(voiceover2);

      const metadata = {
        topic: topicStyle,
        emotion: emotionArc,
        tool2: tool2,
        tool1: 'Cracked.ai',
        hook: hook,
        benefit2: benefit2,
        benefit2Impact: benefit2Impact,
        benefit1: benefit1,
        reactionPhrase: reactionPhrase,
        ctaLine: ctaLine,
        creatorType: creatorType,
        creatorClothing: creatorClothing,
        creatorSetting: creatorSetting,
        aspectRatio: aspectRatio,
        voiceover1Words: v1FinalWords,
        voiceover2Words: v2FinalWords,
        totalWords: v1FinalWords + v2FinalWords,
        segmentationValid: v1FinalWords <= 30 && v2FinalWords <= 30,
        timing: {
          part1: '0-10 seconds (Tool #2)',
          part2: '10-20 seconds (Cracked.ai)',
          boundaryStrict: true
        }
      };

      // Validate 10-second boundaries
      if (!metadata.segmentationValid) {
        Logger.warn('⚠️  CRITICAL: Segment exceeds 10-second boundary!', {
          voiceover1Words: v1FinalWords,
          voiceover2Words: v2FinalWords,
          maxAllowed: 30
        });
      }

      Logger.info('Prompts and voiceovers generated programmatically', {
        prompt1Length: prompt1.length,
        prompt2Length: prompt2.length,
        voiceover1Words: metadata.voiceover1Words,
        voiceover2Words: metadata.voiceover2Words,
        totalWords: metadata.totalWords,
      });

      return {
        prompt1,
        voiceover1,
        prompt2,
        voiceover2,
        metadata,
      };
    } catch (error) {
      Logger.error('Error generating prompts programmatically', error);
      throw new Error(`Failed to generate prompts: ${error.message}`);
    }
  }

  /**
   * Get aspect ratio format string for prompts
   */
  getAspectRatioFormat(aspectRatio) {
    const formats = {
      landscape: 'Horizontal landscape format (16:9)',
      portrait: 'Vertical portrait format (9:16)',
      square: 'Square format (1:1)',
    };

    return formats[aspectRatio] || formats.landscape;
  }
}

module.exports = new PromptGenerationService();
