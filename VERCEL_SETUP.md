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

**Issue: "API key not configured"**
- Make sure you added `XAI_API_KEY` in Vercel dashboard
- Redeploy after adding environment variables

**Issue: CORS errors**
- The API has CORS enabled for all origins (`*`)
- Should work from any domain

**Issue: "Module not found"**
- Make sure `package-backend.json` is deployed
- Rename it to `package.json` in the api folder if needed

---

## Success!
Once deployed, your site at `https://ststephen510.github.io` will call the Vercel backend, which securely handles the xAI API calls.

Your API will be at: `https://YOUR-PROJECT.vercel.app/api/search-jobs`
