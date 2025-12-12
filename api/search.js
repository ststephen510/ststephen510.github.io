// Vercel Serverless Function for Job Search
// This function handles POST requests to search for jobs using xAI Grok API

const fs = require('fs');
const path = require('path');

// Generate a random request ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Check if a URL is a deep link to a specific job posting
function isDeepLink(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check for job ID patterns in query parameters
    // Note: 'id' parameter is generic but placed after specific patterns to reduce false positives
    const jobIdPatterns = [
      /[?&](jobid|gh_jid|id|job_id|position_id|vacancy_id|req_id|requisition_id)=/i,
      /[?&]p=/i, // common short parameter for position
    ];
    
    for (const pattern of jobIdPatterns) {
      if (pattern.test(search)) return true;
    }
    
    // Check for known job platforms (these are always deep links)
    // Use endsWith to prevent subdomain spoofing (e.g., evil.com?redirect=greenhouse.io)
    if ((hostname === 'lever.co' || hostname.endsWith('.lever.co')) && pathname.length > 1) return true;
    if ((hostname === 'greenhouse.io' || hostname.endsWith('.greenhouse.io')) && pathname.includes('/jobs/')) return true;
    if ((hostname === 'workdayjobs.com' || hostname.endsWith('.workdayjobs.com')) && pathname.includes('/job/')) return true;
    if ((hostname === 'myworkdayjobs.com' || hostname.endsWith('.myworkdayjobs.com')) && pathname.includes('/job/')) return true;
    if ((hostname === 'smartrecruiters.com' || hostname.endsWith('.smartrecruiters.com')) && /\/\d+/.test(pathname)) return true;
    if ((hostname.endsWith('.personio.de') || hostname.endsWith('.personio.com')) && /\/job\/\d+/.test(pathname)) return true;
    
    // Check for deep link path patterns
    const deepLinkPatterns = [
      /\/jobs?\/[^/]+\/[^/]+/, // /jobs/company/id or /job/location/id (3+ segments)
      /\/careers?\/[^/]+\/[^/]+/, // /careers/positions/id (3+ segments)
      /\/apply\/[^/]+/, // /apply/123456
      /\/position[s]?\/[^/]+/, // /positions/123456
      /\/vacancy\/[^/]+/, // /vacancy/123456
      /\/opening[s]?\/[^/]+/, // /openings/123456
      /\/jobs?\/[a-zA-Z0-9-_]{5,}/, // /jobs/long-job-id (min 5 chars helps filter out listing pages like /jobs/1)
      /\/careers?\/[a-zA-Z0-9-_]{5,}/, // /careers/long-job-id (min 5 chars)
    ];
    
    for (const pattern of deepLinkPatterns) {
      if (pattern.test(pathname)) return true;
    }
    
    // Reject generic career/jobs pages (ending with just /careers, /jobs, etc.)
    const genericPatterns = [
      /^\/(careers?\/?|jobs?\/?|opportunities\/?|vacancies\/?|openings?\/?)$/i,
      /^\/(en|de|fr|es|it|nl)?\/?careers?\/?$/i,
      /^\/(en|de|fr|es|it|nl)?\/?jobs?\/?$/i,
    ];
    
    for (const pattern of genericPatterns) {
      if (pattern.test(pathname)) return false;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Deduplicate jobs by title, company, and link
function deduplicateJobs(jobs) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const job of jobs) {
    // Create a normalized key for deduplication
    const key = `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}|${(job.link || '').toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(job);
    }
  }
  
  return deduplicated;
}

module.exports = async (req, res) => {
  // Request-scoped logging: read or generate requestId
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const startTime = Date.now();
  
  // Log request start
  console.log(`[${requestId}] START ${req.method} ${req.url} - Origin: ${req.headers.origin || 'unknown'}`);

  // Set CORS headers - allow GitHub Pages and localhost for development
  const allowedOrigins = [
    'https://ststephen510.github.io',
    'https://ststephen510-github-io.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] OPTIONS request - CORS preflight`);
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`[${requestId}] ERROR: Method not allowed - ${req.method}`);
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      hint: 'This endpoint only accepts POST requests.',
      requestId
    });
  }

  try {
    // Validate API key
    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      console.error(`[${requestId}] ERROR: XAI_API_KEY not found in environment variables`);
      return res.status(500).json({ 
        error: 'API key not configured',
        hint: 'Add XAI_API_KEY in Vercel Dashboard → Settings → Environment Variables',
        requestId
      });
    }

    // Get model from environment or use default
    const model = process.env.XAI_MODEL || 'grok-3';

    // Validate request body
    const { profession, specialization, location } = req.body;
    if (!profession || !specialization || !location) {
      console.log(`[${requestId}] ERROR: Missing required fields`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['profession', 'specialization', 'location'],
        received: { profession, specialization, location },
        requestId
      });
    }

    console.log(`[${requestId}] Searching for: ${profession} - ${specialization} - ${location}`);

    // Read companies from file with improved path resolution
    let companies = [];
    try {
      // Try __dirname-based path first (more reliable in Vercel), fallback to process.cwd()
      let companiesPath = path.join(__dirname, '..', 'companies.txt');
      let pathUsed = '__dirname-based';
      
      if (!fs.existsSync(companiesPath)) {
        companiesPath = path.join(process.cwd(), 'companies.txt');
        pathUsed = 'process.cwd()-based';
      }
      
      console.log(`[${requestId}] Reading companies from: ${companiesPath} (${pathUsed})`);
      const companiesText = fs.readFileSync(companiesPath, 'utf-8');
      companies = companiesText.split(',').map(c => c.trim()).filter(c => c.length > 0).slice(0, 1000);
      console.log(`[${requestId}] Loaded ${companies.length} companies`);
    } catch (fileError) {
      console.error(`[${requestId}] ERROR reading companies.txt:`, fileError.message);
      return res.status(500).json({ 
        error: 'Failed to load companies database',
        details: fileError.message,
        requestId
      });
    }

    // Construct prompt for xAI Grok API
    const prompt = `You are a job search assistant. Search the web for current job openings that match these criteria:

Profession: ${profession}
Specialization: ${specialization}
Location: ${location}

Companies to prioritize (search these first): ${companies.join(', ')}

Instructions:
1. Find exactly up to 50 real, current job postings
2. Include jobs from the listed companies AND other relevant employers
3. Rank results by relevance (EXACT matches first, then strong matches, then possible matches)
4. For each job, you MUST provide:
   - Job title (required)
   - Company name (required)
   - Location (city/country, required)
   - Direct job posting URL with deep link (required)
   - Brief description 1-2 sentences (required)
   - Date posted if available (optional)

CRITICAL URL REQUIREMENTS - Each job link MUST be a deep link to the specific job posting:
- FORBIDDEN: Company home pages (e.g., https://company.com, https://company.com/)
- FORBIDDEN: Generic careers landing pages (e.g., https://company.com/careers, https://company.com/jobs, https://company.com/careers/, https://company.com/jobs/)
- FORBIDDEN: Search results pages without unique job identifiers
- REQUIRED: URLs must contain a recognizable job ID pattern or path segment such as:
  * /jobs/123456 or /job/123456
  * /careers/positions/123456
  * ?jobId=123456 or ?gh_jid=123456 or ?id=123456
  * lever.co/company/job-title-id
  * greenhouse.io/company/jobs/123456
  * workdayjobs.com/company/job/location/job-title/JR123456
  * myworkdayjobs.com/company/job/
  * smartrecruiters.com/Company/123456
  * personio.de/job/123456
  * any URL with /apply/, /position/, /vacancy/, /opening/ followed by an identifier
- If you cannot find a deep link to a specific job posting, you MUST OMIT that job entirely
- Only include jobs where you have found an actual, specific job posting URL

Return results as a JSON array in this EXACT format:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "link": "https://example.com/jobs/12345",
      "description": "Brief description",
      "datePosted": "2024-01-15" (optional, omit if not available)
    }
  ]
}`;

    console.log(`[${requestId}] Calling xAI Grok API with model: ${model}`);

    // Set up timeout using AbortController (Node 18+)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout (Vercel has 60s limit)

    // Call xAI Grok API using native fetch (available in Node.js 18+)
    let response;
    try {
      response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful job search assistant that finds real job postings and returns structured JSON data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        console.error(`[${requestId}] ERROR: xAI request timed out`);
        return res.status(504).json({
          error: 'Request timed out',
          details: 'The xAI API did not respond within 55 seconds',
          hint: 'Try again or simplify your search criteria',
          requestId
        });
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const errorSnippet = errorText.substring(0, 500);
      console.error(`[${requestId}] xAI API error: ${response.status}`, errorSnippet);
      
      // Provide actionable hints based on status code
      let hint = 'Check xAI API status and your request';
      if (response.status === 401) {
        hint = 'Invalid API key. Verify XAI_API_KEY in Vercel environment variables';
      } else if (response.status === 403) {
        hint = `Access forbidden. Check if your API key has access to the ${model} model`;
      } else if (response.status === 404) {
        hint = 'Model not found or deprecated. Try setting XAI_MODEL=grok-3 in Vercel environment variables';
      } else if (response.status === 429) {
        hint = 'Rate limit exceeded. Wait a moment and try again, or upgrade your xAI plan';
      } else if (response.status >= 500) {
        hint = 'xAI service error. Try again in a few moments';
      }
      
      return res.status(response.status).json({ 
        error: 'xAI API request failed',
        status: response.status,
        details: errorSnippet,
        hint,
        requestId
      });
    }

    const apiData = await response.json();
    const grokResponse = apiData.choices?.[0]?.message?.content;

    if (!grokResponse) {
      console.error(`[${requestId}] No response from xAI API`);
      return res.status(500).json({ 
        error: 'No response from AI',
        details: 'The AI did not return any content',
        requestId
      });
    }

    console.log(`[${requestId}] Received response from xAI, parsing...`);

    // Parse JSON from response
    let jobs = [];
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = grokResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      jobs = parsed.jobs || [];
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse JSON:`, parseError.message);
      console.log(`[${requestId}] Raw response:`, grokResponse.substring(0, 500));
      // Return empty array instead of failing
      jobs = [];
    }

    console.log(`[${requestId}] Parsed ${jobs.length} jobs from API response`);

    // Filter out jobs with non-deep links
    const jobsBeforeFilter = jobs.length;
    jobs = jobs.filter(job => {
      if (!job.link) {
        console.log(`[${requestId}] Rejecting job without link: ${job.title}`);
        return false;
      }
      
      const isDeep = isDeepLink(job.link);
      if (!isDeep) {
        console.log(`[${requestId}] Rejecting non-deep link for ${job.title} at ${job.company}: ${job.link}`);
      }
      return isDeep;
    });
    console.log(`[${requestId}] After deep link filter: ${jobs.length} jobs (removed ${jobsBeforeFilter - jobs.length})`);

    // Deduplicate jobs
    const jobsBeforeDedup = jobs.length;
    jobs = deduplicateJobs(jobs);
    console.log(`[${requestId}] After deduplication: ${jobs.length} jobs (removed ${jobsBeforeDedup - jobs.length} duplicates)`);

    // Limit to 50 jobs
    jobs = jobs.slice(0, 50);
    console.log(`[${requestId}] After limiting to 50: ${jobs.length} jobs`);

    // Add warning if fewer than 10 deep-link jobs
    let warning = null;
    if (jobs.length < 10) {
      warning = `Only ${jobs.length} jobs with valid deep links were found. This may be due to: ` +
                `(1) Limited job availability for the specified criteria, ` +
                `(2) AI model was unable to find specific job posting URLs, ` +
                `(3) Many results were filtered out as generic career pages. ` +
                `Try broadening your search criteria or searching different locations/specializations.`;
      console.log(`[${requestId}] WARNING: ${warning}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] END - Returning ${jobs.length} jobs - Duration: ${duration}ms`);

    const response = { 
      jobs,
      count: jobs.length,
      query: { profession, specialization, location },
      requestId
    };
    
    if (warning) {
      response.warning = warning;
    }

    return res.status(200).json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ERROR - Unexpected error after ${duration}ms:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      requestId
    });
  }
};
