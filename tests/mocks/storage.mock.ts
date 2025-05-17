/**
 * Mock simplificado para os testes OCR
 * Foca apenas nas interfaces e métodos necessários para os testes OCR
 */

// Interface simplificada de Property
interface Property {
  id: number;
  name: string;
  aliases: string[];
}

// Implementação minimalista do mock de storage
export const storage = {
  // Property methods
  getProperties: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Test Property',
      aliases: ['Test Alias', 'Another Test Alias']
    },
    {
      id: 2,
      name: 'Second Property',
      aliases: ['Property 2', 'Casa na Praia']
    }
  ]),

  // Mock para getProperty
  getProperty: jest.fn((id: number) => {
    return storage.getProperties().then(properties => 
      properties.find(p => p.id === id)
    );
  }),

  // Mock para createActivity (usado em alguns testes)
  createActivity: jest.fn((activity: any) => {
    return Promise.resolve({
      id: 1,
      ...activity,
      createdAt: new Date().toISOString()
    });
  })
};

export default storage;
