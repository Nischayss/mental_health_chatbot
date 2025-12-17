import { useState, useRef } from 'react';
import { Send, Mic } from 'lucide-react';
import { Button } from '../ui/Button';

export const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind..."
          className="w-full px-4 py-3 pr-12 rounded-2xl resize-none
                   bg-white dark:bg-gray-800 
                   border border-gray-300 dark:border-gray-600
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-gray-900 dark:text-white placeholder-gray-400
                   transition-all duration-200"
          rows={1}
          maxLength={1000}
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-3 bottom-3 text-gray-400 hover:text-primary-500 transition-colors"
          title="Voice input (coming soon)"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>
      <Button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="px-4 rounded-2xl"
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
};