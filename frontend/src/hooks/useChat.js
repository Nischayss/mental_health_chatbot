import { useState, useCallback } from 'react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('training');

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(text.trim(), selectedModel);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.response || response.message || 'I received your message.',
        sender: 'bot',
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages(prev => [...prev, botMessage]);
      toast.success('Response received!');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to get response');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  const clearChat = useCallback(() => {
    setMessages([]);
    toast.success('Chat cleared!');
  }, []);

  const exportChat = useCallback(() => {
    const chatText = messages
      .map(msg => `[${msg.sender.toUpperCase()}]: ${msg.text}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nisra-chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Chat exported!');
  }, [messages]);

  return {
    messages,
    isLoading,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearChat,
    exportChat,
  };
};