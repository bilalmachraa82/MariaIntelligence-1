
import { Mistral } from "@mistralai/mistralai";

export class MistralService {
  private client: Mistral;

  constructor() {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }
    this.client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY
    });
  }

  async extractTextFromPDF(pdfBase64: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em OCR. Extraia todo o texto visível deste documento PDF em base64 sem interpretações adicionais."
        },
        {
          role: "user",
          content: `Extraia o texto deste PDF:\n\n${pdfBase64}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  }

  async parseReservationData(text: string): Promise<any> {
    const response = await this.client.chat.completions.create({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em extrair dados estruturados de textos de reservas."
        },
        {
          role: "user",
          content: `Analise este texto de reserva e extraia as informações em formato JSON com os campos: propertyName, guestName, guestEmail, guestPhone, checkInDate (YYYY-MM-DD), checkOutDate (YYYY-MM-DD), numGuests, totalAmount, platform (airbnb/booking/direct/other), platformFee, cleaningFee, checkInFee, commissionFee, teamPayment.\n\n${text}`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async validateReservationData(data: any, propertyRules: any): Promise<any> {
    const response = await this.client.chat.completions.create({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em validação de dados de reservas."
        },
        {
          role: "user",
          content: `Valide estes dados de reserva contra as regras da propriedade e sugira correções se necessário:\n\nDados: ${JSON.stringify(data)}\n\nRegras: ${JSON.stringify(propertyRules)}`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
