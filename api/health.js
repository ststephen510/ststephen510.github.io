module.exports = async (req, res) => {
    const apiKeyConfigured = !!process.env.XAI_API_KEY;
    const apiKeyLength = process.env.XAI_API_KEY ? process.env.XAI_API_KEY.length : 0;
    
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            apiKeyConfigured,
            apiKeyLength,
            nodeVersion: process.version
        },
        message: apiKeyConfigured 
            ? 'Backend is configured correctly' 
            : 'API key is missing - add XAI_API_KEY in Vercel dashboard'
    });
};
