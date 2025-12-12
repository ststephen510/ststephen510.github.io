module.exports = async (req, res) => {
  const apiKeyConfigured = !!process.env.XAI_API_KEY;
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      apiKeyConfigured,
      nodeVersion: process.version,
      platform: process.platform
    },
    message: apiKeyConfigured 
      ? 'Backend is configured correctly' 
      : 'Missing XAI_API_KEY - add in Vercel dashboard'
  });
};
