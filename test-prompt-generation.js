/**
 * Quick test script to verify programmatic prompt generation
 */

const promptGenerationService = require('./src/services/promptGenerationService');

async function testPromptGeneration() {
  console.log('🧪 Testing programmatic prompt generation...\n');

  try {
    // Test with different aspect ratios
    const aspectRatios = ['portrait', 'landscape', 'square'];

    for (const aspectRatio of aspectRatios) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📱 Testing ${aspectRatio.toUpperCase()} format`);
      console.log('='.repeat(80));

      const result = await promptGenerationService.generatePrompts(
        'Top AI Tools for Creators', // Master prompt (currently ignored)
        aspectRatio
      );

      console.log('\n📊 METADATA:');
      console.log(JSON.stringify(result.metadata, null, 2));

      console.log('\n🎬 PROMPT 1:');
      console.log(result.prompt1);

      console.log('\n🎤 VOICEOVER 1:');
      console.log(`"${result.voiceover1}"`);
      console.log(`Words: ${result.metadata.voiceover1Words}`);

      console.log('\n🎬 PROMPT 2:');
      console.log(result.prompt2);

      console.log('\n🎤 VOICEOVER 2:');
      console.log(`"${result.voiceover2}"`);
      console.log(`Words: ${result.metadata.voiceover2Words}`);

      console.log(`\n📈 TOTAL WORDS: ${result.metadata.totalWords} (Target: 50-60)`);
    }

    console.log('\n\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPromptGeneration();
