// Vercel Serverless Function for Job Search
// This function handles POST requests to search for jobs using xAI Grok API

const fs = require('fs');
const path = require('path');

// Generate a random request ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Load company allowlist from companies.json
let companiesAllowlist = null;
function loadCompaniesAllowlist() {
  if (companiesAllowlist) {
    return companiesAllowlist;
  }
  
  try {
    const companiesJsonPath = path.join(process.cwd(), 'companies.json');
    const companiesData = fs.readFileSync(companiesJsonPath, 'utf8');
    companiesAllowlist = JSON.parse(companiesData);
    return companiesAllowlist;
  } catch (error) {
    console.error('Failed to load companies.json:', error.message);
    return [];
  }
}

// Load and parse companies.txt to extract career URLs
let companiesTxtData = null;
function loadCompaniesTxt() {
  if (companiesTxtData) {
    return companiesTxtData;
  }
  
  try {
    const companiesTxtPath = path.join(process.cwd(), 'companies.txt');
    const txtContent = fs.readFileSync(companiesTxtPath, 'utf8');
    
    // Parse companies.txt - format: "Company Name — URL1 | URL2 | URL3"
    // Note: Uses em dash (—) character as separator
    const companyMap = new Map();
    const lines = txtContent.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Match em dash (—) or regular dash (-) for flexibility
      const match = line.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (match) {
        const companyName = match[1].trim();
        const urlsPart = match[2].trim();
        const urls = urlsPart.split('|').map(url => url.trim()).filter(url => url);
        // Store with normalized lowercase key for case-insensitive lookup
        companyMap.set(companyName.toLowerCase(), urls);
      }
    });
    
    companiesTxtData = companyMap;
    return companiesTxtData;
  } catch (error) {
    console.error('Failed to load companies.txt:', error.message);
    return new Map();
  }
}

// Blocked domains - social media, job boards, and aggregators
const BLOCKED_DOMAINS = [
  'reddit.com',
  'x.com',
  'twitter.com',
  'facebook.com',
  'linkedin.com',
  'instagram.com',
  'selectyouruniversity.com',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'stepstone.de',
  'jobware.de',
  'kimeta.de',
  'stellenanzeigen.de',
  'jobs.ch',
  'jobscout24.ch',
  'xing.com',
  'kununu.com',
  'jobbörse.de',
  'arbeitsagentur.de',
  'jobsinnetwork.com',
  'careerjet.com',
  'jobrapido.com',
  'jooble.org',
  'adzuna.com',
  'neuvoo.com',
  'talent.com',
  'careers24.com',
  'jobvite.com',
  // ATS vendor domains (unless on company's own domain)
  'myworkdayjobs.com',
  'greenhouse.io',
  'lever.co',
  'smartrecruiters.com',
  'breezy.hr',
  'recruitee.com',
  'workable.com',
  'applytojob.com',
  'icims.com',
  'ultipro.com',
  'successfactors.com',
  'taleo.net',
  'taleoportal.com'
];

// Extract hostname from URL, handling various edge cases
function extractHostname(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    // Add protocol if missing
    let urlToParse = url;
    if (!/^https?:\/\//i.test(url)) {
      urlToParse = 'https://' + url;
    }
    
    const urlObj = new URL(urlToParse);
    return urlObj.hostname.toLowerCase();
  } catch (error) {
    // Invalid URL
    return null;
  }
}

// Check if hostname matches allowed domain (supports subdomains)
function isHostnameAllowed(hostname, allowedDomains) {
  if (!hostname || !allowedDomains || !Array.isArray(allowedDomains)) {
    return false;
  }
  
  const normalizedHostname = hostname.toLowerCase();
  
  return allowedDomains.some(domain => {
    const normalizedDomain = domain.toLowerCase();
    // Exact match or subdomain match
    return normalizedHostname === normalizedDomain || 
           normalizedHostname.endsWith('.' + normalizedDomain);
  });
}

// Check if hostname is in blocked list
function isHostnameBlocked(hostname) {
  if (!hostname) {
    return true;
  }
  
  const normalizedHostname = hostname.toLowerCase();
  
  return BLOCKED_DOMAINS.some(blockedDomain => {
    return normalizedHostname === blockedDomain || 
           normalizedHostname.endsWith('.' + blockedDomain);
  });
}

// Get allowed domains for selected companies
function getAllowedDomainsForCompanies(selectedCompanies, allowlist) {
  const allowedDomains = new Set();
  const companiesWithoutAllowlist = [];
  
  selectedCompanies.forEach(companyName => {
    const companyEntry = allowlist.find(c => 
      c.name.toLowerCase() === companyName.toLowerCase()
    );
    
    if (companyEntry && companyEntry.domains) {
      companyEntry.domains.forEach(domain => allowedDomains.add(domain.toLowerCase()));
    } else {
      companiesWithoutAllowlist.push(companyName);
    }
  });
  
  return {
    allowedDomains: Array.from(allowedDomains),
    companiesWithoutAllowlist
  };
}

// Build career sites information for selected companies
function buildCareerSites(selectedCompanies, allowlist, companiesTxt) {
  const careerSites = [];
  
  // Create a Map of allowlist for O(1) lookup instead of O(n) find
  const allowlistMap = new Map();
  allowlist.forEach(company => {
    allowlistMap.set(company.name.toLowerCase(), company);
  });
  
  selectedCompanies.forEach(companyName => {
    const normalizedName = companyName.toLowerCase();
    const companyEntry = allowlistMap.get(normalizedName);
    
    // Get domains from companies.json
    const domains = companyEntry && companyEntry.domains ? companyEntry.domains : [];
    
    // Get career URLs from companies.txt using direct Map lookup
    const urls = companiesTxt.get(normalizedName) || [];
    
    // Validate URLs against allowlist domains before including
    const validatedUrls = urls.filter(url => {
      const hostname = extractHostname(url);
      if (!hostname) return false;
      return isHostnameAllowed(hostname, domains);
    });
    
    careerSites.push({
      company: companyName,
      urls: validatedUrls,
      domains: domains
    });
  });
  
  return careerSites;
}

// Filter jobs by allowed domains
function filterJobs(jobs, allowedDomains) {
  if (!jobs || !Array.isArray(jobs)) {
    return [];
  }
  
  return jobs.filter(job => {
    if (!job || !job.link) {
      return false;
    }
    
    const hostname = extractHostname(job.link);
    if (!hostname) {
      return false; // Invalid URL
    }
    
    // Block known non-company domains
    if (isHostnameBlocked(hostname)) {
      return false;
    }
    
    // Allow only if in company allowlist
    return isHostnameAllowed(hostname, allowedDomains);
  });
}

// Filter citations by allowed domains
function filterCitations(citations, allowedDomains) {
  if (!citations || !Array.isArray(citations)) {
    return [];
  }
  
  return citations.filter(citation => {
    let url;
    
    if (typeof citation === 'string') {
      url = citation;
    } else if (citation && (citation.url || citation.link)) {
      url = citation.url || citation.link;
    } else {
      return false;
    }
    
    const hostname = extractHostname(url);
    if (!hostname) {
      return false; // Invalid URL
    }
    
    // Block known non-company domains
    if (isHostnameBlocked(hostname)) {
      return false;
    }
    
    // Allow only if in company allowlist
    return isHostnameAllowed(hostname, allowedDomains);
  });
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

    // Get Live Search configuration from environment or use defaults
    const searchMode = process.env.XAI_SEARCH_MODE || 'on'; // default to 'on' to force Live Search
    const maxSearchResults = parseInt(process.env.XAI_MAX_SEARCH_RESULTS || '10', 10);
    const returnCitations = process.env.XAI_RETURN_CITATIONS !== 'false'; // default true
    const debugResponse = process.env.XAI_DEBUG_RESPONSE === 'true'; // default false

    // Validate request body
    const { profession, specialization, location, companies: selectedCompanies } = req.body;
    if (!profession || !specialization || !location) {
      console.log(`[${requestId}] ERROR: Missing required fields`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['profession', 'specialization', 'location'],
        received: { profession, specialization, location },
        requestId
      });
    }

    // Validate companies parameter
    if (!selectedCompanies || !Array.isArray(selectedCompanies) || selectedCompanies.length === 0) {
      console.log(`[${requestId}] ERROR: Missing or empty companies parameter`);
      return res.status(400).json({ 
        error: 'Missing companies selection',
        hint: 'Please select 1-3 companies to search',
        requestId
      });
    }

    if (selectedCompanies.length > 3) {
      console.log(`[${requestId}] ERROR: Too many companies selected - ${selectedCompanies.length}`);
      return res.status(400).json({ 
        error: 'Too many companies selected',
        hint: 'Please select a maximum of 3 companies',
        received: selectedCompanies.length,
        requestId
      });
    }

    console.log(`[${requestId}] Searching for: ${profession} - ${specialization} - ${location}`);
    console.log(`[${requestId}] Selected companies: ${selectedCompanies.join(', ')}`);
    console.log(`[${requestId}] Live Search config: mode=${searchMode}, max_results=${maxSearchResults}, return_citations=${returnCitations}`);

    // Use the selected companies from the client
    const companies = selectedCompanies.map(c => c.trim()).filter(c => c.length > 0);
    
    // Load company allowlist and companies.txt
    const allowlist = loadCompaniesAllowlist();
    const companiesTxt = loadCompaniesTxt();
    
    // Get allowed domains for filtering
    const { allowedDomains, companiesWithoutAllowlist } = getAllowedDomainsForCompanies(companies, allowlist);
    
    // Build career sites information
    const careerSites = buildCareerSites(companies, allowlist, companiesTxt);
    
    console.log(`[${requestId}] Allowed domains for selected companies: ${allowedDomains.length > 0 ? allowedDomains.join(', ') : 'none'}`);
    if (companiesWithoutAllowlist.length > 0) {
      console.log(`[${requestId}] WARNING: No allowlist entries for: ${companiesWithoutAllowlist.join(', ')}`);
    }
    console.log(`[${requestId}] Career sites built for ${careerSites.length} companies`);
    careerSites.forEach(cs => {
      console.log(`[${requestId}]   ${cs.company}: ${cs.urls.length} URLs, ${cs.domains.length} domains`);
    });

    // Construct prompt for xAI Grok API with strengthened instructions and explicit career sites
    // Build career site instructions section
    let careerSiteInstructions = '\nAPPROVED CAREER SITES (USE ONLY THESE):\n';
    careerSites.forEach(cs => {
      careerSiteInstructions += `\n${cs.company}:\n`;
      if (cs.urls.length > 0) {
        careerSiteInstructions += `  Official Career URLs:\n`;
        cs.urls.forEach(url => {
          careerSiteInstructions += `    - ${url}\n`;
        });
      }
      if (cs.domains.length > 0) {
        careerSiteInstructions += `  Approved Domains:\n`;
        cs.domains.forEach(domain => {
          careerSiteInstructions += `    - ${domain}\n`;
        });
      }
    });

const prompt = `You are a flexible, thorough job search assistant specialized in chemical industry roles. Find current, real job openings that exactly match or closely relate to the criteria below. Prioritize official company career sites.

Criteria:
- Profession: ${profession} (equivalents: Chemical Engineer, Chemieingenieur, Process Engineer, Prozessingenieur, Verfahrenstechniker/in)
- Specialization: ${specialization} (related: catalysis/Katalyse, Katalysator, heterogeneous catalysis, catalyst development, precious metals in catalysts, catalyst business units/divisions)
- Location: ${location} (Germany/Deutschland; include hybrid if based in Germany)
- Companies (SEARCH ONLY THESE): ${companies.join(', ')}
${careerSiteInstructions}
SEARCH INSTRUCTIONS (CRITICAL - FOLLOW THESE):
1. ONLY use the approved career site URLs and domains listed above for each company.
2. Restrict searches to each company's official career domains (e.g., basf.jobs, jobs.basf.com, jobs.arkema.com).
3. Prefer direct job-posting pages from the approved career URLs.
4. Use targeted site-specific queries like:
   - site:basf.jobs "Verfahrenstechnik" Deutschland
   - site:basf.jobs "Chemieingenieur" OR "Prozessingenieur" OR "catalyst" Germany
   - site:basf.jobs "Katalysator" OR "precious metals"
   - Similar for other companies (e.g., site:jobs.arkema.com Deutschland Katalysator)
5. Search in both English and German.
6. Include close matches: process/chemical engineering roles, trainee programs, internships (Praktikum/Abschlussarbeit) in Verfahrenstechnik/Chemieingenieurwesen, R&D in catalysis, or commercial/technical roles in catalyst divisions.
7. Prioritize exact matches but return relevant close matches (70%+ relevance) if no perfect ones.

RULES FOR VALID JOBS:
1. ONLY direct URLs from the approved domains listed above.
2. NO aggregators, ATS vendors (unless company subdomain), social media, or unofficial sites.
3. NO invention/guessing – only high-confidence live postings.
4. Return up to 10 jobs, ranked by relevance.

If no matches, return empty jobs array (but try hard to find close ones first).

Output ONLY JSON:
{
  "jobs": [
    {
      "title": "Original title (German or English)",
      "company": "Exact company name",
      "location": "City/Region from posting",
      "link": "Direct official URL"
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
      // Construct request body with Live Search parameters
      const requestBody = {
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
        temperature: 0.5,
        max_tokens: 10000,
        search_parameters: {
          mode: searchMode,
          max_search_results: maxSearchResults,
          return_citations: returnCitations
        }
      };

      response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
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
    
    // Debug logging when enabled (gated by XAI_DEBUG_RESPONSE env var)
    if (debugResponse) {
      console.log(`[${requestId}] DEBUG: Top-level apiData keys:`, Object.keys(apiData));
      
      if (apiData.choices?.[0]) {
        console.log(`[${requestId}] DEBUG: apiData.choices?.[0] keys:`, Object.keys(apiData.choices[0]));
      } else {
        console.log(`[${requestId}] DEBUG: apiData.choices?.[0] keys: N/A`);
      }
      
      if (apiData.choices?.[0]?.message) {
        console.log(`[${requestId}] DEBUG: apiData.choices?.[0]?.message keys:`, Object.keys(apiData.choices[0].message));
      } else {
        console.log(`[${requestId}] DEBUG: apiData.choices?.[0]?.message keys: N/A`);
      }
      
      if (apiData.usage) {
        console.log(`[${requestId}] DEBUG: apiData.usage:`, apiData.usage);
      }
      
      // Check potential citation locations
      console.log(`[${requestId}] DEBUG: apiData.citations:`, apiData.citations || 'N/A');
      console.log(`[${requestId}] DEBUG: apiData.choices?.[0]?.citations:`, apiData.choices?.[0]?.citations || 'N/A');
      console.log(`[${requestId}] DEBUG: apiData.choices?.[0]?.message?.citations:`, apiData.choices?.[0]?.message?.citations || 'N/A');
    }
    
    const grokResponse = apiData.choices?.[0]?.message?.content;
    
    // Extract citations from multiple possible locations (defensive)
    let citations = [];
    
    // Check all possible citation locations
    if (apiData.citations && Array.isArray(apiData.citations)) {
      citations = apiData.citations;
    } else if (apiData.choices?.[0]?.citations && Array.isArray(apiData.choices[0].citations)) {
      citations = apiData.choices[0].citations;
    } else if (apiData.choices?.[0]?.message?.citations && Array.isArray(apiData.choices[0].message.citations)) {
      citations = apiData.choices[0].message.citations;
    }
    
    if (citations.length > 0) {
      console.log(`[${requestId}] Received ${citations.length} citations from Live Search`);
    } else {
      console.log(`[${requestId}] No citations found in response`);
    }

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

    // Limit to 10 jobs before filtering
    jobs = jobs.slice(0, 10);
    
    // Count jobs and citations before filtering
    const jobsBeforeFilter = jobs.length;
    const citationsBeforeFilter = citations.length;
    
    // Apply domain filtering to jobs and citations
    let filteredJobs = [];
    let filteredCitations = [];
    let warning = null;
    
    if (allowedDomains.length === 0) {
      // No allowlist entries found for selected companies
      console.log(`[${requestId}] WARNING: No domain allowlist for selected companies, returning empty results`);
      warning = `No domain allowlist configured for the selected companies: ${companiesWithoutAllowlist.join(', ')}. Please contact support to add these companies to the allowlist.`;
      filteredJobs = [];
      filteredCitations = [];
    } else {
      // Filter using allowlist
      filteredJobs = filterJobs(jobs, allowedDomains);
      filteredCitations = filterCitations(citations, allowedDomains);
      
      console.log(`[${requestId}] Filtered jobs: ${jobsBeforeFilter} -> ${filteredJobs.length} (removed ${jobsBeforeFilter - filteredJobs.length})`);
      console.log(`[${requestId}] Filtered citations: ${citationsBeforeFilter} -> ${filteredCitations.length} (removed ${citationsBeforeFilter - filteredCitations.length})`);
      
      // Add warning if filtering removed all results
      if (filteredJobs.length === 0 && jobsBeforeFilter > 0) {
        warning = `All ${jobsBeforeFilter} job(s) were filtered out because they were not from official company career sites. Only URLs from company domains are allowed.`;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] END - Returning ${filteredJobs.length} jobs, ${filteredCitations.length} citations - Duration: ${duration}ms`);

    const responseData = {
      jobs: filteredJobs,
      citations: filteredCitations,
      career_sites: careerSites,
      count: filteredJobs.length,
      query: { profession, specialization, location },
      requestId
    };
    
    // Add warning if present
    if (warning) {
      responseData.warning = warning;
    }

    return res.status(200).json(responseData);

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
