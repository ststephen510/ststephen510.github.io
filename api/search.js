// Vercel Serverless Function for Job Search
// This function handles POST requests to search for jobs using xAI Grok API

const fs = require('fs');
const path = require('path');

// Generate a random request ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
    const model = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning';

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
      companies = companiesText.split(',').map(c => c.trim()).filter(c => c.length > 0).slice(0, 5);
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
const prompt = `You are a precise job search assistant. Your ONLY goal is to find and verify REAL, LIVE job postings from the specified companies. You MUST use your web search and reasoning abilities to access and validate current data. DO NOT fabricate, invent, or guess any information—especially URLs. If you cannot verify a job posting as active and accessible right now, exclude it entirely.

Criteria:
- Profession: ${profession}
- Specialization: ${specialization}
- Location: ${location}
- Companies (search ONLY their official career pages): ${companies.join(', ')}

Step-by-Step Process (show this in your reasoning before JSON):
1. Translate criteria to German and English.
2. For EACH company: Search for their official careers page (e.g., "CompanyName careers site").
3. On that page, search for jobs matching 70-80% of criteria (use exact phrases in both languages).
4. For each potential match: Verify the URL loads a live posting (describe your verification briefly, e.g., "Accessed via search; page title matches job").
5. Confirm: Job is open, from the company, in/near location, and URL is HTTPS, ends in /job/ or similar, hosted on company's domain.
6. Rank by relevance (70-80% match highest).

Output ONLY valid, verified jobs. If none found, return empty jobs array.

Final Output (JSON only, no explanations):
{
  "jobs": [
    {
      "title": "Exact Job Title (original language: German or English)",
      "company": "Exact Company Name",
      "link": "Full, verified HTTPS URL to live posting",
      "location": "Exact location from posting"
    }
  ],
  "reasoning_summary": "Brief 1-sentence summary of verifications (e.g., 'Verified 3 jobs from 2 companies via official sites')"
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
              content: 'You are a factual, verification-focused assistant. Never invent data. Base responses only on verifiable real-world information. Output strictly valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 3000
          top_p: 0.9,         // Optional: Add for nucleus sampling; keeps diversity low while allowing some flexibility
  fre     quency_penalty: 0.5  // Optional: Add to penalize repetitions (e.g., duplicate fake links)
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

    // Limit to 10 jobs
    jobs = jobs.slice(0, 10);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] END - Returning ${jobs.length} jobs - Duration: ${duration}ms`);

    return res.status(200).json({ 
      jobs,
      count: jobs.length,
      query: { profession, specialization, location },
      requestId
    });

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
