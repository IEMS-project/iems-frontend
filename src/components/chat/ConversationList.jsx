import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaHistory, FaSpinner } from 'react-icons/fa';
import ConversationItem from './ConversationItem';
import chatbotService from '../../services/chatbotService';

const ConversationList = ({ 
  activeConversationId, 
  onConversationSelect, 
  onNewConversation,
  showSidebar = true,
  onToggleSidebar,
  refreshTrigger,
  className = "" 
}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConversations();

    // Expose refresh function globally
    window.refreshConversationList = loadConversations;

    return () => {
      // Cleanup
      delete window.refreshConversationList;
    };
  }, []);

  // Refresh conversations when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadConversations();
    }
  }, [refreshTrigger]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatbotService.getConversations();
      console.log('Conversations API response:', data);

      // Handle different response formats
      let conversations = [];
      if (Array.isArray(data)) {
        conversations = data;
      } else if (data && Array.isArray(data.conversations)) {
        conversations = data.conversations;
      } else if (data && data.data && Array.isArray(data.data)) {
        conversations = data.data;
      }

      console.log('Processed conversations:', conversations);
      setConversations(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      return;
    }

    try {
      await chatbotService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // Nếu đang xóa cuộc trò chuyện đang active, chuyển về cuộc trò chuyện đầu tiên
      if (activeConversationId === conversationId) {
        const remainingConversations = (Array.isArray(conversations) ? conversations : []).filter(conv => conv.id !== conversationId);
        if (remainingConversations.length > 0) {
          onConversationSelect(remainingConversations[0].id);
        } else {
          onNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Không thể xóa cuộc trò chuyện');
    }
  };

  const handleEditConversation = async (conversation) => {
    const newTitle = prompt('Nhập tiêu đề mới:', conversation.name || conversation.title || '');
    if (newTitle && newTitle.trim() !== (conversation.name || conversation.title)) {
      try {
        await chatbotService.renameConversation(conversation.id, newTitle.trim());
        // Update local state
        setConversations(prev => prev.map(conv =>
          conv.id === conversation.id
            ? { ...conv, name: newTitle.trim() }
            : conv
        ));
      } catch (error) {
        console.error('Error renaming conversation:', error);
        alert('Không thể đổi tên cuộc trò chuyện');
      }
    }
  };

  // Auto-expand sidebar when user starts typing in search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Auto-expand sidebar if user starts typing and sidebar is collapsed
    if (value.trim() && !showSidebar && onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const filteredConversations = (Array.isArray(conversations) ? conversations : []).filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* New Chat Button */}
      <div className="px-4 py-2">
        <button
          onClick={onNewConversation}
          className={`w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors ${showSidebar ? 'text-left' : 'justify-center'
            }`}
          title={showSidebar ? undefined : "Cuộc trò chuyện mới"}
        >
          <FaPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          {showSidebar && <span className="text-sm font-medium">Cuộc trò chuyện mới</span>}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        {showSidebar ? (
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm đoạn chat"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 transition-colors text-sm"
            />
          </div>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            title="Tìm kiếm đoạn chat"
          >
            <FaSearch className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Conversations List - Only show when sidebar is expanded */}
      {showSidebar && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Đoạn chat</span>
            </div>
          </div>

          <div className="px-4">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-2 text-sm">{error}</p>
                <button
                  onClick={loadConversations}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <FaHistory className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Không tìm thấy đoạn chat nào' : 'Chưa có đoạn chat nào'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onSelect={onConversationSelect}
                    onDelete={handleDeleteConversation}
                    onEdit={handleEditConversation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;

