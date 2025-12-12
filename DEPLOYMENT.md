# Deployment Guide

This guide provides step-by-step instructions to deploy the European Chemical Engineering Jobs application with a split architecture:
- **Frontend**: Hosted on GitHub Pages (static HTML/CSS/JavaScript)
- **Backend**: Hosted on Vercel (serverless API functions)

## Architecture Overview

```
Frontend (GitHub Pages)          Backend (Vercel)
https://ststephen510.github.io   https://your-project.vercel.app
├── docs/index.html          →   └── api/search.js
                                      (serverless function)
```

---

## Part 1: Deploy Backend to Vercel

### Step 1: Sign up or Log in to Vercel

1. Visit [https://vercel.com](https://vercel.com)
2. Click "Sign Up" if you don't have an account, or "Log In" if you do
3. We recommend signing up with your GitHub account for easier integration

### Step 2: Import Your GitHub Repository

1. Once logged in, click **"Add New"** in the top right corner
2. Select **"Project"** from the dropdown menu
3. Click **"Import Git Repository"**
4. If this is your first time, you'll need to:
   - Click **"Install Vercel for GitHub"**
   - Select which repositories to give Vercel access to
   - Choose `ststephen510/ststephen510.github.io`
5. Click **"Import"** next to your repository

### Step 3: Configure Project Settings

On the project configuration page:

1. **Framework Preset**: Select **"Other"** (or leave as detected)
2. **Root Directory**: Leave as **"./"** (default)
3. **Build Command**: Leave empty (no build needed for serverless functions)
4. **Output Directory**: Leave empty
5. **Install Command**: Leave as default (`npm install`)

### Step 4: Add Environment Variable

This is **critical** for the application to work:

1. Scroll down to **"Environment Variables"** section
2. Click **"Add"** or expand the section
3. Add the following:
   - **Name**: `XAI_API_KEY`
   - **Value**: Your xAI API key (get it from [https://console.x.ai](https://console.x.ai))
   - **Environment**: Select all environments (Production, Preview, Development)
4. Click the checkmark to save

**Getting your xAI API Key:**
- Visit [https://console.x.ai](https://console.x.ai)
- Sign in or create an account
- Navigate to the API Keys section
- Create a new API key
- Copy the key and paste it as the value

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for the deployment to complete (usually 1-2 minutes)
3. Once complete, you'll see a success message with confetti! 🎉
4. Click **"Continue to Dashboard"**

### Step 6: Copy Your Vercel URL

1. On your project dashboard, you'll see your deployment URL
2. It will look like: `https://your-project-name.vercel.app`
3. **Copy this URL** - you'll need it for the next part
4. Click on the URL to verify the deployment worked

**Note**: You can also set up a custom domain in Vercel settings if you prefer.

---

## Part 2: Update Frontend Configuration

Now that your backend is deployed, you need to update the frontend to point to it.

### Step 1: Update index.html

1. Open your local copy of the repository in a code editor
2. Navigate to: `docs/index.html`
3. Find the line (around line 358):
   ```javascript
   const BACKEND_URL = 'https://YOUR-VERCEL-URL-HERE.vercel.app';
   ```
4. Replace `YOUR-VERCEL-URL-HERE` with your actual Vercel project name:
   ```javascript
   const BACKEND_URL = 'https://my-actual-project.vercel.app';
   ```
   ⚠️ **Important**: Do NOT include a trailing slash

### Step 2: Commit and Push Changes

```bash
git add docs/index.html
git commit -m "Configure backend URL for Vercel deployment"
git push origin main
```

---

## Part 3: Enable GitHub Pages

### Step 1: Configure GitHub Pages

1. Go to your GitHub repository: `https://github.com/ststephen510/ststephen510.github.io`
2. Click **"Settings"** (in the repository menu)
3. Scroll down and click **"Pages"** (in the left sidebar)
4. Under **"Source"**, select:
   - **Source**: "Deploy from a branch"
   - **Branch**: `main`
   - **Folder**: `/docs`
5. Click **"Save"**

### Step 2: Wait for Deployment

1. GitHub Pages will start building your site
2. Wait 1-2 minutes for the deployment to complete
3. Refresh the Settings → Pages page to see the deployment status
4. Once complete, you'll see: "Your site is live at https://ststephen510.github.io"

### Step 3: Access Your Application

1. Visit: [https://ststephen510.github.io](https://ststephen510.github.io)
2. You should see the job search application interface

---

## Part 4: Test the Application

### Step 1: Test the Search Functionality

1. Open [https://ststephen510.github.io](https://ststephen510.github.io) in your browser
2. Fill out the job search form:
   - **Profession**: e.g., "Chemical Engineer"
   - **Specialization**: e.g., "Process Engineering"
   - **Location**: e.g., "Germany"
3. Click **"Search Jobs"**
4. Wait for the results (may take 10-60 seconds)
5. Verify that job listings appear

### Step 2: Verify Results

Check that the results display:
- Job titles
- Company names
- Working "View Job →" links
- Properly formatted job cards

---

## Debugging

When troubleshooting issues with the application, you now have comprehensive debugging instrumentation:

### Where to Find Logs

**Vercel Function Logs:**
1. Go to [vercel.com](https://vercel.com) and select your project
2. Click **"Deployments"** → select the latest deployment
3. Scroll to **"Function Logs"** or click **"View Function Logs"**
4. Each request is now tagged with a unique Request ID for easy correlation

**Request ID Correlation:**
- Every request now includes an `X-Request-Id` header
- Frontend generates and displays the Request ID when errors occur
- Backend logs all operations with the Request ID prefix: `[abc123xyz456]`
- Use the Request ID to find related log entries in Vercel

**Example Vercel Log Output:**
```
[a1b2c3d4e5f6] START POST /api/search - Origin: https://ststephen510.github.io
[a1b2c3d4e5f6] Searching for: Chemical Engineer - Process Engineering - Germany
[a1b2c3d4e5f6] Reading companies from: /var/task/companies.txt (__dirname-based)
[a1b2c3d4e5f6] Loaded 150 companies
[a1b2c3d4e5f6] Calling xAI Grok API...
[a1b2c3d4e5f6] Received response from xAI, parsing...
[a1b2c3d4e5f6] END - Returning 42 jobs - Duration: 8234ms
```

### Frontend Error Display

When a search fails, the UI now shows:
- **User-friendly error message** with actionable hints
- **HTTP Status Code** from the backend
- **xAI Status Code** (if different from HTTP status)
- **Request ID** for log correlation
- **Expandable debug section** with detailed information

**Example Error Display:**
```
⚠️ Error
xAI API request failed

💡 Rate limit exceeded. Wait a moment and try again, or upgrade your xAI plan

▶ Show debug information
  HTTP Status: 429
  xAI Status: 429
  Request ID: a1b2c3d4e5f6
  Details: {"error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}}
  Timestamp: 2025-12-12T02:38:22.774Z
```

### Testing Backend Connection

The frontend now includes a **"Test Backend Connection"** button that:
- Calls `/api/health` endpoint
- Displays backend status, API key configuration, and Node version
- Shows Request ID for correlation
- Helps diagnose connectivity issues before running searches

### Common Error Scenarios

**1. API Key Issues (Status 401/403):**
- **Hint shown:** "Invalid API key" or "Access forbidden"
- **What to check:** Vercel environment variables, API key validity
- **Logs show:** `[requestId] ERROR: XAI_API_KEY not found` or xAI 401/403 response

**2. Rate Limiting (Status 429):**
- **Hint shown:** "Rate limit exceeded. Wait a moment..."
- **What to check:** xAI console for usage limits
- **Logs show:** `[requestId] xAI API error: 429`

**3. Timeout (Status 504):**
- **Hint shown:** "Request timed out"
- **What to do:** Try again or simplify search criteria
- **Logs show:** `[requestId] ERROR: xAI request timed out`

**4. Server Errors (Status 500+):**
- **Hint shown:** "xAI service error. Try again..."
- **What to do:** Wait a few moments, check xAI status page
- **Logs show:** `[requestId] xAI API error: 500` with response snippet

### No Secrets Logged

The debugging instrumentation is designed to be safe:
- ✅ API keys are **never** logged or returned in responses
- ✅ Only first 500 characters of error responses are logged
- ✅ All sensitive data remains in Vercel environment variables
- ✅ Request IDs are random and don't contain user data

---

## Troubleshooting

### CORS Errors

**Symptom**: Console shows CORS policy errors, or you get network errors

**Solutions**:
1. Verify that `/api/search.js` includes CORS headers:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   ```
2. Check that you're using the correct Vercel URL in `docs/index.html`
3. Make sure there's no trailing slash in the `BACKEND_URL`

### API Returns 500 Error

**Symptom**: Search returns "Internal server error" or "API key not configured"

**Solutions**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify that `XAI_API_KEY` is set correctly
3. If you just added it, redeploy:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
4. Check Vercel function logs:
   - Go to your project dashboard
   - Click on the latest deployment
   - Click "View Function Logs"

### No Results / Empty Response

**Symptom**: Search completes but shows "No results found"

**Solutions**:
1. Check Vercel function logs for errors:
   - Dashboard → Your Project → Deployments → Latest → Logs
2. Try different search criteria
3. Verify your xAI API key is valid at [console.x.ai](https://console.x.ai)
4. Check if you've hit API rate limits

### GitHub Pages Not Updating

**Symptom**: Changes to `index.html` aren't showing on the live site

**Solutions**:
1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check GitHub Actions:
   - Go to repository → Actions tab
   - Verify the "pages build and deployment" workflow completed
3. Wait a few more minutes - deployments can take up to 10 minutes

### Testing Backend Directly

You can test the backend API directly to isolate issues:

**Using curl**:
```bash
curl -X POST https://your-project.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profession": "Chemical Engineer",
    "specialization": "Process Engineering",
    "location": "Germany"
  }'
```

**Using Browser Console**:
```javascript
fetch('https://your-project.vercel.app/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profession: 'Chemical Engineer',
    specialization: 'Process Engineering',
    location: 'Germany'
  })
})
.then(r => r.json())
.then(console.log);
```

Expected response:
```json
{
  "jobs": [...],
  "count": 150
}
```

---

## Local Development

To run the application locally before deploying:

### Option 1: Using the Original Express Server (app.js)

```bash
# Install all dependencies (including express)
npm install express dotenv cors

# Create .env file with your API key
echo "XAI_API_KEY=your_key_here" > .env

# Run the server
node app.js

# Open browser to http://localhost:3000
```

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Run locally (will use your environment variables from Vercel)
vercel dev

# Open browser to http://localhost:3000
```

---

## Updating the Application

### Updating Backend Code

1. Make changes to `api/search.js` or other backend files
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend logic"
   git push origin main
   ```
3. Vercel will automatically deploy the changes
4. Wait 1-2 minutes for deployment
5. Test at your Vercel URL

### Updating Frontend Code

1. Make changes to `docs/index.html`
2. Commit and push to GitHub:
   ```bash
   git add docs/
   git commit -m "Update frontend UI"
   git push origin main
   ```
3. GitHub Pages will automatically rebuild
4. Wait 1-2 minutes for deployment
5. Test at https://ststephen510.github.io

### Updating Environment Variables

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. Update the value of `XAI_API_KEY` or add new variables
4. Go to **Deployments** tab
5. Click **"Redeploy"** on the latest deployment to apply changes

---

## Monitoring and Logs

### Vercel Function Logs

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Click **"Deployments"**
4. Click on the latest deployment
5. Scroll down to **"Function Logs"** or click **"View Function Logs"**

Here you can see:
- Each API request
- Console.log outputs
- Errors and stack traces
- Response times

### GitHub Pages Status

1. Go to your repository on GitHub
2. Click **"Actions"** tab
3. View the "pages build and deployment" workflows
4. Click on individual runs to see logs

---

## Performance Tips

1. **API Response Time**: First request may be slow (cold start). Subsequent requests will be faster.
2. **Caching**: Consider implementing caching for repeated searches (not included in current version).
3. **Rate Limits**: Be aware of xAI API rate limits on your account.
4. **Timeout**: Backend has 60-second timeout for API calls.

---

## Security Best Practices

1. ✅ **Never commit `.env` files** - already in `.gitignore`
2. ✅ **Keep API keys in Vercel environment variables** - never in code
3. ✅ **CORS is properly configured** for GitHub Pages origin
4. ✅ **Input validation** is performed on all user inputs
5. ✅ **XSS protection** via HTML escaping in frontend

---

## Cost Considerations

### Vercel
- **Free Tier**: 100GB bandwidth, 100GB-hours serverless function execution
- **Pricing**: Additional usage is billed per GB
- **Monitoring**: Check usage in Vercel Dashboard → Settings → Usage

### xAI API
- Check current pricing at [console.x.ai](https://console.x.ai)
- Monitor API usage in your xAI dashboard
- Consider implementing request rate limiting for production

### GitHub Pages
- **Free** for public repositories
- Unlimited bandwidth for reasonable use

---

## Need Help?

1. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **GitHub Pages Documentation**: [docs.github.com/pages](https://docs.github.com/pages)
3. **xAI Documentation**: [docs.x.ai](https://docs.x.ai)
4. **Issues**: Check server logs and browser console for error messages

---

**Congratulations!** 🎉 Your application is now deployed with a modern split architecture!
