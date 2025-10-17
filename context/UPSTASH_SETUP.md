# Upstash Redis Setup Guide

This API uses Upstash Redis (free tier) for tracking video generation jobs asynchronously. This guide will walk you through setting up your free Upstash Redis database.

## Why Upstash?

- **100% Free Tier**: 10,000 commands per day free forever
- **Serverless**: Pay only for what you use (beyond free tier)
- **Global**: Fast, low-latency access worldwide
- **REST API**: Works perfectly with serverless functions
- **No credit card** required for free tier

## Step 1: Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with:
   - GitHub (recommended - fastest)
   - Google
   - or Email

4. Verify your email if using email signup

## Step 2: Create a Redis Database

1. Once logged in, click **"Create Database"** on the dashboard

2. Configure your database:
   - **Name**: `sora-video-jobs` (or any name you prefer)
   - **Type**: **Regional** (recommended for free tier)
   - **Region**: Choose closest to your API deployment
     - If deploying on Render.com: Choose **US East (N. Virginia)** or **US West (Oregon)**
     - If deploying on Railway: Choose based on your Railway region
     - For testing: Choose closest to you
   - **Primary Region**: Select your chosen region
   - **Read Region**: None (not needed for this use case)
   - **TLS**: Enabled (recommended, default)
   - **Eviction**: Enabled (recommended to stay within free tier)

3. Click **"Create"**

## Step 3: Get Your Credentials

After creating the database, you'll see the database details page:

1. Scroll to the **"REST API"** section

2. You'll see two important values:
   ```
   UPSTASH_REDIS_REST_URL: https://your-db-name-12345.upstash.io
   UPSTASH_REDIS_REST_TOKEN: AXXXXXXXXXXXXxxxxxxxxxxxxxxx
   ```

3. Copy both values - you'll need them for configuration

## Step 4: Add to Environment Variables

### Local Development

1. Edit your `.env` file:

```env
UPSTASH_REDIS_REST_URL=https://your-db-name-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXXXXXXxxxxxxxxxxxxxxx
```

2. Save the file

### Deployed on Render.com

1. Go to your Render dashboard
2. Select your web service
3. Click **"Environment"** tab
4. Add two environment variables:
   - Key: `UPSTASH_REDIS_REST_URL`
     Value: `https://your-db-name-12345.upstash.io`
   - Key: `UPSTASH_REDIS_REST_TOKEN`
     Value: `AXXXXXXXXXXXXxxxxxxxxxxxxxxx`
5. Click **"Save Changes"**
6. Render will automatically redeploy

### Deployed on Railway

```bash
railway variables set UPSTASH_REDIS_REST_URL=https://your-db-name-12345.upstash.io
railway variables set UPSTASH_REDIS_REST_TOKEN=AXXXXXXXXXXXXxxxxxxxxxxxxxxx
```

### Deployed with Docker

Add to your `.env` file or pass as environment variables:

```bash
docker run -p 3000:3000 \
  -e UPSTASH_REDIS_REST_URL=https://your-db-name-12345.upstash.io \
  -e UPSTASH_REDIS_REST_TOKEN=AXXXXXXXXXXXXxxxxxxxxxxxxxxx \
  ... other vars ...
  sora-video-api
```

## Step 5: Verify Connection

Once configured, start your API and check the logs:

```bash
npm start
```

You should see:
```
[timestamp] INFO: Redis service initialized
```

If you see warnings about Redis not being configured, double-check your environment variables.

## Free Tier Limits

Upstash free tier includes:

- **10,000 commands per day**: More than enough for typical usage
  - Each job uses ~10-15 commands
  - Supports ~600-1000 jobs per day
- **256 MB max database size**: Plenty for job tracking
  - Each job uses ~2-5 KB
  - Can store tens of thousands of jobs
- **1-hour data retention** on free tier: Jobs auto-expire after 1 hour
  - Configurable in code (default: 1 hour TTL)

### What Happens If You Exceed Limits?

- Commands are throttled (not lost)
- Oldest data is evicted if storage limit reached
- No charges - stays free forever

## Monitoring Your Usage

1. Go to Upstash dashboard
2. Select your database
3. View metrics:
   - Daily requests
   - Storage usage
   - Throughput

## Troubleshooting

### "Redis not configured" Warning

**Cause**: Environment variables not set or incorrect

**Solution**:
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. Check for typos
3. Restart your API after adding variables

### "Connection failed" Error

**Cause**: Invalid credentials or network issue

**Solution**:
1. Verify credentials match exactly from Upstash dashboard
2. Check if TLS is enabled (should be)
3. Ensure no firewall blocking Upstash domain

### Jobs Not Persisting

**Cause**: Data might be evicted or TTL expired

**Solution**:
1. Check Upstash dashboard for storage limits
2. Verify `JOB_TIMEOUT` in .env (default: 600000ms = 10 min)
3. Jobs auto-expire after 1 hour by default

## Advanced: Upgrade to Paid Tier

If you need more:

- **Pro Plan**: $10/month
  - 100,000 commands/day
  - 1 GB storage
  - 7-day retention
  - Priority support

To upgrade:
1. Upstash Dashboard → Billing
2. Add payment method
3. Select plan

**Note**: For this API, free tier is usually sufficient unless processing 1000+ videos per day.

## Data Structure

The API stores this in Redis:

### Job Data
```
Key: job:job_1234567890_abc123
Value: {
  "jobId": "job_1234567890_abc123",
  "status": "generating",
  "prompt1": "...",
  "prompt2": "...",
  "video1Url": "https://...",
  "video2Url": "https://...",
  "recordId": "recXXXXXXXXXX",
  "createdAt": 1704067200000,
  "updatedAt": 1704067300000
}
TTL: 3600 seconds (1 hour)
```

### Task Mappings
```
Key: task:281e5b0******************f39b9
Value: {
  "jobId": "job_1234567890_abc123",
  "videoNumber": 1
}
TTL: 3600 seconds
```

## Alternative: Run Without Redis

While not recommended for production, you can run the API without Redis for testing:

1. Don't set `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`
2. The API will log warnings but continue to work
3. **Limitation**: Callbacks won't work without Redis
   - Job state can't be tracked
   - Videos won't be stitched automatically

**Recommendation**: Always use Redis for production deployments.

## Best Practices

1. **Set PUBLIC_URL correctly**: Callbacks depend on this
   ```env
   PUBLIC_URL=https://your-app.onrender.com
   ```

2. **Monitor usage**: Check Upstash dashboard weekly

3. **Set appropriate TTL**: Jobs auto-delete after 1 hour (configurable)

4. **Backup important data**: Don't rely on Redis for permanent storage
   - Videos are stored in Airtable
   - Redis only for temporary job tracking

5. **Test locally first**: Use Upstash from local dev to verify setup

## Security

- **Never commit** `.env` file with credentials
- **Rotate tokens** if exposed (Upstash Dashboard → Database → Reset Token)
- **Use TLS**: Always enabled by default on Upstash
- **Environment variables**: Use platform's secret management

## Support

- [Upstash Documentation](https://docs.upstash.com/redis)
- [Upstash Discord](https://discord.gg/upstash)
- [Upstash GitHub](https://github.com/upstash/upstash-redis)

---

**Next Step**: Return to the main [README.md](README.md) to complete API setup.
