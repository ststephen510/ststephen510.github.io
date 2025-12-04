# 🚀 Deploy Your Backend in 3 Easy Steps

## Step 1: Login to Vercel

1. Visit: **https://vercel.com/device**
2. Enter code: **CPLX-QXQH**
3. Authorize the CLI

## Step 2: Deploy the Backend

After logging in, run:
```bash
cd /workspaces/ststephen510.github.io
vercel
```

Answer the prompts:
- **Set up and deploy?** → Y
- **Which scope?** → Choose your account
- **Link to existing project?** → N
- **What's your project's name?** → arcticulab-backend (or press Enter)
- **In which directory is your code?** → ./ (press Enter)
- **Override settings?** → N

## Step 3: Add Your API Key

After deployment, add your xAI API key:

```bash
vercel env add XAI_API_KEY production
```

When prompted, paste your API key: `xai-KaljjHZvtKSG1UoCWlZkyyJp55jFVPk27KZfnH7NTcct73CAWEn98ODw4v8pPB6kIwa1xKLY1iR4OONP`

Then redeploy:
```bash
vercel --prod
```

## Step 4: Update Your Frontend

After deployment, Vercel will give you a URL like:
```
https://arcticulab-backend.vercel.app
```

Update `app-backend.js` line 3:
```javascript
const API_URL = 'https://YOUR-ACTUAL-URL.vercel.app/api';
```

Then push to GitHub:
```bash
git add app-backend.js
git commit -m "Update backend URL"
git push origin main
```

## ✅ Done!

Your site at https://ststephen510.github.io will now use your Vercel backend!

---

## Alternative: Import from GitHub (Easier!)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `ststephen510.github.io` repository
4. Add environment variable:
   - Name: `XAI_API_KEY`
   - Value: `xai-KaljjHZvtKSG1UoCWlZkyyJp55jFVPk27KZfnH7NTcct73CAWEn98ODw4v8pPB6kIwa1xKLY1iR4OONP`
5. Click "Deploy"
6. Copy the URL and update `app-backend.js`

That's it! 🎉
