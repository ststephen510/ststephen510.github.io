// Vercel Serverless Function for xAI API calls

// Helper function to create fallback response
function createFallbackResponse(res, jobTitle, specialization, region, companies, message) {
    const mockJobs = generateMockJobs(jobTitle, specialization, region, companies);
    return res.status(200).json({ 
        jobs: mockJobs,
        source: 'fallback',
        message
    });
}

// Generate mock jobs based on search criteria for fallback
function generateMockJobs(jobTitle, specialization, region, companies) {
    const jobLower = jobTitle.toLowerCase();
    const specLower = specialization.toLowerCase();
    
    // Keyword mapping for intelligent matching
    const keywords = {
        chemical: ['basf', 'lyondell', 'evonik', 'sabic', 'solvay', 'covestro', 'bayer'],
        catalyst: ['johnson matthey', 'axens', 'albemarle', 'honeywell', 'topsoe', 'grace'],
        automotive: ['continental', 'bosch', 'zf', 'mahle'],
        aerospace: ['airbus', 'mtu', 'safran', 'thales', 'leonardo'],
        defense: ['mbda', 'thales', 'rheinmetall', 'hensoldt'],
        research: ['fraunhofer', 'max planck', 'helmholtz', 'leibniz'],
        materials: ['basf', 'evonik', 'henkel', 'sika', 'umicore'],
        engineer: ['bosch', 'continental', 'airbus', 'basf', 'evonik'],
        software: ['bosch', 'continental', 'fraunhofer', 'max planck'],
        data: ['bosch', 'continental', 'fraunhofer', 'max planck'],
        scientist: ['basf', 'bayer', 'merck', 'fraunhofer', 'max planck']
    };
    
    // Find relevant companies based on specialization and job title
    let relevantCompanies = [];
    for (const [key, companyNames] of Object.entries(keywords)) {
        if (specLower.includes(key) || jobLower.includes(key)) {
            const filtered = companies.filter(c => 
                companyNames.some(name => c.name.toLowerCase().includes(name))
            );
            relevantCompanies.push(...filtered);
        }
    }
    
    // Remove duplicates
    relevantCompanies = [...new Map(relevantCompanies.map(c => [c.name, c])).values()];
    
    // If no specific matches, use top companies
    if (relevantCompanies.length === 0) {
        relevantCompanies = companies.slice(0, 8);
    }
    
    // Take top 6-8 companies
    relevantCompanies = relevantCompanies.slice(0, Math.min(8, relevantCompanies.length));
    
    // Generate realistic job matches
    return relevantCompanies.map((company, index) => {
        const score = 95 - (index * 3);
        let jobRole = jobTitle;
        
        // Add specialization context to title
        if (!jobTitle.toLowerCase().includes(specialization.toLowerCase())) {
            jobRole = `${jobTitle} - ${specialization}`;
        }
        
        return {
            company: company.name,
            title: jobRole,
            location: region.toLowerCase() === 'remote' ? 'Remote' : region,
            type: 'Full-time',
            matchScore: score,
            reasoning: `${company.description}. Strong alignment with ${specialization} specialization. Actively hiring for ${jobTitle} roles in ${region}.`,
            link: company.careerUrl
        };
    });
}

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
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'This endpoint only accepts POST requests',
            allowedMethods: ['POST']
        });
    }

    const { jobTitle, specialization, region } = req.body;

    if (!jobTitle || !specialization || !region) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            message: 'Please provide jobTitle, specialization, and region',
            received: { 
                jobTitle: !!jobTitle, 
                specialization: !!specialization, 
                region: !!region 
            }
        });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    
    // Check if API key is configured
    if (!XAI_API_KEY) {
        console.log('[search-jobs] API key not configured, using fallback mock data');
        return createFallbackResponse(res, jobTitle, specialization, region, COMPANIES, 
            'Using intelligent matching (API key not configured)');
    }

    console.log(`[search-jobs] Processing request: ${jobTitle} | ${specialization} | ${region}`);

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
        console.log('[search-jobs] Calling xAI API...');
        
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
            const errorMessage = errorData.error?.message || `API returned status ${response.status}`;
            console.error(`[search-jobs] xAI API error: ${errorMessage}`);
            
            // Provide specific error messages based on status code
            if (response.status === 401) {
                console.log('[search-jobs] Authentication failed, using fallback');
                return createFallbackResponse(res, jobTitle, specialization, region, COMPANIES,
                    'Using intelligent matching (API authentication failed - check your API key)');
            } else if (response.status === 429) {
                console.log('[search-jobs] Rate limited, using fallback');
                return createFallbackResponse(res, jobTitle, specialization, region, COMPANIES,
                    'Using intelligent matching (API rate limit exceeded)');
            } else if (response.status >= 500) {
                console.log('[search-jobs] xAI service unavailable, using fallback');
                return createFallbackResponse(res, jobTitle, specialization, region, COMPANIES,
                    'Using intelligent matching (xAI service temporarily unavailable)');
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[search-jobs] xAI API response received');
        
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
            console.error('[search-jobs] Failed to parse Grok response, using fallback:', parseError.message);
            return createFallbackResponse(res, jobTitle, specialization, region, COMPANIES,
                'Using intelligent matching (AI response parsing failed)');
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

        console.log(`[search-jobs] Returning ${jobs.length} jobs from xAI`);
        res.status(200).json({ 
            jobs,
            source: 'xai',
            message: 'Results powered by xAI Grok'
        });

    } catch (error) {
        console.error('[search-jobs] Unexpected error:', error.message);
        
        // Fallback to mock data instead of returning error
        return createFallbackResponse(res, jobTitle, specialization, region, COMPANIES,
            `Using intelligent matching (${error.message})`);
    }
};
