# Vercel Backend Setup Guide

## Quick Deploy to Vercel (5 minutes)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy the Backend
```bash
# From the project root directory
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name? **arcticulab-backend** (or any name)
- In which directory is your code? **./**
- Want to override settings? **N**

### Step 4: Add Environment Variable
After deployment, add your API key:

**Option A: Via CLI**
```bash
vercel env add XAI_API_KEY
```
Enter your xAI API key when prompted.

**Option B: Via Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add: `XAI_API_KEY` = `your-xai-api-key-here`
5. Click "Save"

### Step 5: Redeploy
```bash
vercel --prod
```

### Step 6: Get Your Backend URL
After deployment, Vercel will show your URL like:
```
https://arcticulab-backend.vercel.app
```

### Step 7: Update Frontend
Update `app-static.js` line 4:
```javascript
const API_URL = 'https://YOUR-PROJECT-NAME.vercel.app/api';
```

Replace with your actual Vercel URL.

### Step 8: Test Your Backend
Visit: `https://YOUR-PROJECT-NAME.vercel.app/api/search-jobs`

You should see: "Method not allowed" (This is correct - it needs POST requests)

### Step 9: Push to GitHub
```bash
git add .
git commit -m "Add Vercel backend configuration"
git push origin main
```

---

## Alternative: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ststephen510/ststephen510.github.io)

1. Click the button above
2. Connect your GitHub account
3. Add environment variable: `XAI_API_KEY`
4. Deploy!

---

## Troubleshooting

### Health Check Endpoint

The `/api/health` endpoint provides diagnostic information about your deployment:

```bash
curl https://YOUR-PROJECT.vercel.app/api/health
```

This returns:
- API key configuration status (without exposing the key)
- Environment information
- Available endpoints
- Troubleshooting tips if issues are detected

### Common Issues and Solutions

#### Build Failure: "Command 'npm install' exited with 254"

**Cause:** The `package.json` contains dependencies or scripts that are not compatible with Vercel's serverless environment.

**Solution:** 
- Ensure `package.json` is minimal and doesn't include server-specific dependencies
- Remove `nodemon`, `express`, and other server-only dependencies from the root `package.json`
- The current `package.json` should only contain metadata, no dependencies are required for the serverless functions

#### Runtime Error: "API key not configured"

**Cause:** The `XAI_API_KEY` environment variable is not set in Vercel.

**Solution:**
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add: `XAI_API_KEY` = `your-xai-api-key`
3. Make sure to add it for all environments (Production, Preview, Development)
4. **Important:** Redeploy after adding the environment variable

**Note:** The app will still work without the API key - it will use intelligent fallback matching instead of AI-powered results.

#### Runtime Error: 500 Internal Server Error

**Cause:** Various issues including API key problems, rate limiting, or service unavailability.

**Solution:**
1. Check the `/api/health` endpoint to diagnose the issue
2. Check Vercel deployment logs: Dashboard > Your Project > Deployments > Select deployment > View Function Logs
3. Verify your xAI API key is valid and has sufficient quota
4. The app automatically falls back to intelligent matching if the API fails

#### CORS Errors

**Cause:** Cross-origin requests are being blocked.

**Solution:**
- The API has CORS enabled for all origins (`*`)
- If you still see CORS errors, check that you're using the correct endpoint URL
- Ensure you're making requests to `/api/search-jobs` with `POST` method

#### "Module not found" Error

**Cause:** Missing dependencies or incorrect file structure.

**Solution:**
- Verify that `api/search-jobs.js` and `api/health.js` exist in the repository
- Check that there are no syntax errors in the JavaScript files
- Review Vercel build logs for specific error messages

#### Slow Response Times

**Cause:** Cold starts or API latency.

**Solution:**
- First requests after idle periods may be slower (cold start)
- The xAI API call itself takes a few seconds
- Consider using the fallback matching for faster responses

### Checking Deployment Logs

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on "Deployments"
4. Select the latest deployment
5. Click "View Function Logs" or "View Build Logs"

Look for:
- `[search-jobs]` prefixed logs for API function activity
- `[health]` prefixed logs for health check activity
- Error messages with stack traces

### Testing the API Manually

**Test Health Endpoint:**
```bash
curl https://YOUR-PROJECT.vercel.app/api/health
```

**Test Search Endpoint:**
```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/search-jobs \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"Engineer","specialization":"Chemical","region":"Germany"}'
```

### Fallback Mode

The application has a built-in fallback mechanism:
- If the xAI API is unavailable, rate-limited, or returns an error, the app automatically uses intelligent keyword-based matching
- Users will see a notice indicating they're viewing fallback results
- The fallback provides relevant job matches based on company descriptions and search keywords

---

## Success!
Once deployed, your site at `https://ststephen510.github.io` will call the Vercel backend, which securely handles the xAI API calls.

Your API will be at: `https://YOUR-PROJECT.vercel.app/api/search-jobs`
Health check at: `https://YOUR-PROJECT.vercel.app/api/health`
