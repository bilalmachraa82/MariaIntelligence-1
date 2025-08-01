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

  // Return dashboard data structure
  if (req.method === 'GET') {
    res.status(200).json({
      upcomingCheckIns: [],
      upcomingCheckOuts: [],
      recentActivities: [],
      stats: {
        totalCheckIns: 0,
        totalCheckOuts: 0,
        pendingReservations: 0,
        occupiedProperties: 0
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}