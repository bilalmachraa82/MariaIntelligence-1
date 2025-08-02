import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variable or request header
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || req.headers['x-gemini-api-key'];
    
    if (!apiKey) {
      return res.status(200).json({ 
        isValid: false, 
        configured: false,
        message: 'No API key configured' 
      });
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to get a model to verify the key is valid
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Test the API key with a simple request
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      });
      
      // If we get here, the key is valid
      return res.status(200).json({ 
        isValid: true, 
        configured: true,
        message: 'API key is valid' 
      });
    } catch (error) {
      // If the API call fails, the key is invalid
      return res.status(200).json({ 
        isValid: false, 
        configured: true,
        message: 'API key is invalid or expired' 
      });
    }
  } catch (error) {
    console.error('Error checking Gemini key:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}