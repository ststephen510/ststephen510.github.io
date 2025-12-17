# European Chemical Engineering Jobs (BETA)

An AI-powered job search platform that helps you discover career opportunities at leading European chemical engineering companies using the xAI Grok API with web search capabilities.

**NEW:** Now with company-selection-driven search! Select 1-3 specific companies to search for targeted job opportunities.

**🌟 LATEST:** xAI Live Search integration! The platform now uses real-time web search to reduce hallucinated URLs and provides source citations for transparency.

## 🏗️ Architecture

This application uses a **split architecture** for optimal deployment:

```
Frontend (GitHub Pages)          Backend (Vercel)
https://ststephen510.github.io   https://your-project.vercel.app
├── docs/index.html          →   └── api/search.js
└── (static HTML/CSS/JS)              (serverless function)
```

- **Frontend**: Static HTML/CSS/JavaScript hosted on GitHub Pages from `/docs` folder
- **Backend**: Serverless API function hosted on Vercel from `/api` folder

### Why This Architecture?

✅ **Separation of Concerns**: Frontend and backend deployed independently  
✅ **Scalability**: Serverless functions scale automatically with demand  
✅ **Cost-Effective**: GitHub Pages is free; Vercel free tier is generous  
✅ **Performance**: Static frontend served from CDN  
✅ **Easy Deployment**: Simple Git push triggers automatic deployments  

## 📋 Deployment Instructions

**👉 See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step deployment instructions.**

Quick summary:
1. Deploy backend to Vercel
2. Update frontend with Vercel URL
3. Enable GitHub Pages from `/docs` folder
4. Test the application

## Features

- 🔬 **180 European Companies**: Interactive list of major chemical engineering companies, research institutes, and industry leaders
- 🎯 **Company Selection**: Select 1-3 specific companies for targeted job search
- 🤖 **AI-Powered Search**: Uses xAI's Grok API with web search to find real, current job openings at your selected companies
- 🌐 **Live Search Integration**: xAI Live Search provides real-time web results and reduces hallucinated URLs
- 📚 **Source Citations**: View the actual sources used by the AI, displayed as clickable links for verification
- 🏢 **Official Career Sites**: API returns verified career site information for each selected company (URLs and domains)
- 🔍 **Smart Filtering**: Filter company list with real-time search
- ⚡ **Focused Results**: Search only the official career pages of your selected companies
- 🎨 **Clean Interface**: Simple, professional design with responsive layout
- ✅ **Strict Validation**: Only verified, current job postings with valid URLs

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript (static, hosted on GitHub Pages)
- **Backend**: Node.js serverless functions (hosted on Vercel)
- **AI**: xAI Grok API with Live Search (grok-4-1-fast-reasoning model, configurable via XAI_MODEL)
- **Dependencies**: axios (backend only)

## Project Structure

```
/
├── api/
│   └── search.js              # Vercel serverless function (backend)
├── docs/
│   ├── index.html             # Frontend for GitHub Pages
│   └── public/
│       └── companies.txt      # List of 180 European companies (client-side)
├── companies.txt              # List of 180 European companies (backend)
├── app.js                     # FOR LOCAL DEVELOPMENT ONLY
├── package.json               # Backend dependencies (serverless)
├── vercel.json                # Vercel configuration
├── .vercelignore              # Exclude frontend from Vercel
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore file
├── DEPLOYMENT.md              # Deployment instructions
└── README.md                  # This file
```

## Prerequisites

- **For Deployment**:
  - GitHub account
  - Vercel account ([sign up at vercel.com](https://vercel.com))
  - xAI API key ([get one at console.x.ai](https://console.x.ai))

- **For Local Development** (optional):
  - Node.js (v14 or higher)
  - npm or yarn

## Quick Start - Local Development

If you want to test the application locally before deploying:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install express dotenv cors axios
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add:
   # XAI_API_KEY=your_actual_api_key_here
   # XAI_MODEL=grok-4-1-fast-reasoning (optional, defaults to grok-4-1-fast-reasoning)
   
   # Optional Live Search configuration:
   # XAI_SEARCH_MODE=on (on|auto|off, defaults to 'on' to force Live Search)
   # XAI_MAX_SEARCH_RESULTS=10 (defaults to 10)
   # XAI_RETURN_CITATIONS=true (defaults to true)
   # XAI_DEBUG_RESPONSE=false (set to 'true' to enable diagnostic logging)
   ```

4. **Run the local development server**:
   ```bash
   node app.js
   ```

5. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - Test the job search functionality

**Note**: For production deployment, use the split architecture as described in [DEPLOYMENT.md](DEPLOYMENT.md).

## How It Works

### Backend (api/search.js) - Vercel Serverless Function

1. **Receives Request**: POST request with profession, specialization, location
2. **CORS Handling**: Sets headers to allow requests from GitHub Pages
3. **Load Companies**: Reads up to 1000 company names from `companies.txt`
4. **Construct Prompt**: Creates an intelligent prompt for the Grok API including:
   - User's profession, specialization, and location
   - List of companies to search
   - Instructions for web search and ranking
5. **Call Grok API**: Sends request to `https://api.x.ai/v1/chat/completions`
6. **Parse Results**: Extracts job listings from API response
7. **Return Data**: Sends JSON response with up to 300 ranked jobs

### Frontend (docs/index.html) - GitHub Pages

1. **Load Companies**: Fetches the list of ~180 companies from `public/companies.txt`
2. **User Input**: Collects profession, specialization, and location
3. **Company Selection**: Interactive list allowing users to select 1-3 companies
4. **Validation**: Ensures 1-3 companies are selected before submission
5. **Submit Request**: Sends POST request to Vercel backend at `/api/search` with selected companies
6. **Display Loading**: Shows loading spinner during API call
7. **Render Results**: Dynamically creates job cards with:
   - Job title
   - Company name
   - Direct link to job posting
   - Citations (if Live Search returned sources)
8. **Error Handling**: Displays user-friendly error messages

## API Endpoints

### POST `/api/search`

Search for jobs matching criteria at selected companies (Vercel serverless function).

**Request Body**:
```json
{
  "profession": "Chemical Engineer",
  "specialization": "Process Engineering",
  "location": "Germany",
  "companies": ["BASF SE", "Covestro AG", "Evonik Industries"]
}
```

**Response**:
```json
{
  "jobs": [
    {
      "title": "Process Engineer",
      "company": "BASF SE",
      "location": "Ludwigshafen",
      "link": "https://basf.com/careers/job/12345"
    }
  ],
  "citations": [
    {
      "url": "https://basf.com/careers",
      "title": "BASF Careers"
    },
    {
      "url": "https://covestro.com/jobs",
      "title": "Covestro Jobs"
    }
  ],
  "career_sites": [
    {
      "company": "BASF SE",
      "urls": ["https://basf.jobs/", "https://www.basf.com/global/en/careers"],
      "domains": ["basf.com", "jobs.basf.com", "career.basf.com", "careers.basf.com"]
    },
    {
      "company": "Covestro AG",
      "urls": ["https://www.covestro.com/en/career"],
      "domains": ["covestro.com", "career.covestro.com", "careers.covestro.com"]
    }
  ],
  "count": 10,
  "query": {
    "profession": "Chemical Engineer",
    "specialization": "Process Engineering",
    "location": "Germany"
  },
  "requestId": "abc123xyz456"
}
```

**Error Response**:
```json
{
  "error": "Missing companies selection",
  "hint": "Please select 1-3 companies to search"
}
```

**Response Fields**:

- `jobs`: Array of job objects with title, company, location, and link
- `citations`: Array of source URLs that the AI consulted (from Live Search)
- `career_sites`: Array of official career site information for each selected company:
  - `company`: Company name
  - `urls`: Official career site URLs from `companies.txt`
  - `domains`: Approved domains from `companies.json` (used for URL validation)
- `count`: Number of jobs returned
- `query`: Echo of the search criteria
- `requestId`: Unique request identifier for debugging
- `warning` (optional): Warning message if results were filtered or unavailable

## Company Database

The application provides an interactive list of ~180 European companies including:

- **Chemical Manufacturers**: BASF, Covestro, Evonik, Solvay, etc.
- **Specialty Chemicals**: Clariant, Arkema, Wacker Chemie, etc.
- **Industrial Gases**: Air Liquide, Linde, etc.
- **Research Institutes**: Fraunhofer Society, Max Planck Institutes, Helmholtz Centers
- **Aerospace & Defense**: Airbus, MTU Aero Engines, Safran, etc.
- **Automotive Suppliers**: Continental, Bosch, ZF Friedrichshafen, etc.

See `companies.txt` for the complete list. Users select 1-3 companies from this list to focus their search.

## Search Behavior

The application searches **only** the selected companies with **strict domain filtering**:

1. **Company Selection**: Users must select 1-3 companies from the interactive list
2. **Focused Search**: The AI searches only the official career pages of the selected companies
3. **Domain Filtering**: All job links and citations are filtered to allow **ONLY** official company career site URLs
4. **Strict Validation**: Only real, current, verifiable job postings from company domains are returned
5. **Smart Ranking**: Jobs ranked by relevance to the search criteria (up to 10 jobs maximum)

### Company Domain Allowlist

The application uses a strict allowlist (`companies.json`) to ensure only official company career sites are returned:

**Allowed Sources:**
- ✅ Official company domains (e.g., `basf.com`, `careers.basf.com`, `covestro.com`)
- ✅ Company career subdomains (e.g., `jobs.bosch.com`, `career.siemens-energy.com`)

**Blocked Sources:**
- ❌ Job aggregators (Indeed, Glassdoor, LinkedIn, Monster, StepStone, etc.)
- ❌ Social media (Reddit, X/Twitter, Facebook, etc.)
- ❌ ATS vendor domains (myworkdayjobs.com, greenhouse.io, lever.co - unless on company subdomain)
- ❌ Blogs, forums, unofficial sites (selectyouruniversity.com, etc.)

**Adding New Companies to the Allowlist:**

To add domain mappings for a new company, edit `companies.json`:

```json
{
  "name": "Company Name",
  "domains": ["company.com", "careers.company.com", "jobs.company.com"],
  "careerPaths": ["/careers", "/jobs"]
}
```

Then deploy the updated file to Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

**Behavior When Company Not in Allowlist:**
- If selected companies have no domain allowlist entries, a warning message is returned
- Jobs and citations are filtered to empty arrays
- User is informed to contact support to add the company

This defense-in-depth approach combines:
1. **Prompt engineering** - Explicit instructions to xAI to use only official sites
2. **Server-side filtering** - Backend validates all URLs against allowlist
3. **Blocked domain list** - Known bad actors are explicitly rejected

## Live Search Configuration

The platform integrates xAI's Live Search feature to provide real-time web results and reduce hallucinated job URLs. Live Search can be configured using environment variables:

### Environment Variables

**XAI_SEARCH_MODE** (default: `on`)
- `on`: Always use Live Search for every request (default, recommended)
- `auto`: Automatically decides when to use Live Search based on query
- `off`: Disable Live Search (not recommended for production)

**XAI_MAX_SEARCH_RESULTS** (default: `10`)
- Number of web search results to use when Live Search is active
- Range: 1-100 (recommended: 10-20 for balance of quality and speed)

**XAI_RETURN_CITATIONS** (default: `true`)
- When `true`, the API returns source URLs that were used
- Citations are displayed in the frontend as clickable links
- Set to `false` to hide citations (not recommended)

**XAI_DEBUG_RESPONSE** (default: `false`)
- When `true`, enables verbose diagnostic logging of xAI API responses
- Logs top-level response structure, choice keys, message keys, and potential citation locations
- Useful for debugging when citations or search results are not appearing as expected
- Set to `false` in production to reduce log volume

### Example Configuration

```bash
# .env file
XAI_API_KEY=your_api_key_here
XAI_MODEL=grok-4-1-fast-reasoning

# Live Search - recommended production settings
XAI_SEARCH_MODE=on
XAI_MAX_SEARCH_RESULTS=10
XAI_RETURN_CITATIONS=true
XAI_DEBUG_RESPONSE=false
```

### How It Works

1. **Request**: Backend includes `search_parameters` in xAI API call
2. **Live Search**: xAI searches the web in real-time for current job postings
3. **Citations**: API returns URLs of sources that were actually consulted
4. **Display**: Frontend shows citations below job results for transparency
5. **Verification**: Users can click citations to verify the AI's sources

### Benefits

- ✅ **Reduced Hallucinations**: Real web results instead of invented URLs
- ✅ **Current Information**: Up-to-date job postings from company websites
- ✅ **Transparency**: Citations show exactly what sources were used
- ✅ **Trust**: Users can verify results by clicking source links

## Customization

### Adding More Companies

Edit `companies.txt` and add company names, separated by commas:
```
Company Name 1, Company Name 2, Company Name 3
```

### Changing the Port

Set the `PORT` environment variable in your `.env` file:
```
XAI_API_KEY=your_key_here
XAI_MODEL=grok-3
PORT=8080
```

### Using a Different xAI Model

Set the `XAI_MODEL` environment variable in your `.env` file:
```
XAI_MODEL=grok-4-1-fast-reasoning
```

If not set, the application defaults to `grok-4-1-fast-reasoning`. Check the [xAI documentation](https://docs.x.ai) for available models.

### Modifying the Search Limit

Edit `app.js` and change the limit in the prompt or in the results processing:
```javascript
.slice(0, 300);  // Change 300 to your desired limit
```

## Troubleshooting

### "API key not configured" error on Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Ensure `XAI_API_KEY` is set correctly (and optionally `XAI_MODEL` if you want to use a different model)
- Redeploy the project after adding the environment variable

### CORS errors when accessing from GitHub Pages
- Verify that `/api/search.js` includes CORS headers
- Check that `BACKEND_URL` in `docs/index.html` is set to your Vercel URL
- Ensure there's no trailing slash in the URL

### Frontend doesn't connect to backend
- Check that you've updated `BACKEND_URL` in `docs/index.html` with your actual Vercel URL
- Verify the backend is deployed and accessible
- Test backend directly: `curl -X POST https://your-vercel-url.vercel.app/api/search -H "Content-Type: application/json" -d '{"profession":"test","specialization":"test","location":"test"}'`

### "companies.txt file not found" on Vercel
- Ensure `companies.txt` is in the root directory of your repository
- Check that it's not listed in `.vercelignore`
- Redeploy the Vercel project

### No jobs found
- Try broader search criteria
- Check different locations or specializations
- Some companies may not have current openings
- Verify xAI API key is valid and has available credits

### Local development issues
- For local development, use `app.js` (not the Vercel function)
- Install all dependencies: `npm install express dotenv cors axios`
- Create `.env` file with your API key
- Run with: `node app.js`

## Development

### Working on the Backend

1. Make changes to `api/search.js`
2. Test locally with Vercel CLI:
   ```bash
   npm install -g vercel
   vercel dev
   ```
3. Or use the local Express server:
   ```bash
   node app.js
   ```

### Working on the Frontend

1. Make changes to `docs/index.html`
2. Test by opening the file in a browser, or
3. Use the local Express server which serves static files from `/docs`

### Before Deploying

1. Test thoroughly locally
2. Verify all environment variables are set in Vercel
3. Ensure `.vercelignore` excludes unnecessary files
4. Check that `companies.txt` is accessible

## Security Notes

- **Never commit `.env`** to version control (already in `.gitignore`)
- Keep your xAI API key private and secure
- Store API keys in Vercel environment variables for production
- Validate and sanitize all user inputs (implemented)
- The frontend includes XSS protection via HTML escaping
- CORS headers properly configured for GitHub Pages origin
- Consider implementing rate limiting for production use (not included)

## Performance Considerations

- **Cold Starts**: First Vercel function invocation may take longer (3-5 seconds)
- **API Response Time**: Grok API calls may take 10-60 seconds depending on search complexity
- **Rate Limits**: xAI API has rate limits - check your plan at console.x.ai
- **Result Limits**: Large result sets are automatically limited to 300 jobs
- **Caching**: Consider implementing caching for repeated searches (not implemented)
- **CDN**: Frontend served from GitHub Pages CDN for fast global access

## Future Enhancements

- [ ] User authentication and saved searches
- [ ] Email alerts for new matching jobs
- [ ] More detailed job information (salary, requirements)
- [ ] Filter and sort options
- [ ] Save favorite jobs
- [ ] Application tracking
- [ ] Multi-language support
- [ ] Mobile app version

## License

MIT License - feel free to use and modify for your projects.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review xAI API documentation at [docs.x.ai](https://docs.x.ai)
- Ensure all dependencies are properly installed
- Check the server console for detailed error messages

## Architecture Overview

### Request Flow

1. User submits search form → Frontend JavaScript
2. Frontend sends POST to `/search` → Express backend
3. Backend reads companies.txt → Constructs prompt
4. Backend calls Grok API → Receives response
5. Backend parses and validates jobs → Returns JSON
6. Frontend displays results → User sees job cards

### Error Handling

- **Input Validation**: Missing fields return 400 Bad Request
- **File Errors**: Missing companies.txt returns 500 Internal Server Error
- **API Errors**: Network issues return 503 Service Unavailable
- **Parse Errors**: Invalid API response returns 500 with details
- **Frontend Errors**: User-friendly messages displayed in UI

### Data Flow

```
User Input (Form)
    ↓
Frontend Validation
    ↓
POST /search (JSON)
    ↓
Backend Validation
    ↓
Read companies.txt
    ↓
Construct Grok Prompt
    ↓
Call xAI API
    ↓
Parse JSON Response
    ↓
Validate & Limit Jobs
    ↓
Return JSON to Frontend
    ↓
Display Job Cards
```

---

**Built with ❤️ using xAI Grok API**

*Helping chemical engineers find their next opportunity in Europe*
