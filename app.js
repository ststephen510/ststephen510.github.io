// FOR LOCAL DEVELOPMENT ONLY
// This file is NOT used in production. Vercel uses /api/search.js for the backend.
// This Express server is provided for local testing before deployment.

// European Chemical Engineering Job Search Backend
// Uses xAI Grok API to search for jobs at European companies

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load company allowlist from companies.json
let companiesAllowlist = null;
function loadCompaniesAllowlist() {
  if (companiesAllowlist) {
    return companiesAllowlist;
  }
  
  try {
    const companiesJsonPath = path.join(__dirname, 'companies.json');
    const companiesData = fs.readFileSync(companiesJsonPath, 'utf8');
    companiesAllowlist = JSON.parse(companiesData);
    return companiesAllowlist;
  } catch (error) {
    console.error('Failed to load companies.json:', error.message);
    return [];
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

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKeyConfigured: !!process.env.XAI_API_KEY
  });
});

// Main search endpoint
// Note: For production use, consider implementing rate limiting to prevent abuse
// Example: Use express-rate-limit package to limit requests per IP address
app.post('/search', async (req, res) => {
  try {
    // Validate environment variables
    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({ 
        error: 'XAI_API_KEY not configured in environment variables' 
      });
    }

    // Get Live Search configuration from environment or use defaults
    const searchMode = process.env.XAI_SEARCH_MODE || 'auto';
    const maxSearchResults = parseInt(process.env.XAI_MAX_SEARCH_RESULTS || '10', 10);
    const returnCitations = process.env.XAI_RETURN_CITATIONS !== 'false'; // default true

    // Extract search parameters from request
    const { profession, specialization, location, companies: selectedCompanies } = req.body;

    // Validate input parameters
    if (!profession || !specialization || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields: profession, specialization, and location are required' 
      });
    }

    // Validate companies parameter - backward compatible for local dev
    let companies;
    if (!selectedCompanies || !Array.isArray(selectedCompanies) || selectedCompanies.length === 0) {
      console.log('Warning: No companies provided by client - falling back to loading from file for local dev');
      // Fallback behavior for local development
      const companiesFilePath = path.join(__dirname, 'companies.txt');
      
      if (!fs.existsSync(companiesFilePath)) {
        return res.status(500).json({ 
          error: 'companies.txt file not found' 
        });
      }

      const companiesData = fs.readFileSync(companiesFilePath, 'utf-8');
      
      // Parse comma-separated companies and take up to 3 for compatibility
      companies = companiesData
        .split(',')
        .map(company => company.trim())
        .filter(company => company.length > 0)
        .slice(0, 3);
      
      console.log(`Loaded ${companies.length} companies from companies.txt (fallback for local dev)`);
    } else {
      if (selectedCompanies.length > 3) {
        return res.status(400).json({ 
          error: 'Too many companies selected. Please select a maximum of 3 companies' 
        });
      }
      companies = selectedCompanies.map(c => c.trim()).filter(c => c.length > 0);
      console.log(`Using ${companies.length} companies from client: ${companies.join(', ')}`);
    }

    console.log(`Search request: ${profession}, ${specialization}, ${location}`);
    console.log(`Live Search config: mode=${searchMode}, max_results=${maxSearchResults}, return_citations=${returnCitations}`);

    // Load company allowlist and get allowed domains
    const allowlist = loadCompaniesAllowlist();
    const { allowedDomains, companiesWithoutAllowlist } = getAllowedDomainsForCompanies(companies, allowlist);
    
    console.log(`Allowed domains for selected companies: ${allowedDomains.length > 0 ? allowedDomains.join(', ') : 'none'}`);
    if (companiesWithoutAllowlist.length > 0) {
      console.log(`WARNING: No allowlist entries for: ${companiesWithoutAllowlist.join(', ')}`);
    }

    // Construct the prompt for xAI Grok API with strengthened instructions
    const prompt = `You are a precise job search assistant. Find current, real job openings that closely match:

Criteria:
- Profession: ${profession}
- Specialization: ${specialization}
- Location: ${location}
- Companies to search (ONLY these ${companies.length} companies): ${companies.join(', ')}

CRITICAL REQUIREMENTS - URLs MUST BE FROM OFFICIAL COMPANY CAREER SITES ONLY:

1. Search ONLY the official company career websites of the ${companies.length} companies listed above.
2. Use ONLY URLs from the company's own domains (e.g., basf.com, careers.basf.com, covestro.com).
3. NEVER use job aggregator sites (Indeed, Glassdoor, LinkedIn, Monster, StepStone, etc.).
4. NEVER use social media sites (Reddit, X/Twitter, Facebook, etc.).
5. NEVER use ATS vendor domains (myworkdayjobs.com, greenhouse.io, lever.co) unless they are subdomains of the company's official domain.
6. NEVER use blogs, forums, or unofficial sites (selectyouruniversity.com, etc.).
7. NEVER invent, guess, or hallucinate job postings or URLs.
8. Only return jobs that you are 99% sure exist right now with valid, live URLs on the company's official website.
9. Look for jobs that match at least 70% of the criteria (in German OR English).
10. Return maximum 10 jobs, ranked by relevance.

If you cannot find at least 1 real, current opening with an official company career site URL, return an empty jobs array.

Output ONLY valid, verified jobs from official company websites. If none found, return empty jobs array.

Final Output (JSON only, no explanations):
{
  "jobs": [
    {
      "title": "Original job title (German or English)",
      "company": "Exact company name",
      "location": "City/Region from the posting",
      "link": "Direct application URL from company's official website ONLY"
    }
  ]
}`;

    // Call xAI Grok API
    console.log('Calling xAI Grok API...');
    
    const apiResponse = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: process.env.XAI_MODEL || 'grok-4-1-fast-reasoning',
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
        temperature: 0.3,
        max_tokens: 3000,
        search_parameters: {
          mode: searchMode,
          max_search_results: maxSearchResults,
          return_citations: returnCitations
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    console.log('Received response from xAI Grok API');

    // Extract the response content
    const grokResponse = apiResponse.data.choices[0].message.content;
    
    // Extract citations if available from Live Search (check multiple locations)
    let citations = [];
    if (apiResponse.data.citations && Array.isArray(apiResponse.data.citations)) {
      citations = apiResponse.data.citations;
    } else if (apiResponse.data.choices?.[0]?.citations && Array.isArray(apiResponse.data.choices[0].citations)) {
      citations = apiResponse.data.choices[0].citations;
    } else if (apiResponse.data.choices?.[0]?.message?.citations && Array.isArray(apiResponse.data.choices[0].message.citations)) {
      citations = apiResponse.data.choices[0].message.citations;
    }
    
    if (citations.length > 0) {
      console.log(`Received ${citations.length} citations from Live Search`);
    }
    
    // Parse the JSON response from Grok
    let jobs = [];
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = grokResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      jobs = parsed.jobs || [];
    } catch (parseError) {
      console.error('Error parsing Grok response:', parseError);
      console.error('Raw response:', grokResponse.substring(0, 500));
      
      // Return empty array instead of failing
      jobs = [];
    }

    // Validate jobs array
    if (!Array.isArray(jobs)) {
      jobs = [];
    }

    // Ensure each job has required fields and limit to 10 jobs
    const validJobs = jobs
      .filter(job => job.title && job.company && job.link)
      .slice(0, 10);

    // Count before filtering
    const jobsBeforeFilter = validJobs.length;
    const citationsBeforeFilter = citations.length;

    // Apply domain filtering to jobs and citations
    let filteredJobs = [];
    let filteredCitations = [];
    let warning = null;
    
    if (allowedDomains.length === 0) {
      // No allowlist entries found for selected companies
      console.log(`WARNING: No domain allowlist for selected companies, returning empty results`);
      warning = `No domain allowlist configured for the selected companies: ${companiesWithoutAllowlist.join(', ')}. Please contact support to add these companies to the allowlist.`;
      filteredJobs = [];
      filteredCitations = [];
    } else {
      // Filter using allowlist
      filteredJobs = filterJobs(validJobs, allowedDomains);
      filteredCitations = filterCitations(citations, allowedDomains);
      
      console.log(`Filtered jobs: ${jobsBeforeFilter} -> ${filteredJobs.length} (removed ${jobsBeforeFilter - filteredJobs.length})`);
      console.log(`Filtered citations: ${citationsBeforeFilter} -> ${filteredCitations.length} (removed ${citationsBeforeFilter - filteredCitations.length})`);
      
      // Add warning if filtering removed all results
      if (filteredJobs.length === 0 && jobsBeforeFilter > 0) {
        warning = `All ${jobsBeforeFilter} job(s) were filtered out because they were not from official company career sites. Only URLs from company domains are allowed.`;
      }
    }

    console.log(`Returning ${filteredJobs.length} jobs`);

    // Return the filtered jobs and citations to the client
    const response = {
      jobs: filteredJobs,
      citations: filteredCitations,
      count: filteredJobs.length,
      query: { profession, specialization, location }
    };
    
    // Add warning if present
    if (warning) {
      response.warning = warning;
    }
    
    res.json(response);

  } catch (error) {
    console.error('Error in /search endpoint:', error);

    // Handle specific error types
    if (error.response) {
      // API returned an error response
      console.error('API Error:', error.response.data);
      return res.status(error.response.status).json({ 
        error: 'API request failed',
        details: error.response.data.error || error.response.data
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
      return res.status(503).json({ 
        error: 'Failed to connect to xAI API',
        details: error.message
      });
    } else {
      // Other errors
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Serve static files from docs directory (registered after routes)
app.use(express.static('docs'));

// Start the server
app.listen(PORT, () => {
  console.log(`European Chemical Engineering Jobs server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the application`);
  console.log(`API Key configured: ${!!process.env.XAI_API_KEY}`);
});
