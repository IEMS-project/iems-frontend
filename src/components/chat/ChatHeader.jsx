import React from 'react';
import { FaRobot } from 'react-icons/fa';
import { bgColors, textColors } from '../../theme/colors';

const ChatHeader = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <FaRobot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          AI Assistant
        </h2>
        <p className="text-sm text-muted-foreground">
          Hỗ trợ bởi Qwen2.5 & RAG
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;