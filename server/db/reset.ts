import { Request, Response } from 'express';
import { getDrizzle } from './index';
import { PgStorage } from './pg-storage';

export async function resetDatabase(req: Request, res: Response) {
  try {
    const pgStorage = new PgStorage();
    const reset = await pgStorage.resetDatabase();
    
    if (reset) {
      res.status(200).json({ 
        success: true, 
        message: 'Database reset successfully. Initial seed data has been loaded.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Database reset failed. Check server logs for details.' 
      });
    }
  } catch (error) {
    console.error('Error in resetDatabase route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred while resetting the database.', 
      error: String(error) 
    });
  }
}