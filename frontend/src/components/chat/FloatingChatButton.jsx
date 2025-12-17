import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

export const FloatingChatButton = ({ isOpen, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        fixed bottom-6 right-6 z-50
        w-16 h-16 rounded-full
        bg-gradient-to-r from-primary-500 to-purple-500
        text-white shadow-2xl
        flex items-center justify-center
        transition-all duration-300
        ${isOpen ? 'rotate-90' : 'rotate-0'}
      `}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      {isOpen ? (
        <X className="w-8 h-8" />
      ) : (
        <MessageCircle className="w-8 h-8" />
      )}
      
      {/* Notification dot */}
      {!isOpen && (
        <motion.span
          className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </motion.button>
  );
};