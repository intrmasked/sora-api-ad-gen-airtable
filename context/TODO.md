# TODO: API Migration & Improvements

**Last Updated:** 2025-10-17
**Priority:** High - Migration from kie.ai to official APIs

---

## 🚨 HIGH PRIORITY: API Migration

### 1. Switch to Sora's Official API
**Status:** 🔴 Not Started
**Priority:** P0 - Critical

**Current State:**
- Using kie.ai as Sora API proxy
- Base URL: `https://api.kie.ai/api/v1`
- Model: `sora-2-pro-text-to-video`

**Migration Tasks:**
- [ ] Research OpenAI's official Sora API documentation
  - [ ] Check endpoint structure (`POST /v1/videos/generations` or similar)
  - [ ] Verify authentication method (Bearer token vs API key)
  - [ ] Confirm callback support (or if polling is required)
  - [ ] Document parameter differences from kie.ai

- [ ] Update `src/services/soraService.js`
  - [ ] Change base URL to official OpenAI endpoint
  - [ ] Update request payload format
  - [ ] Update authentication headers
  - [ ] Handle response format differences
  - [ ] Update callback payload parsing (if different)

- [ ] Update `src/config/config.js`
  - [ ] Replace `SORA_API_KEY` with `OPENAI_API_KEY` (or add both)
  - [ ] Update `SORA_API_BASE_URL` default to official endpoint

- [ ] Update `.env.example`
  - [ ] Add documentation for official Sora API credentials
  - [ ] Remove kie.ai references

- [ ] Test migration
  - [ ] Test single video generation
  - [ ] Test callback handling
  - [ ] Test parallel video generation (2 videos)
  - [ ] Test error handling
  - [ ] Verify video quality and parameters match

**Files to Modify:**
- `src/services/soraService.js` (primary changes)
- `src/config/config.js`
- `.env.example`
- `README.md` (update setup instructions)
- `CONTEXT.md` (update API documentation)

**Estimated Effort:** 4-6 hours

---

### 2. Create OpenAI Webhook for Video Generation
**Status:** 🔴 Not Started
**Priority:** P0 - Critical

**Purpose:**
Replace direct Sora API calls with OpenAI webhook that handles:
- Video generation requests
- Status updates
- Completion notifications

**Tasks:**
- [ ] Design webhook architecture
  - [ ] Decide: OpenAI webhook triggers Sora? Or OpenAI handles all?
  - [ ] Define payload format
  - [ ] Define response format
  - [ ] Plan error handling

- [ ] Create OpenAI webhook endpoint
  - [ ] Add route: `POST /api/webhook/openai`
  - [ ] Implement authentication/signature verification
  - [ ] Parse incoming OpenAI requests
  - [ ] Trigger video generation workflow

- [ ] Update video generation flow
  - [ ] Modify `videoController.js` to use webhook
  - [ ] Update job creation logic
  - [ ] Handle OpenAI-specific parameters

- [ ] Configure OpenAI webhook
  - [ ] Set webhook URL in OpenAI dashboard
  - [ ] Configure events to listen for
  - [ ] Set up retry policy

- [ ] Add logging and monitoring
  - [ ] Log all webhook requests
  - [ ] Track webhook failures
  - [ ] Add metrics for response times

**Files to Create/Modify:**
- `src/controllers/webhookController.js` (new)
- `src/routes/webhookRoutes.js` (new)
- `src/services/openaiService.js` (new)
- `src/routes/videoRoutes.js` (update)
- `src/server.js` (add webhook routes)

**Estimated Effort:** 6-8 hours

---

### 3. Replace kie.ai Infrastructure
**Status:** 🔴 Not Started
**Priority:** P1 - High

**Goal:** Complete removal of kie.ai dependency

**Tasks:**
- [ ] Audit codebase for kie.ai references
  - [ ] Search for `kie.ai` across all files
  - [ ] Check environment variables
  - [ ] Check documentation files

- [ ] Replace with official OpenAI SDK
  - [ ] Install `openai` package (already in package.json)
  - [ ] Import OpenAI SDK in soraService
  - [ ] Use official SDK methods instead of axios

- [ ] Update all API calls
  - [ ] Replace Sora video generation calls
  - [ ] Update prompt handling
  - [ ] Update callback URL handling

- [ ] Update error handling
  - [ ] Map OpenAI error codes to our system
  - [ ] Update error messages for users
  - [ ] Add retry logic for OpenAI-specific errors

- [ ] Update configuration
  - [ ] Remove `SORA_API_BASE_URL` (use SDK default)
  - [ ] Consolidate to single `OPENAI_API_KEY`
  - [ ] Update Railway environment variables

- [ ] Update documentation
  - [ ] README.md setup instructions
  - [ ] DEPLOYMENT.md environment variables
  - [ ] CONTEXT.md API documentation
  - [ ] AIRTABLE_SETUP.md webhook URLs

**Files to Modify:**
- `src/services/soraService.js` (rewrite using OpenAI SDK)
- `src/services/promptGenerationService.js` (already uses OpenAI)
- `src/config/config.js`
- `.env.example`
- `README.md`
- `DEPLOYMENT.md`
- `CONTEXT.md`

**Search Commands:**
```bash
# Find all kie.ai references
grep -r "kie.ai" .
grep -r "SORA_API" .
```

**Estimated Effort:** 4-6 hours

---

## 🔧 TECHNICAL IMPROVEMENTS

### 4. Implement OpenAI Client Wrapper
**Status:** 🔴 Not Started
**Priority:** P1 - High

**Tasks:**
- [ ] Create centralized OpenAI service
  - [ ] File: `src/services/openaiClient.js`
  - [ ] Initialize OpenAI SDK with API key
  - [ ] Add error handling wrapper
  - [ ] Add retry logic
  - [ ] Add rate limit handling

- [ ] Consolidate OpenAI usage
  - [ ] Sora video generation (soraService)
  - [ ] Prompt generation (promptGenerationService)
  - [ ] Future: image generation, embeddings, etc.

- [ ] Add monitoring
  - [ ] Track API usage
  - [ ] Log response times
  - [ ] Track costs per request

**Estimated Effort:** 3-4 hours

---

### 5. Update Callback System for Official API
**Status:** 🔴 Not Started
**Priority:** P1 - High

**Tasks:**
- [ ] Research OpenAI Sora callback format
  - [ ] Document expected payload structure
  - [ ] Compare with current kie.ai format

- [ ] Update callback handler
  - [ ] File: `src/controllers/videoController.js`
  - [ ] Update `handleSoraCallback` method
  - [ ] Parse OpenAI callback payload
  - [ ] Extract video URLs correctly
  - [ ] Handle OpenAI-specific status codes

- [ ] Update callback URL configuration
  - [ ] Verify PUBLIC_URL is correct
  - [ ] Test callback endpoint accessibility
  - [ ] Add callback signature verification (if OpenAI supports)

- [ ] Test callback flow
  - [ ] Trigger test video generation
  - [ ] Verify callback received
  - [ ] Check video URLs are correct
  - [ ] Confirm Redis updates properly

**Estimated Effort:** 2-3 hours

---

## 📝 DOCUMENTATION UPDATES

### 6. Update All Documentation
**Status:** 🔴 Not Started
**Priority:** P2 - Medium

**Tasks:**
- [ ] Update README.md
  - [ ] Change setup instructions for OpenAI API
  - [ ] Remove kie.ai references
  - [ ] Update environment variable examples
  - [ ] Update API endpoint descriptions

- [ ] Update CONTEXT.md
  - [ ] Change "Sora API" to "OpenAI Sora API"
  - [ ] Update architecture diagrams
  - [ ] Update configuration section
  - [ ] Update cost breakdown (OpenAI pricing)

- [ ] Update DEPLOYMENT.md
  - [ ] Update Railway environment variables
  - [ ] Change API key setup instructions

- [ ] Update .env.example
  - [ ] Replace SORA_API_KEY with OPENAI_API_KEY
  - [ ] Remove SORA_API_BASE_URL
  - [ ] Add comments explaining OpenAI Sora access

- [ ] Update AIRTABLE_SETUP.md
  - [ ] Update webhook URL examples (if changed)

**Estimated Effort:** 2-3 hours

---

## 🧪 TESTING

### 7. Comprehensive Testing Post-Migration
**Status:** 🔴 Not Started
**Priority:** P0 - Critical

**Tasks:**
- [ ] Manual testing
  - [ ] Test `/api/generate-video` endpoint
  - [ ] Test `/api/process-record` endpoint
  - [ ] Test `/api/process-master-prompt` endpoint
  - [ ] Test job status tracking
  - [ ] Test callback handling

- [ ] Integration testing
  - [ ] Test full Airtable automation flow
  - [ ] Test parallel video generation
  - [ ] Test error scenarios (bad prompts, API failures)
  - [ ] Test video stitching
  - [ ] Test Airtable upload

- [ ] Load testing
  - [ ] Test multiple concurrent jobs
  - [ ] Verify Redis handles state correctly
  - [ ] Check memory usage under load

- [ ] Edge cases
  - [ ] Test callback failures (retry logic)
  - [ ] Test network timeouts
  - [ ] Test invalid API responses
  - [ ] Test Redis connection loss

**Estimated Effort:** 4-6 hours

---

## 🚀 DEPLOYMENT

### 8. Deploy Migration to Production
**Status:** 🔴 Not Started
**Priority:** P0 - Critical

**Tasks:**
- [ ] Pre-deployment checklist
  - [ ] All tests passing
  - [ ] Documentation updated
  - [ ] Environment variables ready
  - [ ] Backup current deployment

- [ ] Update Railway environment variables
  - [ ] Add OPENAI_API_KEY
  - [ ] Remove old SORA_API_KEY (or keep as fallback)
  - [ ] Remove SORA_API_BASE_URL
  - [ ] Update PUBLIC_URL if needed

- [ ] Deploy to Railway
  - [ ] Push to main branch
  - [ ] Monitor deployment logs
  - [ ] Verify build success
  - [ ] Check health endpoint

- [ ] Post-deployment verification
  - [ ] Test API endpoints manually
  - [ ] Trigger test Airtable automation
  - [ ] Monitor logs for errors
  - [ ] Check first video generation succeeds

- [ ] Rollback plan
  - [ ] Document how to revert to kie.ai
  - [ ] Keep old env vars as backup
  - [ ] Have previous git commit ready

**Estimated Effort:** 2-3 hours

---

## 🔮 FUTURE ENHANCEMENTS (Post-Migration)

### 9. Add OpenAI Features
**Status:** 🟡 Future
**Priority:** P3 - Low

**Ideas:**
- [ ] Use GPT-4 for better prompt generation
- [ ] Add DALL-E for thumbnail generation
- [ ] Use Whisper for voiceover generation
- [ ] Add embeddings for content search
- [ ] Implement OpenAI assistants for workflow automation

---

## 📊 MIGRATION CHECKLIST

### Phase 1: Research & Planning (Day 1)
- [ ] Read OpenAI Sora API documentation
- [ ] Compare kie.ai vs OpenAI API differences
- [ ] Document migration plan
- [ ] Create test plan

### Phase 2: Code Migration (Day 2-3)
- [ ] Update soraService.js
- [ ] Create OpenAI webhook endpoint
- [ ] Update configuration files
- [ ] Remove kie.ai references

### Phase 3: Testing (Day 4)
- [ ] Local testing
- [ ] Integration testing
- [ ] Fix bugs

### Phase 4: Documentation (Day 4)
- [ ] Update all docs
- [ ] Update comments in code

### Phase 5: Deployment (Day 5)
- [ ] Deploy to Railway
- [ ] Monitor production
- [ ] Fix production issues

---

## 🎯 SUCCESS CRITERIA

Migration is complete when:
- ✅ No kie.ai references in codebase
- ✅ All API calls use official OpenAI SDK
- ✅ Callbacks working with official API
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Deployed to Railway successfully
- ✅ First production video generated successfully
- ✅ Airtable automation working end-to-end

---

## 📞 CONTACTS & RESOURCES

**OpenAI Sora Documentation:**
- API Docs: https://platform.openai.com/docs/api-reference/sora
- Pricing: https://openai.com/pricing
- Support: https://help.openai.com

**Current kie.ai Setup:**
- Base URL: https://api.kie.ai/api/v1
- Model: sora-2-pro-text-to-video
- File: `src/services/soraService.js:10`

**Key Files:**
- Sora Service: `src/services/soraService.js`
- Config: `src/config/config.js`
- Callback Handler: `src/controllers/videoController.js:119`

---

**Notes:**
- Keep kie.ai credentials as backup during migration
- Test thoroughly in development before production deployment
- Monitor costs carefully after switching to official API
- Consider rate limits and quotas

**Estimated Total Effort:** 25-35 hours
**Suggested Timeline:** 5-7 days
