// Health check endpoint for diagnosing deployment issues

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            allowedMethods: ['GET']
        });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    
    // Check API key configuration (without exposing the actual key)
    const apiKeyStatus = {
        configured: !!XAI_API_KEY,
        length: XAI_API_KEY ? XAI_API_KEY.length : 0,
        prefix: XAI_API_KEY ? XAI_API_KEY.substring(0, 4) + '...' : null
    };

    // Gather environment info
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            vercel: !!process.env.VERCEL,
            region: process.env.VERCEL_REGION || 'unknown'
        },
        apiKey: apiKeyStatus,
        endpoints: {
            searchJobs: '/api/search-jobs (POST)',
            health: '/api/health (GET)'
        },
        diagnostics: {
            apiKeyConfigured: apiKeyStatus.configured,
            fallbackAvailable: true,
            message: apiKeyStatus.configured 
                ? 'API key is configured. xAI Grok integration should work.' 
                : 'API key not configured. The app will use intelligent fallback matching.'
        }
    };

    // Add troubleshooting tips if API key is not configured
    if (!apiKeyStatus.configured) {
        healthStatus.troubleshooting = {
            issue: 'XAI_API_KEY environment variable not set',
            steps: [
                '1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables',
                '2. Add a new variable: XAI_API_KEY',
                '3. Set the value to your xAI API key',
                '4. Redeploy the project for changes to take effect'
            ],
            note: 'The app will still work without the API key using intelligent matching'
        };
    }

    console.log(`[health] Health check requested - API key configured: ${apiKeyStatus.configured}`);
    
    res.status(200).json(healthStatus);
};
