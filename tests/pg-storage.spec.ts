import { PgStorage } from '../server/db/pg-storage';
import { activities } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Mock do getDrizzle
jest.mock('../server/db/index', () => ({
  getDrizzle: jest.fn(() => mockDb)
}));

// Mock do objeto db
const mockDb = {
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  select: jest.fn().mockReturnThis(),
  execute: jest.fn()
};

describe('PgStorage', () => {
  let pgStorage: PgStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    pgStorage = new PgStorage();
  });

  describe('deleteActivity', () => {
    test('should delete activity and return true if successful', async () => {
      // Mock para retornar um resultado bem-sucedido
      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      const result = await pgStorage.deleteActivity(1);

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledWith(activities);
      expect(mockDb.where).toHaveBeenCalledWith(eq(activities.id, 1));
      expect(mockDb.returning).toHaveBeenCalled();
    });

    test('should return false if activity does not exist', async () => {
      // Mock para retornar um array vazio (nenhum registro encontrado)
      mockDb.returning.mockResolvedValue([]);

      const result = await pgStorage.deleteActivity(999);

      expect(result).toBe(false);
      expect(mockDb.delete).toHaveBeenCalledWith(activities);
      expect(mockDb.where).toHaveBeenCalledWith(eq(activities.id, 999));
      expect(mockDb.returning).toHaveBeenCalled();
    });

    test('should handle errors and return false', async () => {
      // Mock para lançar um erro
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await pgStorage.deleteActivity(1);

      expect(result).toBe(false);
      expect(mockDb.delete).toHaveBeenCalledWith(activities);
      expect(mockDb.where).toHaveBeenCalledWith(eq(activities.id, 1));
      expect(mockDb.returning).toHaveBeenCalled();
    });
  });

  describe('getMaintenanceActivities', () => {
    test('should return maintenance activities for a property', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const propertyId = 1;
      
      const mockActivities = [
        {
          id: 1,
          description: JSON.stringify({ cost: 100, details: 'Repair' }),
          created_at: '2023-06-15T10:00:00Z',
          type: 'maintenance_requested',
          entity_type: 'property',
          entity_id: propertyId
        }
      ];
      
      mockDb.execute.mockResolvedValue(mockActivities);
      
      const result = await pgStorage.getMaintenanceActivities(propertyId, startDate, endDate);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].maintenanceCost).toBe(100);
      expect(mockDb.execute).toHaveBeenCalled();
    });
    
    test('should handle invalid JSON in description', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const propertyId = 1;
      
      const mockActivities = [
        {
          id: 1,
          description: 'Not a valid JSON',
          created_at: '2023-06-15T10:00:00Z',
          type: 'maintenance_requested',
          entity_type: 'property',
          entity_id: propertyId
        }
      ];
      
      mockDb.execute.mockResolvedValue(mockActivities);
      
      const result = await pgStorage.getMaintenanceActivities(propertyId, startDate, endDate);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].maintenanceCost).toBe(0); // Deve ser 0 quando o JSON é inválido
      expect(mockDb.execute).toHaveBeenCalled();
    });
    
    test('should handle errors and return empty array', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const propertyId = 1;
      
      mockDb.execute.mockRejectedValue(new Error('Database error'));
      
      const result = await pgStorage.getMaintenanceActivities(propertyId, startDate, endDate);
      
      expect(result).toEqual([]);
      expect(mockDb.execute).toHaveBeenCalled();
    });
  });
});
