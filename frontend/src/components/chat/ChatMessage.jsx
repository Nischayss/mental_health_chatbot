import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export const ChatMessage = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser 
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
          : 'bg-gradient-to-r from-primary-500 to-purple-500'
        }
        text-white text-lg
      `}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`
          rounded-2xl px-4 py-3 max-w-[85%]
          ${isUser 
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-sm' 
            : 'glassmorphism text-gray-900 dark:text-white rounded-bl-sm'
          }
        `}>
          {/* Type Badge */}
          {!isUser && message.type && message.type !== 'general' && (
            <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
              {message.type.replace(/_/g, ' ').toUpperCase()}
            </div>
          )}

          {/* Message Text */}
          <div className="whitespace-pre-wrap break-words">
            {formatMessage(message.text)}
          </div>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                📚 Sources:
              </div>
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0 text-primary-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {source.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {source.displayUrl}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Confidence Score */}
          {!isUser && message.confidence && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Confidence: {Math.round(message.confidence * 100)}%
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to format message text
const formatMessage = (text) => {
  if (!text) return '';
  
  // Convert markdown-style formatting
  return text
    .split('\n')
    .map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Headers
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-lg font-bold mt-3 mb-2">{line.slice(3)}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-base font-bold mt-2 mb-1">{line.slice(4)}</h4>;
      }
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} className="mb-1" />;
    });
};