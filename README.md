# Sora Video Stitcher API with Airtable Integration

A production-ready async API service that generates videos using Sora 2 Text-to-Video API, stitches them together, and uploads to Airtable as attachments. Uses callbacks and Upstash Redis for efficient, scalable processing.

## Features

- **Async workflow** with Sora API callbacks (no polling!)
- **Instant responses** - API returns immediately, processing happens in background
- **Scalable** - Uses Upstash Redis for job tracking
- **Parallel video generation** - Both videos generate simultaneously
- **Automatic stitching** - FFmpeg combines videos seamlessly
- **Airtable integration** - Direct upload as attachments
- **No external storage** - Uses temp files + Airtable hosting
- **Status tracking** - Real-time job status endpoints
- **100% Free hosting** - Free tier options for everything
- **Comprehensive logging** - Track every step of the process

## Architecture

```
┌─────────────┐
│ User/Airtable│
└──────┬──────┘
       │ POST /api/generate-video
       ▼
┌─────────────────────────────────────────┐
│          API (returns immediately)       │
│  Response: { jobId, statusUrl }         │
└──────────┬──────────────────────────────┘
           │
           ├─► Create Job in Upstash Redis
           │
           ├─► Create Sora Task 1 (with callback URL)
           │
           └─► Create Sora Task 2 (with callback URL)
                   │
                   ▼
           ┌────────────────┐
           │  Sora API      │
           │  (processing)  │
           └───────┬────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  Video 1 Done          Video 2 Done
        │                     │
        └──────────┬──────────┘
                   │ POST /api/callback/sora
                   ▼
           ┌────────────────┐
           │  Job Processor │
           │  (async)       │
           └───────┬────────┘
                   │
      Both videos ready?
                   │
                   ▼
           ┌────────────────┐
           │  FFmpeg Stitch │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │ Upload to      │
           │ Airtable       │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │ Update Status  │
           │ Delete Temp    │
           └────────────────┘
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **State Management**: Upstash Redis (free tier)
- **Video Processing**: FFmpeg
- **Integrations**: Sora API, Airtable
- **Deployment**: Render.com (free tier)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Upstash Redis (Free)

Follow the detailed guide: **[UPSTASH_SETUP.md](UPSTASH_SETUP.md)**

Quick version:
1. Go to [upstash.com](https://upstash.com) → Sign up (free, no credit card)
2. Create a Redis database (Regional, free tier)
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

# Sora API
SORA_API_KEY=your_sora_api_key_here
SORA_API_BASE_URL=https://api.kie.ai/api/v1

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_base_id/your_table_id
AIRTABLE_TABLE_NAME=Video Generation

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here

# Job Configuration
JOB_TIMEOUT=600000
```

### 4. Set Up Airtable

Follow: **[AIRTABLE_SETUP.md](AIRTABLE_SETUP.md)**

Create table with fields:
- `Prompt 1` (Long text)
- `Prompt 2` (Long text)
- `Video` (Attachment)
- `Status` (Single select) - optional

### 5. Run Locally

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

API available at: `http://localhost:3000`

## API Endpoints

### 1. Generate Videos (Async)

**POST** `/api/generate-video`

Start video generation. Returns immediately with job ID.

**Request:**
```json
{
  "prompt1": "A chef cooking pasta in a kitchen",
  "prompt2": "Plating the finished pasta dish",
  "recordId": "recXXXXXXXXXXXXXX",
  "aspectRatio": "landscape"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Video generation started. Use the jobId to check status.",
  "data": {
    "jobId": "job_1704067200000_abc123",
    "taskId1": "281e5b0...f39b9",
    "taskId2": "281e5b0...f39b8",
    "statusUrl": "http://localhost:3000/api/job/job_1704067200000_abc123"
  }
}
```

### 2. Check Job Status

**GET** `/api/job/:jobId`

Check the current status of a job.

**Example:**
```bash
curl http://localhost:3000/api/job/job_1704067200000_abc123
```

**Response - Generating:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_1704067200000_abc123",
    "status": "generating",
    "createdAt": 1704067200000,
    "updatedAt": 1704067250000,
    "video1Status": "pending",
    "video2Status": "ready"
  }
}
```

**Response - Completed:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_1704067200000_abc123",
    "status": "completed",
    "createdAt": 1704067200000,
    "updatedAt": 1704067500000,
    "completedAt": 1704067500000,
    "video1Url": "https://...",
    "video2Url": "https://...",
    "recordId": "recXXXXXXXXXXXXXX"
  }
}
```

**Response - Failed:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_1704067200000_abc123",
    "status": "failed",
    "error": "Video 1 generation failed: Insufficient credits",
    "failedAt": 1704067300000
  }
}
```

### 3. Process Airtable Record

**POST** `/api/process-record`

Fetch prompts from Airtable and start generation.

**Request:**
```json
{
  "recordId": "recXXXXXXXXXXXXXX",
  "aspectRatio": "landscape"
}
```

**Response:** Same as `/api/generate-video`

### 4. Sora Callback (Internal)

**POST** `/api/callback/sora`

Called by Sora API when videos are ready. Do not call manually.

### 5. Health Check

**GET** `/api/health`

Check if API is running.

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "mode": "async-callback",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

## Job Status Flow

1. **`pending`** - Job created, waiting to start
2. **`generating`** - Sora tasks created, videos generating
3. **`processing`** - Both videos ready, starting stitch
4. **`stitching`** - Videos being stitched together
5. **`uploading`** - Uploading to Airtable
6. **`completed`** - Job finished successfully
7. **`failed`** - Job failed (check error field)

## Deployment

### Option 1: Render.com (Recommended - Free)

Full guide: **[DEPLOYMENT.md](DEPLOYMENT.md)**

**Quick Deploy:**

1. Create Upstash Redis database (see UPSTASH_SETUP.md)

2. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/sora-video-api.git
git push -u origin main
```

3. Deploy on Render:
   - Go to [render.com](https://render.com) → Sign up
   - New → Web Service
   - Connect GitHub repository
   - Render auto-detects `render.yaml`
   - Add environment variables:
     - `PUBLIC_URL`: `https://your-service-name.onrender.com`
     - `SORA_API_KEY`
     - `AIRTABLE_API_KEY`
     - `AIRTABLE_BASE_ID`
     - `AIRTABLE_TABLE_NAME`
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - Click "Create Web Service"

4. Your API will be live at: `https://your-service-name.onrender.com`

**Important**: Set `PUBLIC_URL` to your actual Render URL for callbacks to work!

### Option 2: Railway.app

```bash
npm i -g @railway/cli
railway login
railway init
railway up

# Set variables
railway variables set PUBLIC_URL=https://your-app.up.railway.app
railway variables set SORA_API_KEY=your_key
# ... other variables
```

### Option 3: Docker

```bash
docker-compose up -d
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions.

## Usage Examples

### Example 1: Direct API Call

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt1": "A sunset over the ocean",
    "prompt2": "Stars appearing in the night sky",
    "aspectRatio": "landscape"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "jobId": "job_1704067200000_abc123",
#     "statusUrl": "http://localhost:3000/api/job/job_1704067200000_abc123"
#   }
# }

# Then check status:
curl http://localhost:3000/api/job/job_1704067200000_abc123
```

### Example 2: With Airtable Automation

Set up Airtable automation:

1. **Trigger**: When record enters view "To Process"
2. **Action**: Send webhook
   - URL: `https://your-api.onrender.com/api/process-record`
   - Method: POST
   - Body:
   ```json
   {
     "recordId": "{{RECORD_ID}}"
   }
   ```

3. Airtable automatically updates Status field as:
   - Processing → Stitching → Completed (or Failed)

### Example 3: Poll for Completion

```javascript
async function waitForJobCompletion(jobId) {
  const statusUrl = `http://localhost:3000/api/job/${jobId}`;

  while (true) {
    const response = await fetch(statusUrl);
    const data = await response.json();

    if (data.data.status === 'completed') {
      console.log('Job completed!', data.data);
      break;
    } else if (data.data.status === 'failed') {
      console.error('Job failed:', data.data.error);
      break;
    }

    console.log('Status:', data.data.status);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
  }
}

// Usage
const result = await fetch('http://localhost:3000/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt1: "A chef cooking",
    prompt2: "Plating the dish"
  })
});

const { data } = await result.json();
await waitForJobCompletion(data.jobId);
```

## How It Works (Async Callback Workflow)

1. **User Request**: Call `/api/generate-video` with prompts
2. **Immediate Response**: API returns job ID in ~1 second
3. **Job Creation**: Job stored in Upstash Redis with status "pending"
4. **Sora Tasks**: Two Sora tasks created in parallel with callback URLs
5. **User Can Leave**: User doesn't wait, can check status later
6. **Sora Processing**: Videos generate (2-5 minutes each)
7. **Callbacks**: Sora sends POST to `/api/callback/sora` when each video is ready
8. **Job Processor**:
   - Receives callback
   - Stores video URL in Redis
   - Checks if both videos ready
   - If yes, starts stitching
9. **Stitching**: FFmpeg concatenates videos
10. **Upload**: Stitched video uploaded to Airtable
11. **Cleanup**: Temp files deleted, job marked "completed"
12. **User Checks**: Can query `/api/job/:jobId` anytime for status

## Why Callbacks > Polling?

| Aspect | Callbacks (This API) | Polling (Old Way) |
|--------|---------------------|-------------------|
| **Response Time** | Instant (~1s) | 2-5 minutes |
| **Server Load** | Minimal | High (constant polling) |
| **Scalability** | Excellent | Poor |
| **Timeout Risk** | None | High |
| **Free Tier Friendly** | Yes | No (sleeps on Render) |
| **Concurrent Jobs** | Unlimited | Limited |

## Project Structure

```
sora-api-ad-gen-airtable/
├── src/
│   ├── config/
│   │   └── config.js               # Configuration management
│   ├── services/
│   │   ├── soraService.js          # Sora API (with callbacks)
│   │   ├── videoService.js         # Video download & stitch
│   │   ├── airtableService.js      # Airtable integration
│   │   ├── redisService.js         # Upstash Redis wrapper
│   │   └── jobProcessor.js         # Async job processing
│   ├── controllers/
│   │   └── videoController.js      # Request handlers
│   ├── routes/
│   │   └── videoRoutes.js          # API routes
│   ├── utils/
│   │   └── logger.js               # Logging utility
│   └── server.js                   # Express server
├── temp/                           # Temporary video files
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── render.yaml                     # Render deployment config
├── Dockerfile                      # Docker config
├── README.md                       # This file
├── UPSTASH_SETUP.md               # Redis setup guide
├── AIRTABLE_SETUP.md              # Airtable setup guide
└── DEPLOYMENT.md                   # Deployment guide
```

## Cost Breakdown (100% FREE!)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| **Render.com** | 750 hrs/month | Hosting | $0 |
| **Upstash Redis** | 10K commands/day | Job tracking | $0 |
| **Airtable** | 1,200 records | Video storage | $0 |
| **Sora API** | Pay per video | Video generation | ~$0.50-2/video |
| **Total** | - | - | **Only Sora API** |

## Troubleshooting

### "Redis not configured" Warning

**Solution**: Set up Upstash Redis (see UPSTASH_SETUP.md)

### Callbacks Not Working

**Causes**:
1. `PUBLIC_URL` not set correctly
2. Sora can't reach your callback URL (localhost won't work)

**Solution**:
- Deploy to Render/Railway first
- Set `PUBLIC_URL=https://your-actual-domain.com`
- Test with production URL

### Job Stuck in "generating"

**Possible causes**:
1. Sora API issue (check Sora dashboard)
2. Callback not received (check logs)
3. Insufficient Sora credits

**Solution**:
- Check API logs for callback receipts
- Manually check Sora task status
- Verify Sora API key and credits

### FFmpeg Not Found

**Solution**:
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# On Render, ffmpeg is pre-installed
```

## Monitoring

### View Logs

**Render**:
- Dashboard → Your Service → Logs

**Railway**:
```bash
railway logs
```

**Local**:
- Console output shows all INFO, WARN, ERROR logs

### Track Jobs in Redis

Use Upstash Dashboard:
1. Go to upstash.com → Your Database
2. Click "Data Browser"
3. See all jobs: `job:*`
4. See task mappings: `task:*`

## Security Best Practices

1. **Never commit `.env`** - Contains sensitive keys
2. **Rotate API keys** regularly
3. **Use HTTPS** in production (Render provides free SSL)
4. **Validate inputs** - API validates prompts, record IDs
5. **Rate limiting** - Consider adding for production

## FAQ

**Q: Why do I need Upstash Redis?**
A: To track job state across callback requests. Callbacks are stateless, so we need external storage.

**Q: Can I use a different Redis?**
A: Yes! Any Redis with REST API works. Just update connection config.

**Q: What if Upstash free tier isn't enough?**
A: You'd need 1000+ videos/day to exceed it. Upgrade to Pro ($10/mo) if needed.

**Q: How long do jobs stay in Redis?**
A: Default 1 hour TTL. Configurable in config.js.

**Q: Can I process more than 2 videos?**
A: Yes, modify the code to handle N videos. Current implementation is for 2.

**Q: Does this work with other video APIs?**
A: Yes, just modify soraService.js to integrate different APIs.

## Contributing

PRs welcome! Areas for improvement:
- Add webhook support for job completion notifications
- Support for N videos (not just 2)
- Video preview before stitching
- Custom transitions between videos
- Retry logic for failed tasks
- Admin dashboard

## License

MIT

## Support

- **API Issues**: Open GitHub issue
- **Sora API**: [kie.ai/support](https://kie.ai)
- **Airtable**: [support.airtable.com](https://support.airtable.com)
- **Upstash**: [docs.upstash.com](https://docs.upstash.com)

---

**Built with Node.js, Express, FFmpeg, Upstash Redis, and Airtable**

**Ready to deploy!** Follow [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.
