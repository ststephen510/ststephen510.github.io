// Vercel Serverless Function for European Chemical Engineering Job Search
// Uses xAI Grok API to search for jobs at European companies

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // CORS headers - allow GitHub Pages and localhost
  const allowedOrigins = [
    'https://ststephen510.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  // Validate API key
  const XAI_API_KEY = process.env.XAI_API_KEY;
  if (!XAI_API_KEY) {
    return res.status(500).json({ 
      error: 'API key not configured. Please add XAI_API_KEY environment variable in Vercel dashboard.',
      hint: 'Go to Vercel Dashboard → Settings → Environment Variables'
    });
  }
  
  // Validate request body
  const { profession, specialization, location } = req.body;
  if (!profession || !specialization || !location) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['profession', 'specialization', 'location']
    });
  }
  
  try {
    // Read companies from file
    const companiesPath = path.join(process.cwd(), 'companies.txt');
    const companiesText = fs.readFileSync(companiesPath, 'utf-8');
    const companies = companiesText.split(',').map(c => c.trim()).slice(0, 1000);
    
    console.log(`Searching for ${profession} jobs with ${specialization} in ${location}`);
    console.log(`Checking ${companies.length} companies`);
    
    // Construct prompt for xAI Grok API
    const prompt = `You are a job search assistant. Search the web for current job openings that match these criteria:

Profession: ${profession}
Specialization: ${specialization}
Location: ${location}

Companies to search (prioritize these): ${companies.join(', ')}

Instructions:
1. Find up to 300 real, current job postings
2. Include jobs from the listed companies AND other relevant employers
3. Rank results by relevance (best matches first)
4. For each job, provide:
   - Job title
   - Company name
   - Direct application link (URL)
   - Brief description (1-2 sentences)

Return results as a JSON array in this exact format:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "link": "https://...",
      "description": "Brief description"
    }
  ]
}`;
    
    // Call xAI Grok API
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
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
      },
      {
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse response
    const grokResponse = response.data.choices[0].message.content;
    console.log('Grok response received:', grokResponse.substring(0, 200) + '...');
    
    // Try to parse JSON from response
    let jobs = [];
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = grokResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      jobs = parsed.jobs || [];
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Return empty array if parsing fails
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
    console.error('Error searching jobs:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'API request failed',
        message: error.response.data?.error?.message || error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};
