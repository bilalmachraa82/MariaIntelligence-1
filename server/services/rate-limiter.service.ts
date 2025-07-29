/**
 * Serviço de controle de taxa (rate limiting) para APIs externas
 * 
 * Este serviço implementa mecanismos para gerenciar requisições a APIs
 * com limites de taxa, como a API do Gemini que permite 5 consultas por minuto.
 * 
 * Recursos:
 * - Cache de respostas para evitar repetir requisições idênticas
 * - Sistema de fila para distribuir requisições ao longo do tempo
 * - Controle de taxa com retry automático quando o limite é atingido
 */

import crypto from 'crypto';

// Tipo para uma função que será executada com controle de taxa
export type RateLimitedFunction<T> = (...args: any[]) => Promise<T>;

// Interface para o cache de resposta
interface CacheEntry {
  result: any;
  timestamp: number;
  expiresAt: number;
}

// Interface para item da fila
interface QueueItem {
  id: string;
  fn: Function;
  args: any[];
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
  retryCount: number;
}

/**
 * Implementação simples de um cache LRU (Least Recently Used)
 */
class SimpleCache<K, V> {
  private cache: Map<K, V>;
  private keys: K[] = [];
  private timeouts: Map<K, NodeJS.Timeout> = new Map();
  private readonly maxSize: number;

  constructor(options: { max: number }) {
    this.maxSize = options.max;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Mover a chave para o final (mais recentemente usada)
      this.keys = this.keys.filter(k => k !== key);
      this.keys.push(key);
    }
    return value;
  }

  set(key: K, value: V, ttl?: number): void {
    // Se o cache estiver cheio, remover a entrada menos usada recentemente
    if (this.keys.length >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.keys.shift();
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        const timeout = this.timeouts.get(oldestKey);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(oldestKey);
        }
      }
    }

    // Se a chave já existe, remover da lista para adicioná-la novamente
    if (this.cache.has(key)) {
      this.keys = this.keys.filter(k => k !== key);
      const oldTimeout = this.timeouts.get(key);
      if (oldTimeout) {
        clearTimeout(oldTimeout);
        this.timeouts.delete(key);
      }
    }

    // Adicionar nova entrada
    this.cache.set(key, value);
    this.keys.push(key);

    // Configurar timeout para TTL se especificado
    if (ttl && ttl > 0) {
      const timeout = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timeouts.set(key, timeout);
    }
  }

  delete(key: K): boolean {
    this.keys = this.keys.filter(k => k !== key);
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    this.keys = [];
    // Use Array.from para converter o iterador para um array
    Array.from(this.timeouts.values()).forEach(timeout => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();
    this.cache.clear();
  }

  getKeys(): K[] {
    return [...this.keys];
  }
}

export class RateLimiterService {
  private static instance: RateLimiterService;

  // Cache para armazenar respostas e evitar chamadas repetidas
  private cache: SimpleCache<string, CacheEntry>;
  
  // Sistema de fila para requisições
  private queue: QueueItem[] = [];
  private isProcessingQueue: boolean = false;
  
  // Configurações de controle de taxa
  private requestsPerMinute: number = 5; // Gemini: 5 requisições por minuto
  private requestTimestamps: number[] = [];
  private maxRetries: number = 3;
  
  // Flag para cache e filas
  private cacheEnabled: boolean = true;
  private queueEnabled: boolean = true;

  private constructor() {
    // Inicializa o cache com tamanho máximo de 100 itens
    this.cache = new SimpleCache<string, CacheEntry>({
      max: 100
    });
    
    // Limpar requestTimestamps a cada minuto
    setInterval(() => {
      const oneMinuteAgo = Date.now() - 60 * 1000;
      this.requestTimestamps = this.requestTimestamps.filter(
        timestamp => timestamp > oneMinuteAgo
      );
    }, 60 * 1000);
  }

  /**
   * Obtém a instância única do serviço
   */
  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  /**
   * Configura os limites de taxa
   * @param requestsPerMinute Máximo de requisições por minuto
   * @param maxRetries Número máximo de tentativas em caso de falha
   */
  public configure(
    requestsPerMinute: number = 5,
    maxRetries: number = 3
  ): void {
    this.requestsPerMinute = requestsPerMinute;
    this.maxRetries = maxRetries;
  }

  /**
   * Habilita ou desabilita o cache
   * @param enabled Status do cache
   */
  public enableCache(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }

  /**
   * Habilita ou desabilita o sistema de filas
   * @param enabled Status do sistema de filas
   */
  public enableQueue(enabled: boolean): void {
    this.queueEnabled = enabled;
  }

  /**
   * Limpa o cache completamente
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Enfileira uma função para execução com controle de taxa
   * @param fn Função a ser executada
   * @param args Argumentos da função
   * @param priority Prioridade na fila (maior = mais prioritário)
   * @returns Resultado da função
   */
  private async enqueue<T>(
    fn: Function,
    args: any[],
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Gerar ID único para o item da fila
      const id = crypto.randomUUID();
      
      // Criar item da fila
      const queueItem: QueueItem = {
        id,
        fn,
        args,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      // Adicionar à fila
      this.queue.push(queueItem);
      
      // Ordenar fila por prioridade e timestamp
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Maior prioridade primeiro
        }
        return a.timestamp - b.timestamp; // FIFO para mesma prioridade
      });
      
      // Iniciar processamento se não estiver em andamento
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Processa a fila de requisições
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Verifica se pode fazer requisição (limite de taxa)
    if (this.canMakeRequest()) {
      const item = this.queue.shift();
      
      if (!item) {
        this.isProcessingQueue = false;
        return;
      }
      
      try {
        // Registrar timestamp da requisição
        this.requestTimestamps.push(Date.now());
        
        // Executar função
        const result = await item.fn(...item.args);
        item.resolve(result);
      } catch (error: any) {
        // Verificar se é erro de limite de taxa
        if (
          error.message?.includes('rate limit') ||
          error.message?.includes('quota exceeded') ||
          error.message?.includes('too many requests') ||
          error.status === 429
        ) {
          console.warn(`Rate limit atingido. Esperando antes de tentar novamente (tentativa ${item.retryCount + 1}/${this.maxRetries})`);
          
          // Tentar novamente se não excedeu o máximo de tentativas
          if (item.retryCount < this.maxRetries) {
            // Incrementar contador de tentativas e colocar de volta na fila
            item.retryCount++;
            // Aumentar prioridade para garantir que seja processado em breve
            item.priority += 1;
            this.queue.unshift(item);
            
            // Esperar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, this.calculateBackoff(item.retryCount)));
          } else {
            // Excedeu o máximo de tentativas
            item.reject(new Error(`Limite de tentativas excedido após ${this.maxRetries} tentativas: ${error.message}`));
          }
        } else {
          // Outros erros, rejeitar diretamente
          item.reject(error);
        }
      }
    } else {
      // Não pode fazer requisição agora, esperar
      const waitTime = this.calculateWaitTime();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Processar próximo item da fila
    setImmediate(() => this.processQueue());
  }

  /**
   * Verifica se uma nova requisição pode ser feita
   * @returns Verdadeiro se uma requisição pode ser feita
   */
  private canMakeRequest(): boolean {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    return recentRequests.length < this.requestsPerMinute;
  }

  /**
   * Calcula o tempo de espera necessário para fazer uma nova requisição
   * @returns Tempo de espera em milissegundos
   */
  private calculateWaitTime(): number {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    if (recentRequests.length < this.requestsPerMinute) {
      return 0;
    }
    
    // Ordenar timestamps do mais antigo para o mais recente
    const sortedTimestamps = [...recentRequests].sort((a, b) => a - b);
    
    // Calcular quando o request mais antigo dentro do limite vai "expirar"
    const oldestTimestamp = sortedTimestamps[sortedTimestamps.length - this.requestsPerMinute];
    const timeUntilAvailable = (oldestTimestamp + 60 * 1000) - Date.now();
    
    // Garantir que o tempo de espera seja pelo menos 100ms
    return Math.max(timeUntilAvailable + 100, 100);
  }

  /**
   * Calcula o tempo de backoff exponencial para retentativas
   * @param retryCount Número da tentativa atual
   * @returns Tempo de espera em milissegundos
   */
  private calculateBackoff(retryCount: number): number {
    // Backoff exponencial com jitter
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    
    // Cálculo do backoff exponencial: baseDelay * 2^retryCount
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    
    // Adicionar jitter (variação aleatória) para evitar sincronização
    const jitter = Math.random() * 1000;
    
    // Limitar ao atraso máximo
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Gera uma chave de cache para os argumentos da função
   * @param args Argumentos da função
   * @returns Chave de cache
   */
  private generateCacheKey(methodName: string, args: any[]): string {
    // Verificar se há timestamps no conteúdo e removê-los para o cache
    // Isso evita que o timestamp adicionado para evitar colisões de cache
    // afete a geração da chave de cache
    const processedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        // Remove linhas contendo "Timestamp:" seguido de números
        return arg.replace(/Timestamp: \d+/g, '');
      }
      return arg;
    });
    
    // Converter argumentos para string JSON e fazer hash
    try {
      const argsJson = JSON.stringify(processedArgs);
      return `${methodName}:${crypto
        .createHash('md5')
        .update(argsJson)
        .digest('hex')}`;
    } catch (error) {
      // Se não for possível converter para JSON, usar string simples dos argumentos
      return `${methodName}:${processedArgs.map(arg => String(arg)).join('|')}`;
    }
  }

  /**
   * Executa uma função com controle de taxa e cache
   * @param fn Função a ser executada
   * @param methodName Nome do método para identificação no cache
   * @param cacheTTL Tempo de vida do cache em milissegundos
   * @returns Função com controle de taxa
   */
  public rateLimitedFunction<T>(
    fn: RateLimitedFunction<T>,
    methodName: string,
    cacheTTL: number = 5 * 60 * 1000 // 5 minutos por padrão
  ): RateLimitedFunction<T> {
    return async (...args: any[]): Promise<T> => {
      // Gerar chave de cache
      const cacheKey = this.generateCacheKey(methodName, args);
      
      // Verificar cache, se habilitado
      if (this.cacheEnabled) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult && cachedResult.expiresAt > Date.now()) {
          console.log(`Cache hit para ${methodName}`);
          return cachedResult.result;
        }
      }
      
      let result: T;
      
      // Executar função com controle de taxa
      if (this.queueEnabled) {
        // Colocar na fila para controle de taxa
        result = await this.enqueue<T>(fn, args);
      } else {
        // Executar diretamente
        result = await fn(...args);
      }
      
      // Armazenar no cache
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          expiresAt: Date.now() + cacheTTL
        });
      }
      
      return result;
    };
  }
  
  /**
   * Limpa entradas de cache específicas baseadas em um padrão de método
   * @param methodPattern Padrão de nome de método para limpar (ex: "generateText")
   */
  public clearCacheByMethod(methodPattern: string): void {
    // Percorrer todas as chaves do cache e remover as que correspondem ao padrão
    for (const key of this.cache.getKeys()) {
      if (key.startsWith(methodPattern + ":")) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Método auxiliar para programar a execução de uma função com controle de taxa
   * @param fn Função a ser executada
   * @param methodName Nome do método opcional para identificação no cache (gerado automaticamente se não fornecido)
   * @param cacheTTL Tempo de vida do cache em milissegundos (padrão: 5 minutos)
   * @returns Resultado da função
   */
  public async schedule<T>(
    fn: () => Promise<T>,
    methodName: string = `method_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cacheTTL: number = 5 * 60 * 1000
  ): Promise<T> {
    // Usar a função com controle de taxa já implementada
    const rateLimitedFn = this.rateLimitedFunction<T>(
      fn,
      methodName,
      cacheTTL
    );
    
    // Executar a função e retornar o resultado
    return await rateLimitedFn();
  }
  
  /**
   * Verifica o status atual do limite de taxa
   * @returns Informações sobre o status atual
   */
  public getRateLimitStatus(): {
    recentRequests: number;
    maxRequestsPerMinute: number;
    queueSize: number;
    canMakeRequest: boolean;
    estimatedWaitTime: number;
  } {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    ).length;
    
    return {
      recentRequests,
      maxRequestsPerMinute: this.requestsPerMinute,
      queueSize: this.queue.length,
      canMakeRequest: this.canMakeRequest(),
      estimatedWaitTime: this.calculateWaitTime()
    };
  }
}

// Exporta singleton para uso global
export const rateLimiter = RateLimiterService.getInstance();