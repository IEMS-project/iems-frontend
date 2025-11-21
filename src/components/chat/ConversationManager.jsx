import React, { useState, useEffect } from 'react';
import { FaComments, FaCog, FaBrain, FaPlus, FaBars } from 'react-icons/fa';
import ConversationList from './ConversationList';
import MemoryPanel from './MemoryPanel';
import ChatbotSettings from './ChatbotSettings';
import chatbotService from '../../services/chatbotService';
import Skeleton from '../ui/Skeleton';

const ConversationManager = ({
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onToggleSidebar,
  showSidebar,
  refreshTrigger,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadUserInfo();

    // Expose refresh function globally
    window.refreshConversations = () => {
      // Trigger refresh in ConversationList component
      if (window.refreshConversationList) {
        window.refreshConversationList();
      }
    };

    return () => {
      // Cleanup
      delete window.refreshConversations;
    };
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const data = await chatbotService.getUserInfo();
      setUserInfo(data);
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    onNewConversation();
  };

  const tabs = [
    {
      id: 'conversations',
      label: 'Cuộc trò chuyện',
      icon: FaComments,
      component: (
        <ConversationList
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
          onNewConversation={handleNewConversation}
          showSidebar={showSidebar}
          onToggleSidebar={onToggleSidebar}
          refreshTrigger={refreshTrigger}
        />
      )
    },
    {
      id: 'memory',
      label: 'Memory',
      icon: FaBrain,
      component: <MemoryPanel />
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: FaCog,
      component: <ChatbotSettings />
    }
  ];

  if (loading) {
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-gray-800 p-4 space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-700">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 relative ${className}`}>
      {/* Header - Only show when expanded */}
      {showSidebar && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Q</span>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Qwen2.5</h2>
              <div className="flex items-center gap-2">

                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 dark:text-green-400">Sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-6 h-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
              title="Thu nhỏ sidebar"
            >
              <FaBars className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      )}

      {/* Collapsed Sidebar - Icon buttons */}
      {!showSidebar && (
        <div className="flex flex-col items-center py-4 space-y-3">
          {/* Expand Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Mở rộng sidebar"
            >
              <FaBars className="w-4 h-4" />
            </button>
          )}
          {/* New Chat Button */}
          <button
            onClick={onNewConversation}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Cuộc trò chuyện mới"
          >
            <FaPlus className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* Content - Only show when expanded */}
      {showSidebar && (
        <div className="flex-1 overflow-hidden">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      )}
    </div>
  );
};

export default ConversationManager;
