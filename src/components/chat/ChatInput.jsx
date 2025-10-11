import React, { useState } from 'react';
import { FaPaperPlane, FaSpinner, FaPlus, FaMicrophone, FaEllipsisV } from 'react-icons/fa';

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
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 relative">
        {/* Plus icon on the left */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Thêm tệp đính kèm"
          >
            <FaPlus className="w-4 h-4" />
          </button>
        </div>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Hỏi bất kỳ điều gì..."
          className="w-full pl-10 pr-20 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none transition-colors"
          rows="1"
          disabled={isLoading || disabled}
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        
        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* Microphone icon */}
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Ghi âm"
          >
            <FaMicrophone className="w-4 h-4" />
          </button>
          
          {/* Send button or loading */}
          {message.trim() ? (
            <button
              type="submit"
              disabled={isLoading || disabled}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title="Gửi tin nhắn"
            >
              {isLoading ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaPaperPlane className="w-4 h-4" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Tùy chọn"
            >
              <FaEllipsisV className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
