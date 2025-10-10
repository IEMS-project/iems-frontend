import React, { useState, useEffect } from 'react';
import { FaRobot, FaCircle, FaExclamationTriangle } from 'react-icons/fa';
import chatbotService from '../../services/chatbotService';

const ChatHeader = () => {
  const [status, setStatus] = useState({ chatbot_ready: false, status: 'checking' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const statusData = await chatbotService.getStatus();
        setStatus(statusData);
      } catch (error) {
        console.error('Failed to check chatbot status:', error);
        setStatus({ chatbot_ready: false, status: 'error' });
      }
    };

    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (status.chatbot_ready) return 'text-green-500';
    if (status.status === 'error') return 'text-red-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (status.chatbot_ready) return 'Sẵn sàng';
    if (status.status === 'error') return 'Lỗi kết nối';
    if (status.status === 'checking') return 'Đang kiểm tra...';
    return 'Không sẵn sàng';
  };

  const getStatusIcon = () => {
    if (status.status === 'error') return <FaExclamationTriangle className="w-3 h-3" />;
    return <FaCircle className="w-3 h-3" />;
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <FaRobot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            📄 Tài liệu
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            🤖 Qwen2.5
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
