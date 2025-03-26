
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  async generateStructuredResponse(prompt: string, schema: any) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        tools: [{
          functionDeclarations: [schema]
        }]
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async analyzeAudio(audioBytes: Buffer, prompt: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'audio/wav', data: audioBytes.toString('base64') } }
            ]
          }
        ]
      });
      return result.response.text();
    } catch (error) {
      console.error('Gemini Audio API error:', error);
      throw error;
    }
}

async analyzeImage(imageBytes: Buffer, prompt: string) {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-pro-vision",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 4096,
      }
    });
    
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: imageBytes.toString('base64') } }
            ]
          }
        ]
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Vision API error:', error);
      throw error;
    }
  }
}
