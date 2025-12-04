module.exports = async (req, res) => {
    const apiKeyConfigured = !!process.env.XAI_API_KEY;
    
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            apiKeyConfigured,
            nodeVersion: process.version
        },
        message: apiKeyConfigured 
            ? 'Backend is configured correctly' 
            : 'API key is missing - add XAI_API_KEY in Vercel dashboard'
    });
};
