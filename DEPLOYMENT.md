# Deployment Guide

This guide provides step-by-step instructions to deploy the European Chemical Engineering Jobs application with a split architecture:
- **Frontend**: Hosted on GitHub Pages (static HTML/CSS/JavaScript)
- **Backend**: Hosted on Vercel (serverless API functions)

## Architecture Overview

```
Frontend (GitHub Pages)          Backend (Vercel)
https://ststephen510.github.io   https://your-project.vercel.app
├── public/index.html        →   └── api/search.js
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
2. Navigate to: `public/index.html`
3. Find the line (around line 316):
   ```javascript
   const BACKEND_URL = 'REPLACE_WITH_YOUR_VERCEL_URL';
   ```
4. Replace it with your actual Vercel URL:
   ```javascript
   const BACKEND_URL = 'https://your-project-name.vercel.app';
   ```
   ⚠️ **Important**: Do NOT include a trailing slash

### Step 2: Commit and Push Changes

```bash
git add public/index.html
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
   - **Folder**: `/public`
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

## Troubleshooting

### CORS Errors

**Symptom**: Console shows CORS policy errors, or you get network errors

**Solutions**:
1. Verify that `/api/search.js` includes CORS headers:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   ```
2. Check that you're using the correct Vercel URL in `public/index.html`
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

1. Make changes to `public/index.html`
2. Commit and push to GitHub:
   ```bash
   git add public/
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
