import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { RESPONSE_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';

export const ModelSelector = ({ selectedModel, onSelectModel }) => {
  const handleSelect = (modelId) => {
    onSelectModel(modelId);
    const model = Object.values(RESPONSE_TYPES).find(m => m.id === modelId);
    toast.success(`✨ You're now using: ${model.name}`, {
      icon: model.icon,
      duration: 3000,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-3">
          Choose Your Response Model
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select how NISRA should respond to your questions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(RESPONSE_TYPES).map((model) => {
          const isSelected = selectedModel === model.id;
          
          return (
            <motion.div
              key={model.id}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(model.id)}
              className={`
                relative cursor-pointer rounded-2xl p-6 
                transition-all duration-300
                ${isSelected 
                  ? `${model.bgColor} border-2 ${model.borderColor} shadow-lg` 
                  : 'glassmorphism border hover:border-primary-300 dark:hover:border-primary-600'
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <CheckCircle2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </motion.div>
              )}

              {/* Icon */}
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-4
                bg-gradient-to-br ${model.color}
                ${isSelected ? 'animate-float' : ''}
              `}>
                {model.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {model.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {model.description}
              </p>

              {/* Glow effect when selected */}
              {isSelected && (
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${model.color} opacity-20 blur-xl -z-10`}
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected Model Info */}
      {selectedModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glassmorphism">
            <span className="text-2xl">
              {Object.values(RESPONSE_TYPES).find(m => m.id === selectedModel)?.icon}
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Currently using: {Object.values(RESPONSE_TYPES).find(m => m.id === selectedModel)?.name}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};