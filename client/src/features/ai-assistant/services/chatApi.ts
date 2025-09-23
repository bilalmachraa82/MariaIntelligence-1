import { ApiResponse } from '@/shared/types';
import { ChatMessage, ChatSession, AssistantCapability } from '../types';

const BASE_URL = '/api';

class ChatApiService {
  async sendMessage(sessionId: string | undefined, content: string): Promise<ApiResponse<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }>> {
    const response = await fetch(`${BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessions(): Promise<ApiResponse<ChatSession[]>> {
    const response = await fetch(`${BASE_URL}/chat/sessions`);

    if (!response.ok) {
      throw new Error(`Failed to fetch chat sessions: ${response.statusText}`);
    }

    return response.json();
  }

  async getSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    const response = await fetch(`${BASE_URL}/chat/sessions/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch chat session: ${response.statusText}`);
    }

    return response.json();
  }

  async createSession(title?: string): Promise<ApiResponse<ChatSession>> {
    const response = await fetch(`${BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat session: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat session: ${response.statusText}`);
    }

    return response.json();
  }

  async archiveSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    const response = await fetch(`${BASE_URL}/chat/sessions/${sessionId}/archive`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to archive chat session: ${response.statusText}`);
    }

    return response.json();
  }

  async getCapabilities(): Promise<ApiResponse<AssistantCapability[]>> {
    const response = await fetch(`${BASE_URL}/chat/capabilities`);

    if (!response.ok) {
      throw new Error(`Failed to fetch assistant capabilities: ${response.statusText}`);
    }

    return response.json();
  }

  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse<{ text: string }>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const response = await fetch(`${BASE_URL}/chat/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to transcribe audio: ${response.statusText}`);
    }

    return response.json();
  }
}

export const chatApi = new ChatApiService();