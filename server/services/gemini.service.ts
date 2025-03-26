
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY não configurada');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.2,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 8192,
      }
    });
  }

  async extractTextFromPDF(pdfBase64: string): Promise<string> {
    const result = await this.model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Extraia o texto deste PDF:' },
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }
          ]
        }
      ]
    });
    return result.response.text();
  }

  async extractTextFromImage(imageBase64: string, mimeType: string): Promise<string> {
    const visionModel = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const result = await visionModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Extraia o texto desta imagem:' },
            { inlineData: { mimeType, data: imageBase64 } }
          ]
        }
      ]
    });
    return result.response.text();
  }

  async validateReservationData(data: any, context: any): Promise<any> {
    const prompt = `
      Valide os seguintes dados de reserva no contexto fornecido:
      Dados: ${JSON.stringify(data)}
      Contexto: ${JSON.stringify(context)}
    `;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    });

    return JSON.parse(result.response.text());
  }

  // Função auxiliar para function calling estruturado
  async structuredFunctionCall(functionName: string, parameters: any): Promise<any> {
    const result = await this.model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ 
            text: `Execute a função ${functionName} com os parâmetros: ${JSON.stringify(parameters)}`
          }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_DANGEROUS',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });

    return JSON.parse(result.response.text());
  }
}
