// Simple test API endpoint
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Test API called successfully');
    
    res.status(200).json({ 
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      body: req.body
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ 
      message: 'Test API error',
      error: error.message 
    });
  }
} 