# PROJECT CONTEXT: UGC Ad Generator with Sora & Airtable

**Last Updated:** 2025-10-17
**Deployment:** Railway (Production)
**Status:** Active & Deployed

---

## 🎯 PROJECT OVERVIEW

This is a **UGC (User-Generated Content) Ad Generator** that creates viral-style marketing videos using:
- **Sora 2 Pro** API for AI-powered video generation
- **Airtable** for data management and workflow automation
- **Upstash Redis** for async job tracking
- **FFmpeg** for video stitching
- **Railway** for deployment (production environment)

### Core Purpose
Generate professional UGC-style ads promoting **Cracked.ai** by:
1. Creating two 10-second video segments (total: 20 seconds)
2. Part 1: Showcases a competitor tool (HeyGen, Midjourney, Runway, etc.)
3. Part 2: Reveals Cracked.ai as the superior solution
4. Stitching both segments into a single viral-ready video

---

## 🏗️ ARCHITECTURE

### Async Callback Architecture
```
User/Airtable → API Request → Immediate Response (job ID)
                    ↓
        Create 2 Sora Tasks (parallel)
                    ↓
        Sora processes (2-5 min each)
                    ↓
        Callback → Process Videos
                    ↓
        Download → Stitch → Upload to Airtable
```

**Key Advantage:** No polling, no timeouts. API responds instantly, processing happens in background.

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **State Management:** Upstash Redis (free tier)
- **Video Processing:** FFmpeg with memory optimization
- **APIs:** Sora 2 Pro, Airtable, OpenAI (for prompt generation)
- **Deployment:** Railway (production), supports Docker

---

## 📁 PROJECT STRUCTURE

```
src/
├── config/
│   ├── config.js                    # Environment configuration
│   └── promptConfig.json            # UGC video prompt templates & variables
├── services/
│   ├── soraService.js              # Sora API integration (callbacks)
│   ├── videoService.js             # Download & FFmpeg stitching
│   ├── airtableService.js          # Airtable CRUD + video upload
│   ├── redisService.js             # Upstash Redis job tracking
│   ├── jobProcessor.js             # Async callback handler
│   └── promptGenerationService.js  # Programmatic prompt generation
├── controllers/
│   └── videoController.js          # HTTP request handlers
├── routes/
│   └── videoRoutes.js              # API route definitions
├── utils/
│   └── logger.js                   # Structured logging
└── server.js                       # Express server + cleanup scheduler
```

---

## 🔑 KEY FEATURES

### 1. **Async Workflow with Callbacks**
- No polling or timeout issues
- Instant API response (~1 second)
- Sora calls back when videos are ready
- Scalable to unlimited concurrent jobs

### 2. **Intelligent Prompt Generation**
Uses `promptConfig.json` with randomized selection:
- **6 competitor tools** (HeyGen, Midjourney, Runway, Pika Labs, Claude, Notion AI)
- **8 viral hooks** ("This shouldn't even exist...", "How is nobody talking about this?")
- **6 topic styles** ("3 AI Tools That Feel Illegal", "Wild AI Tools You Haven't Tried Yet")
- **5 emotion arcs** (Curiosity→Awe, Skeptical→Converted)
- **Creator types** (young woman/man with specific clothing/settings)
- **Placeholder B-roll** (tool-specific visuals for each segment)

**Template System:**
- Part 1: Creator intro → Tool #2 B-roll (10s)
- Part 2: Cracked.ai B-roll + CTA overlay (10s)

### 3. **Memory-Optimized Video Stitching**
Railway free tier has ~512MB RAM. Optimizations:
- Concurrency control (1 FFmpeg job at a time)
- `-c copy` (no re-encoding, minimal RAM)
- Thread limiting (`-threads 2`)
- Automatic cleanup of temp files
- Periodic cleanup scheduler (every 1 hour)

### 4. **Airtable Integration**
**Required Fields:**
- `Master Prompt` (optional: for prompt generation)
- `Prompt 1` (Long text)
- `Prompt 2` (Long text)
- `Voiceover 1` (Long text, optional)
- `Voiceover 2` (Long text, optional)
- `Video` (Attachment)
- `Status` (Single select: Generating → Processing → Stitching → Uploading → Completed/Failed)

**Workflow:**
1. Automation triggers webhook on new record
2. API fetches prompts or generates from Master Prompt
3. Creates Sora tasks
4. Receives callbacks
5. Stitches videos
6. Uploads to Airtable attachment field
7. Updates status throughout

### 5. **Job Status Tracking**
Redis stores:
- Job metadata (jobId, prompts, recordId)
- Task mappings (taskId → jobId + videoNumber)
- Video URLs (when ready)
- Status transitions (pending → generating → processing → stitching → uploading → completed/failed)
- TTL: 1 hour (configurable)

---

## 🛣️ API ENDPOINTS

### **POST /api/generate-video**
Generate videos from prompts directly.

**Request:**
```json
{
  "prompt1": "Creator intro → HeyGen B-roll with voice cloning demos",
  "prompt2": "Cracked.ai dashboard → 'Search Cracked.ai now' CTA",
  "recordId": "recXXXXXX",
  "aspectRatio": "landscape"
}
```

**Response (202):**
```json
{
  "success": true,
  "message": "Video generation started",
  "data": {
    "jobId": "job_1234567890_abc123",
    "taskId1": "281e5b0...f39b9",
    "taskId2": "281e5b0...f39b8",
    "statusUrl": "https://your-app.up.railway.app/api/job/job_1234567890_abc123"
  }
}
```

### **POST /api/process-record**
Fetch prompts from Airtable record, then generate.

**Request:**
```json
{
  "recordId": "recXXXXXX",
  "aspectRatio": "landscape"
}
```

### **POST /api/process-master-prompt**
Generate Prompt 1 & 2 from Master Prompt, then create videos.

**Request:**
```json
{
  "recordId": "recXXXXXX",
  "masterPrompt": "Ad promoting Cracked.ai as ultimate content creation tool",
  "aspectRatio": "landscape"
}
```

**What it does:**
1. Calls `promptGenerationService.generatePrompts()`
2. Updates Airtable with `Prompt 1`, `Prompt 2`, `Voiceover 1`, `Voiceover 2`
3. Kicks off video generation workflow

### **GET /api/job/:jobId**
Check job status.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_1234567890_abc123",
    "status": "completed",
    "createdAt": 1704067200000,
    "completedAt": 1704067500000,
    "video1Url": "https://...",
    "video2Url": "https://...",
    "recordId": "recXXXXXX"
  }
}
```

**Statuses:**
- `pending` → Job created
- `generating` → Sora tasks submitted
- `processing` → Both videos ready
- `stitching` → FFmpeg running
- `uploading` → Uploading to Airtable
- `completed` → Done
- `failed` → Error (check `error` field)

### **POST /api/callback/sora** (Internal)
Receives Sora completion notifications. **Do not call manually.**

### **GET /api/health**
Health check.

---

## 🧠 PROMPT GENERATION SYSTEM

### promptConfig.json Structure
```json
{
  "version": "1.0.0",
  "CRITICAL_RULE": "Each segment is EXACTLY 10 seconds and MUST be self-contained",
  "globals": {
    "clip_max_seconds": 9.8,
    "segment_words_range": [25, 30]
  },
  "lists": {
    "topic_style": [...],
    "hooks": [...],
    "tool2": ["HeyGen", "Midjourney", "Runway", "Pika Labs", "Claude", "Notion AI"],
    "benefit2_by_tool": { "HeyGen": [...], ... },
    "benefit1_cracked": [...],
    "creator_types": [...]
  },
  "templates": {
    "voiceover1": "{hook} Number 2 is {tool2}—it literally {benefit2}...",
    "voiceover2": "And number 1? Cracked.ai. It {benefit1}..."
  },
  "placeholder_images": {
    "HeyGen": ["recording studio setup, microphone close-up..."],
    "Cracked.ai": ["content strategy dashboard..."]
  }
}
```

### Voiceover Templates
**Part 1 (0-10s):**
```
{hook} Number 2 is {tool2}—it literally {benefit2}.
I use this daily and {benefit2_impact}.
```

**Part 2 (10-20s):**
```
And number 1? Cracked.ai. It {benefit1}—this actually feels human.
{reaction_phrase} {cta_line}
```

### Visual Templates
**Part 1:**
- First 2s: Creator looking at camera, text overlay `#2 {TOOL}`
- Seconds 2-10: Tool-specific B-roll (e.g., "recording studio, microphone" for HeyGen)

**Part 2:**
- All 10s: Cracked.ai dashboard/workflow B-roll
- Text overlay: `#1 CRACKED.AI`
- Final 1s: CTA text ("Cracked.ai — this changes everything")

---

## 🚀 RECENT UPDATES (Git History)

### Latest Commits:
1. **0f5252f** - Added remaining inputs
2. **95a65c2** - Switched nframe to string (15 frames)
3. **3e4a425** - Changed to sora-2-pro (model upgrade)
4. **ee30eb6** - Fix: use absolute paths (FFmpeg concat fix)
5. **21f7a74** - FFmpeg optimization (memory-safe for Railway)
6. **3e8aac9** - Changing prompt generator
7. **70aeceb** - Switch to creator intro + placeholder B-roll format
8. **824ac94** - Optimize for exactly 10 seconds
9. **3043e4b** - Switch to creator-only UGC format
10. **4200482** - Complete rewrite: UGC script-first approach

### Key Changes Timeline:
- **v1:** Poll-based architecture (deprecated)
- **v2:** Callback-based async architecture (current)
- **v3:** Added prompt generation service
- **v4:** Optimized for Railway memory constraints
- **v5:** Added Master Prompt → Auto-generate workflow

---

## ⚙️ CONFIGURATION

### Environment Variables (.env)
```bash
# Server
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://your-app.up.railway.app

# Sora API
SORA_API_KEY=your_key
SORA_API_BASE_URL=https://api.kie.ai/api/v1

# Airtable
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=appXXXXXX
AIRTABLE_TABLE_NAME='Video Generation'

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# OpenAI (for prompt generation)
OPENAI_API_KEY=your_key

# Job Config
JOB_TIMEOUT=600000
```

### Sora API Parameters
```javascript
{
  model: 'sora-2-pro-text-to-video',
  input: {
    prompt: "...",
    aspect_ratio: 'landscape',  // or 'portrait', 'square'
    n_frames: '15',             // ~10 seconds
    size: "standard",
    remove_watermark: true
  },
  callBackUrl: "https://your-app/api/callback/sora"
}
```

---

## 🐛 DEBUGGING & MONITORING

### Logs
```javascript
// Logger levels: DEBUG, INFO, WARN, ERROR
Logger.info('Job created', { jobId, status });
Logger.error('Stitching failed', error);
```

**View logs on Railway:**
```bash
railway logs
```

### Common Issues

**1. Job stuck in "generating"**
- Check Sora API status
- Verify callback URL is publicly accessible
- Check Redis for job data: `job:{jobId}`

**2. FFmpeg SIGKILL (Railway)**
- Memory exceeded 512MB
- Check concurrency control is working
- Verify `-c copy` (no re-encoding)

**3. Callback not received**
- Verify `PUBLIC_URL` matches actual Railway URL
- Check Sora API logs for callback attempts
- Test callback endpoint manually

**4. Video upload fails**
- Temporary hosting services down (0x0.st, tmpfiles.org, file.io)
- File size too large (>100MB)
- Airtable API rate limit

### Redis Keys
```
job:{jobId}           → Job metadata
task:{taskId}         → Task → Job mapping
```

### Status Transitions
```
pending → generating → processing → stitching → uploading → completed
                                                          → failed
```

---

## 📊 AIRTABLE AUTOMATION SETUP

### Trigger
**When:** Record enters view "To Process"

### Action: Send Webhook
**URL:** `https://your-app.up.railway.app/api/process-master-prompt`

**Method:** POST

**Body:**
```json
{
  "recordId": "{{RECORD_ID}}",
  "masterPrompt": "{{MASTER_PROMPT}}",
  "aspectRatio": "landscape"
}
```

**Fields Auto-Updated:**
- `Status`: Generating → Stitching → Completed
- `Prompt 1`: Generated from Master Prompt
- `Prompt 2`: Generated from Master Prompt
- `Voiceover 1`: Generated voiceover script
- `Voiceover 2`: Generated voiceover script
- `Video`: Final stitched video attachment

---

## 🎬 WORKFLOW EXAMPLE

### Scenario: Generate ad from Airtable

**Step 1:** Create Airtable record
```
Master Prompt: "Promote Cracked.ai as the ultimate content creation tool"
```

**Step 2:** Move to "To Process" view
- Automation triggers webhook

**Step 3:** API processes (background)
1. Generates Prompt 1 & 2 from Master Prompt
2. Updates Airtable with prompts
3. Creates 2 Sora tasks (parallel)
4. Status → "Generating"

**Step 4:** Sora processes (~3-5 minutes)
- Video 1 generates
- Video 2 generates
- Both send callbacks to `/api/callback/sora`

**Step 5:** Stitching
- Downloads both videos
- FFmpeg concatenates
- Status → "Stitching"

**Step 6:** Upload
- Uploads to temp host (0x0.st)
- Airtable fetches and attaches
- Status → "Completed"

**Total time:** 3-7 minutes

---

## 💰 COST BREAKDOWN

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| **Railway** | $5 credit | Hosting | ~$5-10/mo |
| **Upstash Redis** | 10K commands/day | Job tracking | $0 |
| **Airtable** | 1,200 records | Video storage | $0 |
| **Sora API** | Pay per video | Video gen | ~$0.50-2/video |
| **OpenAI** | Pay per token | Prompt gen | ~$0.01/gen |

**Total:** Mostly Sora API costs

---

## 🔮 FUTURE IMPROVEMENTS

### Planned Features
- [ ] Webhook on job completion (notify user)
- [ ] Support for N videos (not just 2)
- [ ] Video preview before stitching
- [ ] Custom transitions/effects
- [ ] Retry logic for failed Sora tasks
- [ ] Admin dashboard (job monitoring)
- [ ] Analytics (track video performance)

### Technical Debt
- [ ] Add tests (currently no test suite)
- [ ] Better error messages in callbacks
- [ ] Rate limiting on API endpoints
- [ ] Backup video hosting if all temp hosts fail
- [ ] Database for job history (beyond 1hr Redis TTL)

---

## 🔐 SECURITY NOTES

- Never commit `.env` file
- Rotate API keys regularly
- Airtable automation webhook has no auth (consider adding)
- Rate limiting not implemented (vulnerable to abuse)
- Temp video files cleaned up after 2 hours

---

## 📚 RELATED DOCUMENTATION

- [README.md](./README.md) - Comprehensive setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Railway/Render/Docker deployment
- [AIRTABLE_SETUP.md](./AIRTABLE_SETUP.md) - Airtable configuration
- [UPSTASH_SETUP.md](./UPSTASH_SETUP.md) - Redis setup
- [FFMPEG_OPTIMIZATION.md](./FFMPEG_OPTIMIZATION.md) - Memory optimization details
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

---

## 🎯 KEY TAKEAWAYS FOR NEXT SESSION

### What's Working Well
✅ Async callback architecture (no timeouts)
✅ Memory-optimized FFmpeg (no Railway SIGKILL)
✅ Programmatic prompt generation (infinite variety)
✅ Airtable automation integration
✅ Deployed and running on Railway

### Current Limitations
⚠️ No tests
⚠️ Limited error recovery
⚠️ Temp hosting can fail (3 fallbacks)
⚠️ 1-hour job TTL (no long-term history)

### Active Deployment
🚀 **Production URL:** Check Railway dashboard
🚀 **Airtable Base:** Connected and automated
🚀 **Redis:** Upstash free tier active

### Next Steps
1. Monitor production logs for errors
2. Track Sora API usage/costs
3. Consider adding webhook notifications
4. Implement retry logic for failed jobs
5. Add analytics tracking

---

**Questions or issues? Check logs on Railway or open GitHub issue.**
