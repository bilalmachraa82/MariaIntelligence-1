export const storage = {
  getProperties: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Test Property',
      aliases: ['Test Alias', 'Another Test Alias']
    },
    {
      id: 2,
      name: 'Second Property',
      aliases: ['Property 2']
    }
  ])
};

export default storage;
