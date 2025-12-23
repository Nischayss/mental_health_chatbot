import { motion } from 'framer-motion';
import { ExternalLink, FileText, Globe } from 'lucide-react';

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

          {/* Sources - ENHANCED VERSION */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                📚 Sources ({message.sources.length}):
              </div>
              
              {message.sources.map((source, index) => {
                // Determine source type and styling
                const isRAGLocal = source.type === 'rag_local';
                const isWebSource = source.type === 'web_augmented' || source.type === 'web_search';
                
                return (
                  <div
                    key={index}
                    className={`
                      block p-3 rounded-lg transition-all duration-200
                      ${isRAGLocal 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : isWebSource
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                      }
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {/* Icon based on source type */}
                      <div className="mt-1">
                        {isRAGLocal ? (
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : isWebSource ? (
                          <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-primary-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className={`
                          text-sm font-semibold mb-1
                          ${isRAGLocal 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : isWebSource
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-gray-900 dark:text-white'
                          }
                        `}>
                          {source.title}
                        </div>
                        
                        {/* CSV File Info - ENHANCED FOR RAG */}
                        {isRAGLocal && (
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                              📄 {source.displayUrl}
                            </div>
                            {source.match_score && (
                              <div className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded font-semibold">
                                Match: {source.match_score}
                              </div>
                            )}
                            {source.confidence !== undefined && (
                              <div className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded font-semibold">
                                {Math.round(source.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Web URL - For web sources */}
                        {isWebSource && source.url !== '#local' && (
                          <a 
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-700 dark:text-green-300 hover:underline flex items-center gap-1 mb-2"
                          >
                            {source.displayUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        
                        {/* Snippet */}
                        {source.snippet && (
                          <div className={`
                            text-xs leading-relaxed
                            ${isRAGLocal 
                              ? 'text-blue-800 dark:text-blue-200' 
                              : isWebSource
                              ? 'text-green-800 dark:text-green-200'
                              : 'text-gray-600 dark:text-gray-400'
                            }
                          `}>
                            {source.snippet}
                          </div>
                        )}
                        
                        {/* Source Type Badge */}
                        <div className="mt-2 flex items-center gap-2">
                          {isRAGLocal && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              📊 Knowledge Base
                            </span>
                          )}
                          {isWebSource && (
                            <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                              🌐 Web Augmented
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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