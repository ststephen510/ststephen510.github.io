// Vercel Serverless Function for xAI API calls

const COMPANIES = [
    // Chemicals & Materials (1-25)
    { name: 'BASF SE', careerUrl: 'https://www.basf.com/global/en/careers.html', description: 'Chemical products and solutions' },
    { name: 'LyondellBasell Industries', careerUrl: 'https://www.lyondellbasell.com/en/careers/', description: 'Plastics, chemicals, and refining' },
    { name: 'INEOS', careerUrl: 'https://www.ineos.com/careers/', description: 'Petrochemicals, specialty chemicals' },
    { name: 'Air Liquide', careerUrl: 'https://www.airliquide.com/careers', description: 'Industrial gases and services' },
    { name: 'Linde plc', careerUrl: 'https://www.linde.com/careers', description: 'Industrial gases and engineering' },
    { name: 'Covestro AG', careerUrl: 'https://www.covestro.com/en/careers', description: 'High-performance polymers' },
    { name: 'Evonik Industries', careerUrl: 'https://careers.evonik.com/', description: 'Specialty chemicals' },
    { name: 'SABIC Europe', careerUrl: 'https://www.sabic.com/en/careers', description: 'Chemicals and polymers' },
    { name: 'AkzoNobel', careerUrl: 'https://www.akzonobel.com/en/careers', description: 'Paints, coatings, and specialty chemicals' },
    { name: 'Solvay', careerUrl: 'https://www.solvay.com/en/careers', description: 'Advanced materials and specialty chemicals' },
    { name: 'Robert Bosch GmbH', careerUrl: 'https://www.bosch.com/careers/', description: 'Engineering and technology' },
    { name: 'Continental AG', careerUrl: 'https://www.continental.com/en/career/', description: 'Automotive systems and technologies' },
    { name: 'Airbus', careerUrl: 'https://www.airbus.com/en/careers', description: 'Aerospace manufacturer' },
    { name: 'Thales Group', careerUrl: 'https://www.thalesgroup.com/en/careers', description: 'Aerospace, defence, and security' },
    { name: 'Safran', careerUrl: 'https://www.safran-group.com/careers', description: 'Aerospace and defence' },
    { name: 'Fraunhofer Society', careerUrl: 'https://www.fraunhofer.de/en/jobs-and-careers.html', description: 'Applied research organization' },
    { name: 'Max Planck Society', careerUrl: 'https://www.mpg.de/careers', description: 'Scientific research' },
    { name: 'Bayer AG', careerUrl: 'https://www.bayer.com/en/careers', description: 'Pharmaceuticals and crop science' },
    { name: 'Merck KGaA', careerUrl: 'https://www.merckgroup.com/en/careers.html', description: 'Science and technology' },
    { name: 'Siemens AG', careerUrl: 'https://www.siemens.com/careers', description: 'Technology and engineering' }
];

module.exports = async (req, res) => {
    // Log incoming request for debugging (sanitized)
    console.log('=== API Request Received ===');
    console.log('Method:', req.method);
    console.log('Has body:', !!req.body);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Check for API key
    const XAI_API_KEY = process.env.XAI_API_KEY;
    console.log('API Key configured:', !!XAI_API_KEY);

    if (!XAI_API_KEY) {
        console.error('ERROR: XAI_API_KEY not found in environment variables');
        return res.status(500).json({ 
            error: 'API key not configured in Vercel environment variables. Please add XAI_API_KEY in your Vercel dashboard.' 
        });
    }

    // Validate request body
    const { jobTitle, specialization, region } = req.body;
    if (!jobTitle || !specialization || !region) {
        return res.status(400).json({ 
            error: 'Missing required fields: jobTitle, specialization, region' 
        });
    }

    const prompt = `You are a job search assistant. Given the following information:
- Job Title: ${jobTitle}
- Specialization: ${specialization}
- Region: ${region}

And the following companies with their career pages:
${COMPANIES.map(c => `- ${c.name}: ${c.careerUrl} (${c.description})`).join('\n')}

Your task:
1. For each company, determine if they likely have relevant job openings matching the criteria
2. Generate realistic job titles that might exist at these companies based on the search criteria
3. Consider typos and similar job titles (e.g., "Software Engineer" matches "Software Developer", "SWE")
4. Provide a match score (0-100) based on how well the job matches the criteria
5. Explain WHY each job is a good match
6. Include the career page URL where they can apply

Return your response as a valid JSON array with this exact structure:
[
  {
    "company": "Company Name",
    "title": "Specific Job Title",
    "location": "City, State or Remote",
    "type": "Full-time/Contract/Intern",
    "matchScore": 85,
    "reasoning": "Brief explanation of why this is a good match",
    "link": "https://company.com/careers/job-id"
  }
]

Rules:
- Return 3-8 of the most relevant jobs
- Be realistic about what jobs exist at these companies
- Consider the company's industry when matching jobs
- Match score should reflect: title match, specialization alignment, location fit
- If region is "Remote", prioritize companies that offer remote work
- Include a mix of high matches (90+) and good matches (70-89)
- Return ONLY the JSON array, no other text

Generate the job matches now:`;

    try {
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
                        content: 'You are a helpful job search assistant. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const grokResponse = data.choices[0].message.content;
        
        let jobs;
        try {
            const jsonMatch = grokResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                jobs = JSON.parse(jsonMatch[0]);
            } else {
                jobs = JSON.parse(grokResponse);
            }
        } catch (parseError) {
            console.error('Failed to parse Grok response:', grokResponse);
            jobs = [];
        }

        jobs = jobs.filter(job => 
            job.company && job.title && job.matchScore && job.link
        ).map(job => ({
            company: job.company,
            title: job.title,
            location: job.location || region,
            type: job.type || 'Full-time',
            matchScore: Math.min(100, Math.max(0, job.matchScore)),
            reasoning: job.reasoning || 'Good match for your criteria',
            link: job.link
        }));

        res.status(200).json({ jobs });

    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ 
            error: error.message || 'Failed to fetch jobs'
        });
    }
};
