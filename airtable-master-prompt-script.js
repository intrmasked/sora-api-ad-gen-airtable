// Airtable Automation Script for Master Prompt Video Generation
// This script takes a "Master Prompt" and generates Prompt 1 & Prompt 2 automatically
// Then kicks off the video generation workflow

// SETUP REQUIRED IN AIRTABLE:
// Add these input variables in "Script input" section:
// 1. recordId (from trigger)
// 2. masterPrompt (from trigger - field: "Master Prompt")
// 3. aspectRatio (from trigger - field: "Aspect Ratio")

// Get the input values from the automation
let inputConfig = input.config();
let recordId = inputConfig.recordId;
let masterPrompt = inputConfig.masterPrompt;
let aspectRatio = inputConfig.aspectRatio || 'landscape';

// Validate inputs
if (!recordId) {
    throw new Error('Missing recordId. Make sure to add it in Script input.');
}

if (!masterPrompt) {
    throw new Error('Missing masterPrompt. Make sure to add "Master Prompt" field in Script input.');
}

console.log('=== Master Prompt Video Generation ===');
console.log('Record ID:', recordId);
console.log('Master Prompt:', masterPrompt);
console.log('Aspect Ratio:', aspectRatio);

// API endpoint for master prompt processing
const API_URL = 'https://sora-api-ad-gen-airtable-production.up.railway.app/api/process-master-prompt';

try {
    // Make the API request
    console.log('Calling API to generate prompts and create videos...');

    let response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recordId: recordId,
            masterPrompt: masterPrompt,
            aspectRatio: aspectRatio
        })
    });

    // Check if response is ok
    if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    // Parse the response
    let result = await response.json();

    // Check if successful
    if (result.success) {
        console.log('✅ Master Prompt processed successfully!');
        console.log('Generated Prompt 1:', result.data.prompt1 || 'Auto-generated');
        console.log('Generated Prompt 2:', result.data.prompt2 || 'Auto-generated');
        console.log('Job ID:', result.data.jobId);
        console.log('Task ID 1:', result.data.taskId1);
        console.log('Task ID 2:', result.data.taskId2);
        console.log('Status URL:', result.data.statusUrl);
        console.log('=== Workflow started successfully ===');
        console.log('Prompt 1 and Prompt 2 have been auto-generated from your Master Prompt');
        console.log('Videos are now being created by Sora...');
        console.log('Status will update automatically in Airtable!');

        // Set output for next steps (if needed)
        output.set('jobId', result.data.jobId);
        output.set('statusUrl', result.data.statusUrl);
    } else {
        console.log('❌ Error from API:', result.error);
        throw new Error(result.error || 'Unknown error from API');
    }

} catch (error) {
    console.log('❌ Script failed:', error.message);
    console.log('Please check:');
    console.log('1. Master Prompt field is filled');
    console.log('2. API is running');
    console.log('3. Airtable permissions are correct');
    throw error;
}
