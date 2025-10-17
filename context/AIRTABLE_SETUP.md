# Airtable Setup Guide

This guide will walk you through setting up Airtable to work with the Sora Video Stitcher API.

## Step 1: Create an Airtable Base

1. Go to [Airtable](https://airtable.com)
2. Sign in or create a free account
3. Click "Add a base" → "Start from scratch"
4. Name your base (e.g., "Video Generation")

## Step 2: Create the Table Structure

Create a table with the following fields:

### Required Fields

| Field Name | Field Type | Description |
|------------|------------|-------------|
| `Prompt 1` | Long text | First video prompt |
| `Prompt 2` | Long text | Second video prompt |
| `Video` | Attachment | Generated video (auto-populated by API) |

### Optional Fields (Recommended)

| Field Name | Field Type | Description |
|------------|------------|-------------|
| `Status` | Single select | Processing status (Processing, Completed, Failed) |
| `Error` | Long text | Error messages if processing fails |
| `Created` | Created time | Auto-timestamp when record created |
| `Aspect Ratio` | Single select | Options: "landscape", "portrait" |

### Example Table Setup

Here's what your table should look like:

```
| Prompt 1                    | Prompt 2                     | Video | Status     | Error | Created  |
|-----------------------------|------------------------------|-------|------------|-------|----------|
| A cat playing with yarn     | A cat sleeping peacefully   | [📎]  | Processing | -     | 10/9/25  |
| Sunset over mountains       | Stars appearing in the sky  | [📎]  | Completed  | -     | 10/9/25  |
```

## Step 3: Get Your Airtable API Key

### Personal Access Token (Recommended - New Method)

1. Go to [Airtable Account](https://airtable.com/account)
2. Click on "Developer hub" in the left sidebar
3. Click "Create token"
4. Give it a name (e.g., "Sora Video API")
5. Add scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
6. Add access to your base
7. Click "Create token"
8. Copy the token (starts with `pat...`)

### API Key (Legacy Method)

1. Go to [Airtable Account](https://airtable.com/account)
2. Scroll to "API" section
3. Click "Generate API key"
4. Copy the API key (starts with `key...`)

## Step 4: Get Your Base ID

1. Go to [Airtable API Documentation](https://airtable.com/api)
2. Select your base from the list
3. The Base ID will be shown in the URL and in the docs
4. It looks like: `appXXXXXXXXXXXXXX`

Or find it in the URL when viewing your base:
```
https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY
                      ^^^^^^^^^^^^^^^^^^^
                      This is your Base ID
```

## Step 5: Get Your Table Name

Your table name is visible at the top of your Airtable base. It's typically:
- "Table 1" (default)
- Or whatever custom name you gave it (e.g., "Videos", "Generations")

**Important**: The table name is case-sensitive!

## Step 6: Configure Environment Variables

Add these to your `.env` file:

```env
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX   # Or keyXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Table 1
```

## Step 7: Set Up Automation (Optional but Recommended)

You can set up Airtable automations to automatically trigger video generation when you add new records.

### Create an Automation

1. In your base, click "Automations" in the top right
2. Click "Create automation"
3. Name it: "Generate Videos"

### Configure Trigger

1. Trigger: "When record matches conditions"
2. Table: Your table name
3. Conditions: "When Status is 'Pending'" (or create a view called "To Process")

### Configure Action

1. Action: "Run a script" or "Send webhook"
2. If using webhook:
   - URL: `https://your-api.onrender.com/api/process-record`
   - Method: POST
   - Headers:
     ```
     Content-Type: application/json
     ```
   - Body:
     ```json
     {
       "recordId": "{RECORD_ID}",
       "aspectRatio": "{Aspect Ratio}"
     }
     ```

### Using Dynamic Values

In the webhook body, you can use Airtable's dynamic fields:
- `{RECORD_ID}` - The current record's ID
- `{Aspect Ratio}` - Value from the Aspect Ratio field
- Any other field in your table

### Example Automation Flow

1. User creates new record with Prompt 1 and Prompt 2
2. User sets Status to "Pending"
3. Automation triggers webhook to API
4. API generates and stitches videos
5. API uploads video to record
6. API updates Status to "Completed"

## Step 8: Test the Integration

### Manual Test via API

1. Create a test record in Airtable with:
   - Prompt 1: "A beautiful sunset"
   - Prompt 2: "Stars in the night sky"
2. Note the record ID (hover over the record, click "Copy record URL", ID is the part after the last `/`)
3. Test with curl:

```bash
curl -X POST http://localhost:3000/api/process-record \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "recXXXXXXXXXXXXXX"
  }'
```

### Expected Results

After processing (2-5 minutes):
- Status field should be "Completed"
- Video field should have the stitched video
- If there's an error, Error field will contain details

## Troubleshooting

### "Invalid API Key" Error

- Verify your API key is correct
- Make sure you've given the token access to the correct base
- Try regenerating the API key

### "Base not found" Error

- Double-check the Base ID (it should start with `app`)
- Ensure the token has access to this base

### "Table not found" Error

- Verify the table name is exactly correct (case-sensitive)
- Make sure the table exists in the specified base

### "Field not found" Error

The API looks for these field names (in order):
- `Prompt 1` or `Prompt1`
- `Prompt 2` or `Prompt2`
- `Video` (for attachment)

Make sure at least one variant exists.

### Record Not Updating

- Check if the API returned an error
- Verify the record ID is correct
- Check API logs for details

## Best Practices

### 1. Use Views

Create different views for organization:
- **To Process**: Records with Status = "Pending"
- **Processing**: Status = "Processing"
- **Completed**: Status = "Completed"
- **Failed**: Status = "Failed"

### 2. Add Validation

Use Airtable's field options to add validation:
- Make Prompt 1 and Prompt 2 required
- Set default value for Aspect Ratio
- Use single select for Status with predefined options

### 3. Monitor Usage

- Track successful vs failed generations
- Monitor processing times
- Set up notifications for failures

### 4. Batch Processing

Process multiple records at once:
1. Create multiple records
2. Set them all to "Pending"
3. Automation will process them one by one

### 5. Error Handling

Always check the Error field if Status is "Failed":
- Common errors: Invalid API key, insufficient credits, timeout
- The Error field contains detailed error messages

## Example Record Data

### Before Processing
```
Prompt 1: "A chef cooking pasta in a professional kitchen"
Prompt 2: "The finished pasta dish being plated beautifully"
Video: (empty)
Status: Pending
Error: (empty)
Aspect Ratio: landscape
```

### During Processing
```
Status: Processing
```

### After Success
```
Video: stitched_1728432000000.mp4 (5.2 MB)
Status: Completed
```

### After Failure
```
Status: Failed
Error: "Failed to create Sora task: Insufficient credits"
```

## Advanced: Webhooks from Airtable

If you want Airtable to notify your API when records change:

1. Use Airtable's "Send to webhook" automation action
2. Configure webhook URL: `https://your-api.onrender.com/api/process-record`
3. Use dynamic values from the record
4. API will process and update the same record

## Security Considerations

1. **Never commit `.env` file** - It contains your API keys
2. **Use environment variables** on deployment platforms
3. **Rotate API keys** regularly
4. **Limit token scopes** to only what's needed
5. **Monitor API usage** to detect unauthorized access

## Support

- [Airtable API Documentation](https://airtable.com/api)
- [Airtable Community](https://community.airtable.com)
- [Airtable Support](https://support.airtable.com)

---

Need help? Open an issue on GitHub or refer to the main README.md
