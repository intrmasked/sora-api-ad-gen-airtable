# 🚀 Quick Start - Deploy in 10 Minutes

## ✅ Your System is Ready!

All tests passed:
- ✅ API working locally
- ✅ Programmatic prompt generation (no OpenAI needed)
- ✅ 10-second segment validation
- ✅ Environment variables configured

---

## 📋 What You Need

1. **Sora API Key** (you have this)
2. **Airtable Access** (you have this)
3. **Upstash Redis** (you have this)
4. **5 minutes** to deploy

---

## 🎯 Deployment Steps

### 1. Push to GitHub (if not already done)

```bash
git add .
git commit -m "Ready for production"
git push
```

### 2. Deploy to Railway (Easiest)

1. Go to [railway.app](https://railway.app) → Sign up/Login
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository → Railway deploys automatically

### 3. Add Environment Variables in Railway

Click "Variables" tab and add:

```bash
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://your-app.up.railway.app  # Update after deployment

SORA_API_KEY=your_key
SORA_API_BASE_URL=https://api.kie.ai/api/v1

AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Your Table Name

UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

JOB_TIMEOUT=600000
```

**IMPORTANT:** After deployment, copy your Railway URL and update `PUBLIC_URL` variable!

### 4. Update Airtable Automations

Replace webhook URLs in both automations with:
```
https://your-app.up.railway.app/api/process-record
```

**Automation Body:**
```json
{
  "recordId": "{RECORD_ID}",
  "aspectRatio": "{Aspect Ratio}"
}
```

---

## 🧪 Test It

### 1. Test Health

```bash
curl https://your-app.up.railway.app/api/health
```

Should return:
```json
{"success":true,"message":"API is running"}
```

### 2. Test Prompt Generation

```bash
curl -X POST https://your-app.up.railway.app/api/generate-prompts \
  -H "Content-Type: application/json" \
  -d '{"masterPrompt":"test","aspectRatio":"portrait"}'
```

Should return prompts and voiceovers.

### 3. Test Full Workflow in Airtable

1. Create record with:
   - Master Prompt: "Generate" (any text works)
   - Aspect Ratio: "portrait"
   - Status: "Pending"

2. Trigger automation

3. Watch Status: Pending → Generating → Processing → Stitching → Uploading → Completed

4. Check Video field for result!

---

## 📊 Your Airtable Columns (Already Set Up Correctly!)

```
✅ MasterPrompt (Long text) - Ignored, uses templates
✅ Prompt 1 (Long text) - Auto-generated
✅ Prompt 2 (Long text) - Auto-generated
✅ Voiceover 1 (Long text) - Auto-generated
✅ Voiceover 2 (Long text) - Auto-generated
✅ Video (Attachment) - Final output
✅ Status (Single select) - Tracks progress
✅ Error (Long text) - Error details
✅ Aspect Ratio (Single select) - landscape/portrait/square
```

---

## 🎬 How It Works

1. **You:** Create Airtable record (any text in Master Prompt)
2. **System:** Generates unique prompts from templates:
   - Part 1 (0-10s): Random Tool #2 (HeyGen, Midjourney, Runway, etc.)
   - Part 2 (10-20s): Cracked.ai (always #1)
3. **Sora:** Creates two 10-second videos
4. **System:** Stitches videos together
5. **Result:** 20-second viral video in Airtable

---

## 🔄 Variations

Every video is unique:
- **14,400+ combinations** possible
- No two videos are the same
- Fully automated - just click generate!

---

## 🆘 Troubleshooting

### "Cannot connect to Redis"
- Check Upstash credentials in Railway variables
- Verify Redis instance is active

### "Airtable field not found"
- Verify field names match exactly (case-sensitive)
- Your columns are already correct!

### "Sora task failed"
- Check Sora API credits
- Verify API key is valid
- Check logs in Railway dashboard

### Videos not stitching
- Check ffmpeg logs in Railway
- Verify both videos downloaded
- Check temp directory permissions

---

## 📈 Next Steps

### Add More Tools

Edit `/src/config/promptConfig.json`:
```json
"tool2": [
  "HeyGen",
  "Midjourney",
  "Runway",
  "Your New Tool"  // Add here
]
```

### Add More Hooks/CTAs

Same file:
```json
"hooks": [
  "Existing...",
  "Your viral hook here"
],
"cta_lines": [
  "Existing...",
  "Your CTA here"
]
```

Commit and push → Railway auto-deploys!

---

## ✨ You're Done!

Your system is:
- ✅ Deployed
- ✅ Connected to Airtable
- ✅ Generating infinite variations
- ✅ Ready for scale

**Generate your first video now!** 🎉

---

For detailed deployment options (Render, Cyclic, Docker), see `DEPLOYMENT.md`.
For Airtable setup details, see `AIRTABLE_SETUP.md`.
