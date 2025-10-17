# Deployment Guide

This guide provides step-by-step instructions for deploying your Sora Video Stitcher API to free hosting platforms.

## Prerequisites

- [ ] GitHub account
- [ ] Git installed locally
- [ ] All environment variables ready (Sora API key, Airtable credentials)
- [ ] Project tested locally

---

## Option 1: Render.com (Recommended)

Render offers 750 hours/month free, perfect for this API.

### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Sora Video Stitcher API"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/sora-video-api.git
git branch -M main
git push -u origin main
```

### Step 2: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest option)

### Step 3: Create New Web Service

1. From Render Dashboard, click "New +"
2. Select "Web Service"
3. Click "Connect Account" to link GitHub
4. Find your repository and click "Connect"

### Step 4: Configure Service

Render should auto-detect settings from `render.yaml`, but verify:

- **Name**: `sora-video-stitcher-api` (or your choice)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `chmod +x build.sh && ./build.sh`
- **Start Command**: `npm start`
- **Plan**: `Free`

### Step 5: Add Environment Variables

Click "Environment" tab and add:

```
SORA_API_KEY=your_actual_sora_api_key
AIRTABLE_API_KEY=your_actual_airtable_api_key
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Table 1
```

Optional variables (already have defaults):
```
NODE_ENV=production
PORT=3000
SORA_API_BASE_URL=https://api.kie.ai/api/v1
SORA_POLL_INTERVAL=5000
SORA_MAX_WAIT_TIME=300000
```

### Step 6: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes for first deploy)
3. Watch the logs for any errors

### Step 7: Test Your Deployment

Your API will be live at: `https://your-service-name.onrender.com`

Test with curl:
```bash
curl https://your-service-name.onrender.com/api/health
```

### Step 8: Update Airtable Automation

Update your Airtable webhook URL to:
```
https://your-service-name.onrender.com/api/process-record
```

### Important: Free Tier Limitations

- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month free (enough for most use cases)

To keep service awake, use a service like [UptimeRobot](https://uptimerobot.com) to ping your API every 5 minutes.

---

## Option 2: Railway.app

Railway offers $5 free credit, good for ~1 month of light usage.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

This opens browser for authentication.

### Step 3: Initialize Project

```bash
cd sora-api-ad-gen-airtable
railway init
```

Follow prompts to create a new project.

### Step 4: Add Environment Variables

```bash
railway variables set SORA_API_KEY=your_key
railway variables set AIRTABLE_API_KEY=your_key
railway variables set AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
railway variables set AIRTABLE_TABLE_NAME="Table 1"
```

### Step 5: Deploy

```bash
railway up
```

Wait for deployment to complete.

### Step 6: Get Your URL

```bash
railway domain
```

This generates a public URL for your API.

### Step 7: Monitor

View logs:
```bash
railway logs
```

View in dashboard:
```bash
railway open
```

---

## Option 3: Cyclic.sh

Cyclic offers generous free tier with serverless deployment.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/sora-video-api.git
git push -u origin main
```

### Step 2: Deploy on Cyclic

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click "Connect to GitHub"
3. Select your repository
4. Click "Connect Cyclic"

### Step 3: Add Environment Variables

In Cyclic dashboard:
1. Go to "Variables" tab
2. Add each variable:
   - `SORA_API_KEY`
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_TABLE_NAME`

### Step 4: Deploy

Cyclic deploys automatically. Your API will be at:
```
https://your-app-name.cyclic.app
```

---

## Option 4: Docker on Any Platform

Deploy using Docker to any platform that supports containers.

### Step 1: Build Image Locally

```bash
docker build -t sora-video-api .
```

### Step 2: Test Locally

```bash
docker run -p 3000:3000 \
  -e SORA_API_KEY=your_key \
  -e AIRTABLE_API_KEY=your_key \
  -e AIRTABLE_BASE_ID=your_base_id \
  -e AIRTABLE_TABLE_NAME=your_table_name \
  sora-video-api
```

### Step 3: Deploy to Platform

#### Option A: Render with Docker

1. Render auto-detects Dockerfile
2. Push to GitHub
3. Connect to Render
4. It will use Docker build

#### Option B: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set SORA_API_KEY=your_key
fly secrets set AIRTABLE_API_KEY=your_key
fly secrets set AIRTABLE_BASE_ID=your_base_id
fly secrets set AIRTABLE_TABLE_NAME=your_table_name

# Deploy
fly deploy
```

---

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Test health endpoint: `GET /api/health`
- [ ] Test video generation with sample prompts
- [ ] Verify Airtable integration works
- [ ] Update Airtable automation webhook URL
- [ ] Set up monitoring/logging
- [ ] Document your deployment URL
- [ ] Test error handling (invalid prompts, etc.)
- [ ] Monitor first few video generations

## Monitoring and Logs

### View Logs on Render

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Watch real-time logs

### View Logs on Railway

```bash
railway logs
```

### View Logs on Cyclic

1. Cyclic Dashboard
2. Select your app
3. "Logs" tab

### View Logs with Docker

```bash
docker logs <container-id>
```

## Troubleshooting Deployments

### Build Fails

**Error**: "FFmpeg not found"
- **Solution**: Build script should install it. Check build logs.

**Error**: "npm install failed"
- **Solution**: Check package.json syntax, ensure Node 18+ specified.

### Runtime Errors

**Error**: "Missing environment variables"
- **Solution**: Double-check all variables are set in platform dashboard.

**Error**: "Port already in use"
- **Solution**: Ensure PORT variable is set correctly (platforms auto-assign).

**Error**: "Timeout on Sora API"
- **Solution**: Increase SORA_MAX_WAIT_TIME or check Sora API status.

### Performance Issues

**Slow response times**:
- Free tiers have limited resources
- Video processing is CPU-intensive
- Consider upgrading to paid tier for production use

**Out of memory**:
- Increase memory allocation (paid tier)
- Or reduce video quality/duration

## Updating Your Deployment

### For Git-Based Deployments (Render, Cyclic)

```bash
# Make changes
git add .
git commit -m "Update: description of changes"
git push

# Auto-deploys on most platforms
```

### For Railway

```bash
railway up
```

### For Docker

```bash
# Rebuild image
docker build -t sora-video-api .

# Redeploy to platform
```

## Cost Optimization

### Keep It Free

1. **Use Render Free Tier**: 750 hrs/month
2. **Optimize Sora API usage**: Only generate when needed
3. **Use Airtable Free Plan**: Up to 1,200 records
4. **Monitor usage**: Stay within free tier limits

### Tips to Save Costs

- Process videos during off-peak hours
- Batch process multiple videos
- Cache frequently used prompts
- Set up alerts for approaching limits

## Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **API Keys**: Rotate regularly
3. **Access Control**: Consider adding authentication
4. **Rate Limiting**: Implement to prevent abuse
5. **Monitoring**: Set up alerts for unusual activity

## Scaling Considerations

When you outgrow free tier:

1. **Upgrade hosting tier**: More CPU, RAM, uptime
2. **Add queue system**: Redis + Bull for job processing
3. **Multiple workers**: Process videos in parallel
4. **CDN for videos**: CloudFlare, Cloudinary
5. **Database**: Track jobs, status, history

## Support and Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Cyclic Docs**: [docs.cyclic.sh](https://docs.cyclic.sh)
- **Fly.io Docs**: [fly.io/docs](https://fly.io/docs)

---

## Quick Reference

| Platform | Free Tier | Sleep | Build Time | Best For |
|----------|-----------|-------|------------|----------|
| Render | 750 hrs/mo | After 15 min | ~5 min | Recommended, reliable |
| Railway | $5 credit | No | ~3 min | Fast deploys |
| Cyclic | Unlimited* | No | ~2 min | Serverless |
| Fly.io | 3 VMs free | No | ~4 min | Docker-friendly |

*Limitations apply

---

Need help? Check the main README.md or open an issue on GitHub!
