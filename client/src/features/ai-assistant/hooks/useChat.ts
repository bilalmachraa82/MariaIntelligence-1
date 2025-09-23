import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/chatApi';
import { ChatMessage, ChatSession, MessageRole, VoiceRecording } from '../types';

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => sessionId ? chatApi.getSession(sessionId) : null,
    enabled: !!sessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(sessionId, content),
    onMutate: (content: string) => {
      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content,
        role: MessageRole.USER,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setCurrentInput('');
      setIsTyping(true);
    },
    onSuccess: (response) => {
      setMessages(prev => {
        // Remove temporary message and add real response
        const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
        return [...filtered, response.data.userMessage, response.data.assistantMessage];
      });
      setIsTyping(false);
      scrollToBottom();
    },
    onError: () => {
      setIsTyping(false);
      // Remove optimistic update on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(content);
  }, [sendMessageMutation]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    currentInput,
    setCurrentInput,
    sendMessage,
    clearChat,
    messagesEndRef,
    session: session?.data,
    sessionLoading,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}

export function useChatSessions() {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatApi.getSessions(),
  });

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => chatApi.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  const archiveSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatApi.archiveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  return {
    sessions: sessions?.data || [],
    isLoading,
    createSession: createSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    archiveSession: archiveSessionMutation.mutate,
    isCreating: createSessionMutation.isPending,
  };
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const recording: VoiceRecording = {
          id: `recording-${Date.now()}`,
          audioBlob,
          duration: 0, // Calculate duration if needed
          timestamp: new Date(),
        };
        setRecording(recording);

        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setRecording(null);
  }, []);

  return {
    isRecording,
    recording,
    startRecording,
    stopRecording,
    clearRecording,
  };
}