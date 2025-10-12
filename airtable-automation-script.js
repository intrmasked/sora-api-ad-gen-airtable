// Airtable Automation Script for Video Generation
// Make sure you've added 'recordId' and 'aspectRatio' in Script input section first!

// Get the input values from the automation
let inputConfig = input.config();
let recordId = inputConfig.recordId;
let aspectRatio = inputConfig.aspectRatio || 'landscape';

// Validate inputs
if (!recordId) {
    throw new Error('Missing recordId. Make sure to add it in Script input.');
}

console.log('=== Starting Video Generation ===');
console.log('Record ID:', recordId);
console.log('Aspect Ratio:', aspectRatio);

// API endpoint
const API_URL = 'https://sora-api-ad-gen-airtable-production.up.railway.app/api/process-record';

try {
    // Make the API request
    let response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recordId: recordId,
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
        console.log('✅ Video generation started successfully!');
        console.log('Job ID:', result.data.jobId);
        console.log('Task ID 1:', result.data.taskId1);
        console.log('Task ID 2:', result.data.taskId2);
        console.log('Status URL:', result.data.statusUrl);
        console.log('=== Script completed successfully ===');

        // Set output for next steps (if needed)
        output.set('jobId', result.data.jobId);
        output.set('statusUrl', result.data.statusUrl);
    } else {
        console.log('❌ Error from API:', result.error);
        throw new Error(result.error || 'Unknown error from API');
    }

} catch (error) {
    console.log('❌ Script failed:', error.message);
    throw error;
}
