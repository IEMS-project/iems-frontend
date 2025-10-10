import React, { useState } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

const ChatInput = ({ onSendMessage, isLoading = false, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            rows="1"
            disabled={isLoading || disabled}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaPaperPlane className="w-4 h-4" />
          )}
        </button>
      </form>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Nhấn Enter để gửi, Shift+Enter để xuống dòng
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            AI Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
