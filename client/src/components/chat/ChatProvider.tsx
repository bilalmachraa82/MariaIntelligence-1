const handleChatEvent = (event) => {
  try {
    if (!event) {
      console.warn('Received empty chat event');
      return;
    }
    dispatch({ type: 'UPDATE_CHAT', payload: event });
  } catch (error) {
    console.error('Error handling chat event:', error);
    dispatch({ type: 'CHAT_ERROR', payload: error.message });
  }
};