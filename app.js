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

    // Construct the prompt for xAI Grok API
    const prompt = `You are a job search assistant specializing in European chemical engineering companies. 

TASK: Search the web for current open job positions that match the following criteria:

Profession: ${profession}
Specialization: ${specialization}
Location: ${location}

COMPANY LIST (search for jobs at these companies):
${companies.join(', ')}

INSTRUCTIONS:
1. Use web search to find current job openings at these companies
2. Find up to 300 job positions that match the criteria
3. Rank the jobs by relevance:
   - PERFECT FITS: Exact match of profession, specialization, and location
   - LIKELY FITS: Strong match on profession and either specialization or location
   - POSSIBLE FITS: Matches profession with related specialization or nearby location
4. For each job, provide:
   - Job title
   - Company name
   - Direct link to the job posting (must be a valid URL)

OUTPUT FORMAT:
Return the results as a JSON array with the following structure:
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "link": "https://direct-link-to-job-posting.com"
  }
]

IMPORTANT:
- Only include real, currently open positions with valid links
- Ensure links are direct to the job posting, not just careers pages
- Rank by relevance (best matches first)
- Maximum 300 jobs
- Return ONLY the JSON array, no additional text`;

    // Call xAI Grok API
    console.log('Calling xAI Grok API...');
    
    const apiResponse = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful job search assistant. Use web search to find real, current job openings. Always return results in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
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
    
    // Parse the JSON response from Grok
    let jobs = [];
    try {
      // Try to extract JSON from the response
      // Grok might wrap the JSON in markdown code blocks
      const jsonMatch = grokResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jobs = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array found, try parsing the whole response
        jobs = JSON.parse(grokResponse);
      }
    } catch (parseError) {
      console.error('Error parsing Grok response:', parseError);
      console.error('Raw response:', grokResponse);
      
      // Return the raw response if we can't parse it
      return res.status(500).json({ 
        error: 'Failed to parse job listings from API response',
        rawResponse: grokResponse.substring(0, 500) // First 500 chars for debugging
      });
    }

    // Validate and clean the jobs array
    if (!Array.isArray(jobs)) {
      return res.status(500).json({ 
        error: 'Invalid response format from API' 
      });
    }

    // Ensure each job has required fields and limit to 300 jobs
    const validJobs = jobs
      .filter(job => job.title && job.company && job.link)
      .slice(0, 300);

    console.log(`Returning ${validJobs.length} jobs`);

    // Return the jobs to the client
    res.json({ 
      jobs: validJobs,
      count: validJobs.length
    });

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
