module.exports = async (req, res) => {
  // Add CORS headers for diagnostics
  const allowedOrigins = [
    'https://ststephen510.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Echo requestId if provided
  const requestId = req.headers['x-request-id'];

  const apiKeyConfigured = !!process.env.XAI_API_KEY;
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: requestId || undefined,
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
