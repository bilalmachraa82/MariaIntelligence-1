import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import winston from 'winston';

// Configuração do Logger Winston (exemplo básico)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// Configuração da conexão Redis
// Certifique-se de que REDIS_URL está definido no seu .env
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Permite que o BullMQ controle os retries
});

connection.on('connect', () => {
  logger.info('Conectado ao Redis para BullMQ');
});

connection.on('error', (err) => {
  logger.error('Erro na conexão Redis para BullMQ:', err);
});

// Nome da fila
const OCR_QUEUE_NAME = 'ocr-processing';

// Criar a fila
export const ocrQueue = new Queue(OCR_QUEUE_NAME, { connection });

logger.info(`Fila OCR "${OCR_QUEUE_NAME}" inicializada.`);

// Definir o tipo de dados do job (opcional, mas bom para type safety)
interface OcrJobData {
  fileId: string; // ID do arquivo a ser processado
  pdfBase64: string;
  provider: string;
  originalFileName?: string;
}

// Criar o worker para processar jobs da fila
// A lógica de processamento real do OCR será implementada aqui ou chamada a partir daqui
export const ocrWorker = new Worker<OcrJobData>(
  OCR_QUEUE_NAME,
  async (job: Job<OcrJobData>) => {
    logger.info(`Processando job OCR ID: ${job.id}, Arquivo: ${job.data.originalFileName || job.data.fileId}`);
    try {
      // TODO: Implementar a lógica de processamento de OCR aqui
      // Exemplo:
      // const { pdfBase64, provider, fileId, originalFileName } = job.data;
      // const aiAdapter = AIAdapter.getInstance(); // Supondo que AIAdapter está acessível
      // const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider as any);
      // const parsedData = await parseReservationData(extractedText);
      // Salvar resultados, etc.

      logger.info(`Job OCR ID: ${job.id} concluído com sucesso.`);
      return { success: true, data: `Resultado do processamento para ${job.data.originalFileName || job.data.fileId}` };
    } catch (error) {
      logger.error(`Erro ao processar job OCR ID: ${job.id}`, error);
      // Lançar o erro para que o BullMQ possa lidar com retries conforme configurado na fila
      throw error; 
    }
  },
  { connection }
);

ocrWorker.on('completed', (job, result) => {
  if (job) {
    logger.info(`Job ${job.id} completado com resultado:`, result);
  } else {
    logger.info('Um job foi completado, mas o objeto job não está disponível no callback.');
  }
});

ocrWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Job ${job.id} falhou com erro: ${err.message}`, err);
  } else {
    logger.error(`Um job falhou (ID não disponível no callback) com erro: ${err.message}`, err);
  }
});

logger.info('Worker OCR configurado e escutando jobs.');

// Função para adicionar um novo job à fila
export async function addOcrJob(data: OcrJobData) {
  try {
    const job = await ocrQueue.add('process-ocr-file', data, {
      attempts: 3, // Número de tentativas em caso de falha
      backoff: {
        type: 'exponential', // Estratégia de backoff
        delay: 1000, // Atraso inicial em ms
      },
    });
    logger.info(`Job OCR adicionado à fila com ID: ${job.id} para o arquivo ${data.originalFileName || data.fileId}`);
    return job;
  } catch (error) {
    logger.error('Erro ao adicionar job OCR à fila:', error);
    throw error;
  }
}

// Exemplo de como fechar as conexões (útil para graceful shutdown)
export async function closeOcrQueue() {
  await ocrQueue.close();
  await ocrWorker.close();
  await connection.quit();
  logger.info('Fila OCR e worker fechados.');
}
