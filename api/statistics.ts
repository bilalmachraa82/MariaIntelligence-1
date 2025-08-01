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

  // Return basic statistics structure
  if (req.method === 'GET') {
    res.status(200).json({
      totalCheckIns: 0,
      totalCheckOuts: 0,
      totalReservations: 0,
      totalProperties: 0,
      totalOwners: 0,
      upcomingCheckIns: 0,
      upcomingCheckOuts: 0,
      occupancyRate: 0
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}