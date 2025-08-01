import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Return basic enum values
  if (req.method === 'GET') {
    res.status(200).json({
      propertyTypes: ['apartment', 'house', 'villa', 'studio'],
      reservationStatus: ['pending', 'confirmed', 'cancelled', 'completed'],
      checkInStatus: ['pending', 'completed', 'no-show'],
      checkOutStatus: ['pending', 'completed', 'late'],
      cleaningStatus: ['pending', 'in-progress', 'completed']
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}