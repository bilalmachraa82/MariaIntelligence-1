import request from 'supertest';
import { app } from '../server'; // Ajuste o caminho se necessário
import { AIAdapter } from '../server/services/ai-adapter.service'; // Ajuste o caminho
import * as reservationParser from '../server/parsers/parseReservations'; // Ajuste o caminho
import fs from 'fs';
import path from 'path';

// Mock das dependências
jest.mock('../server/services/ai-adapter.service');
jest.mock('../server/parsers/parseReservations');
jest.mock('fs'); // Mock fs para evitar operações reais no sistema de ficheiros

// Mock da instância do AIAdapter (se for singleton)
const mockExtractText = jest.fn();
AIAdapter.getInstance = jest.fn().mockReturnValue({
  extractTextFromPDF: mockExtractText
});

const mockParseReservationData = reservationParser.parseReservationData as jest.Mock;

// Criar um ficheiro de teste dummy (path) - supertest lê o path
const testPdfPath = path.resolve(__dirname, 'dummy-test-file.pdf'); // Usar path absoluto dummy
const testPdfBuffer = Buffer.from('dummy pdf content'); // Conteúdo para fs.readFileSync

describe('OCR Flow Tests - Synchronous POST /api/ocr', () => {

  beforeAll(() => {
    // Simular a existência do ficheiro para readFileSync dentro do controller
    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      // Verifica se o path que o controller tenta ler existe no mock
      // Nota: supertest.attach envia o ficheiro, mas o controller pode tentar reler
      if (filePath === 'uploads/some-generated-name.pdf') { // Exemplo - precisa corresponder ao path real que o controller lê
         return testPdfBuffer;
      }
      // Se não for o ficheiro esperado, lança erro ou retorna undefined
      throw new Error(`Mock fs.readFileSync: Path não esperado ${filePath}`);
    });
    // Mock unlinkSync para não dar erro quando o controller tenta apagar
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    // Mock existsSync para simular que o ficheiro existe temporariamente
     (fs.existsSync as jest.Mock).mockReturnValue(true);
     // Mock mkdirSync para simular criação de diretório
     (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

  });

  beforeEach(() => {
    // Resetar mocks antes de cada teste
    jest.clearAllMocks(); // Limpa todos os mocks

    // Restaurar mocks para comportamento padrão (sucesso)
     (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
        // Simula leitura bem-sucedida do ficheiro temporário criado pelo multer
        // O path real pode variar, mas o conteúdo é o que importa para o mock
        console.log(`Mock fs.readFileSync called with path: ${filePath}`); // Log para depuração
        return testPdfBuffer;
     });
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {
         console.log('Mock fs.unlinkSync called'); // Log para depuração
    });
     (fs.existsSync as jest.Mock).mockReturnValue(true);
     (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    mockExtractText.mockResolvedValue('Extracted dummy text');
    mockParseReservationData.mockReturnValue({
      success: true,
      data: { guestName: 'Test Guest', propertyName: 'Test Property' }, // Dados simulados
      errors: []
    });
  });

  test('should process PDF successfully and return extracted data', async () => {
    // supertest lida com a criação de um ficheiro temporário baseado no buffer
    const response = await request(app)
      .post('/api/ocr')
      .attach('file', testPdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.guestName).toBe('Test Guest');
    expect(mockExtractText).toHaveBeenCalled();
    expect(mockParseReservationData).toHaveBeenCalledWith('Extracted dummy text');
    // Verificar se o unlink foi chamado (limpeza)
    // expect(fs.unlinkSync).toHaveBeenCalled(); // Descomentar se quiser verificar a limpeza
  });

  test('should return 422 if no file is sent', async () => {
    const response = await request(app)
      .post('/api/ocr');

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Nenhum arquivo enviado');
  });

  test('should return 422 if file is not a PDF', async () => {
    const response = await request(app)
      .post('/api/ocr')
      .attach('file', Buffer.from('not a pdf'), { filename: 'test.txt', contentType: 'text/plain' });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Tipo de arquivo inválido');
     // Verificar se unlinkSync foi chamado para o ficheiro inválido
     expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test('should return 500 if text extraction fails', async () => {
    mockExtractText.mockRejectedValue(new Error('AI extraction failed'));

    const response = await request(app)
      .post('/api/ocr')
      .attach('file', testPdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Erro ao extrair texto');
  });

  test('should return 500 if data parsing fails', async () => {
    mockParseReservationData.mockImplementation(() => {
      throw new Error('Parsing logic failed');
    });

    const response = await request(app)
      .post('/api/ocr')
      .attach('file', testPdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(500); // O erro agora acontece no parseReservationData
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Erro ao analisar dados'); // Verifica a mensagem do catch no controller
  });

   test('should return 500 if reading file fails within controller', async () => {
    // Configurar readFileSync para falhar
     (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
         console.log(`Mock fs.readFileSync chamado para falhar com path: ${filePath}`);
        throw new Error('Failed to read file');
    });

    const response = await request(app)
      .post('/api/ocr')
      .attach('file', testPdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' }); // O attach funciona, mas o controller falha ao ler

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Erro ao ler o arquivo PDF');
  });

});