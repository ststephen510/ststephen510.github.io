# Deploying arcticulab.io to GitHub Pages

## Important Note

GitHub Pages only hosts static websites (HTML, CSS, JavaScript). The backend server (server.js) cannot run on GitHub Pages. You have two options:

## Option 1: Static Version (GitHub Pages Compatible)

Use the client-side only version that calls xAI API directly from the browser.

**Files needed on GitHub Pages:**
- index.html
- styles.css
- app-static.js (renamed from app.js)

**Steps:**

1. Create a repository named `ststephen510.github.io` on GitHub

2. Add these files to your repository:
   ```bash
   # Copy these files to your repo:
   - index.html (modify to use app-static.js)
   - styles.css
   - app-static.js (created for you)
   ```

3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. Your site will be live at: `https://ststephen510.github.io`

**Limitation:** The xAI API key will be exposed in the browser. Only use this for testing!

## Option 2: Full Version (Recommended)

Deploy the backend to a hosting service and keep frontend on GitHub Pages.

**Backend Hosting Options:**
- Vercel (easiest)
- Heroku
- Railway
- Render
- AWS/Azure/GCP

**Steps:**

1. **Deploy backend to Vercel:**
   - Create account at vercel.com
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel` in your project folder
   - Add XAI_API_KEY environment variable in Vercel dashboard
   - Get your backend URL (e.g., https://arcticulab.vercel.app)

2. **Update frontend for GitHub Pages:**
   - Modify app.js to use your Vercel backend URL
   - Push frontend files to ststephen510.github.io

3. **Site will be split:**
   - Frontend: https://ststephen510.github.io
   - Backend: https://your-app.vercel.app

## Quick GitHub Pages Setup

1. Go to https://github.com/new
2. Create repository named: `ststephen510.github.io`
3. Clone it locally
4. Copy index.html, styles.css, and app-static.js (or modified app.js)
5. Commit and push
6. Visit https://ststephen510.github.io

## Need Help?

Choose Option 2 for production use to keep your API key secure!
