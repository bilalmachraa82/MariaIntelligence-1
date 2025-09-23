export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface MessageMetadata {
  typing?: boolean;
  error?: boolean;
  sources?: string[];
  actions?: SuggestedAction[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  type: ActionType;
  data?: any;
}

export enum ActionType {
  CREATE_RESERVATION = 'create_reservation',
  VIEW_PROPERTY = 'view_property',
  SEND_EMAIL = 'send_email',
  GENERATE_REPORT = 'generate_report',
  SCHEDULE_MAINTENANCE = 'schedule_maintenance',
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
}

export interface AssistantCapability {
  id: string;
  name: string;
  description: string;
  examples: string[];
  category: CapabilityCategory;
}

export enum CapabilityCategory {
  RESERVATIONS = 'reservations',
  PROPERTIES = 'properties',
  ANALYTICS = 'analytics',
  MAINTENANCE = 'maintenance',
  COMMUNICATION = 'communication',
  GENERAL = 'general',
}

export interface VoiceRecording {
  id: string;
  audioBlob: Blob;
  duration: number;
  timestamp: Date;
}

export interface AssistantPreferences {
  voiceEnabled: boolean;
  language: string;
  responseStyle: 'concise' | 'detailed' | 'friendly';
  suggestionsEnabled: boolean;
  contextRetention: number; // days
}