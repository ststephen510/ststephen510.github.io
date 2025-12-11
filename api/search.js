// Vercel Serverless Function for Job Search
// This function handles POST requests to search for jobs using xAI Grok API

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://ststephen510.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      hint: 'This endpoint only accepts POST requests.'
    });
  }

  try {
    // Validate API key
    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      console.error('ERROR: XAI_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured',
        hint: 'Add XAI_API_KEY in Vercel Dashboard → Settings → Environment Variables'
      });
    }

    // Validate request body
    const { profession, specialization, location } = req.body;
    if (!profession || !specialization || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['profession', 'specialization', 'location'],
        received: { profession, specialization, location }
      });
    }

    console.log(`Searching for: ${profession} - ${specialization} - ${location}`);

    // Read companies from file
    let companies = [];
    try {
      const companiesPath = path.join(process.cwd(), 'companies.txt');
      console.log('Reading companies from:', companiesPath);
      const companiesText = fs.readFileSync(companiesPath, 'utf-8');
      companies = companiesText.split(',').map(c => c.trim()).filter(c => c.length > 0).slice(0, 1000);
      console.log(`Loaded ${companies.length} companies`);
    } catch (fileError) {
      console.error('Error reading companies.txt:', fileError.message);
      return res.status(500).json({ 
        error: 'Failed to load companies database',
        details: fileError.message
      });
    }

    // Construct prompt for xAI Grok API
    const prompt = `You are a job search assistant. Search the web for current job openings that match these criteria:

Profession: ${profession}
Specialization: ${specialization}
Location: ${location}

Companies to prioritize (search these first): ${companies.join(', ')}

Instructions:
1. Find up to 300 real, current job postings
2. Include jobs from the listed companies AND other relevant employers
3. Rank results by relevance (best matches first)
4. For each job, provide:
   - Job title
   - Company name
   - Direct application link (URL)
   - Brief description (1-2 sentences)

Return results as a JSON array in this EXACT format:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "link": "https://example.com/job",
      "description": "Brief description"
    }
  ]
}`;

    console.log('Calling xAI Grok API...');

    // Call xAI Grok API using native fetch (available in Node.js 18+)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('xAI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'xAI API request failed',
        status: response.status,
        details: errorText
      });
    }

    const apiData = await response.json();
    const grokResponse = apiData.choices?.[0]?.message?.content;

    if (!grokResponse) {
      console.error('No response from xAI API');
      return res.status(500).json({ 
        error: 'No response from AI',
        details: 'The AI did not return any content'
      });
    }

    console.log('Received response from xAI, parsing...');

    // Parse JSON from response
    let jobs = [];
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = grokResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      jobs = parsed.jobs || [];
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError.message);
      console.log('Raw response:', grokResponse.substring(0, 500));
      // Return empty array instead of failing
      jobs = [];
    }

    // Limit to 300 jobs
    jobs = jobs.slice(0, 300);

    console.log(`Returning ${jobs.length} jobs`);

    return res.status(200).json({ 
      jobs,
      count: jobs.length,
      query: { profession, specialization, location }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
