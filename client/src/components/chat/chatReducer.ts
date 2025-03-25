export type ChatEvent = {
  // ... existing ChatEvent properties
};

export type ChatAction = 
  | { type: 'UPDATE_CHAT'; payload: ChatEvent }
  | { type: 'RESET_CHAT' }
  | { type: 'CHAT_ERROR'; payload: string };

// ... rest of the reducer and related code