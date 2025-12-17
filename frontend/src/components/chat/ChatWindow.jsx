import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '../ui/Button';

export const ChatWindow = ({ 
  isOpen, 
  onClose, 
  messages, 
  isLoading, 
  onSendMessage, 
  onClearChat,
  onExportChat,
  selectedModel 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-6 z-40 w-[500px] h-[700px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] 
                     glassmorphism rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                💙
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">NISRA</h3>
                <p className="text-white/80 text-xs">Your Mental Health Assistant</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportChat}
                className="text-white hover:bg-white/20"
                title="Export chat"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearChat}
                className="text-white hover:bg-white/20"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/50 to-white/30 dark:from-gray-900/50 dark:to-gray-900/30">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="space-y-4">
                  <div className="text-6xl">💙</div>
                  <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    Welcome to NISRA
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    I'm here to support you with mental health guidance. How can I help you today?
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                  🤖
                </div>
                <div className="glassmorphism rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80">
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};