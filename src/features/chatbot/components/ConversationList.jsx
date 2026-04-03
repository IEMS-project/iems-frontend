import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaHistory } from 'react-icons/fa';
import ConversationItem from './ConversationItem';
import chatbotService from '@/features/chatbot/api/chatbotService';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { navColors, buttonColors, textColors, borderColors, statusColors, cn } from '@/theme/colors';

const ConversationList = ({
  activeConversationId,
  projectId,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  useEffect(() => {
    loadConversations(projectId);

    // Expose refresh function globally
    window.refreshConversationList = loadConversations;

    return () => {
      // Cleanup
      delete window.refreshConversationList;
    };
  }, [projectId]);

  // Refresh conversations when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadConversations(projectId);
    }
  }, [refreshTrigger, projectId]);

  const loadConversations = async (scopeProjectId = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatbotService.getConversations(scopeProjectId);
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

  const handleDeleteConversation = (conversationId) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await chatbotService.deleteConversation(conversationToDelete);
      setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete));

      // Nếu đang xóa cuộc trò chuyện đang active, chuyển về cuộc trò chuyện đầu tiên
      if (activeConversationId === conversationToDelete) {
        const remainingConversations = (Array.isArray(conversations) ? conversations : []).filter(conv => conv.id !== conversationToDelete);
        if (remainingConversations.length > 0) {
          onConversationSelect(remainingConversations[0].id);
        } else {
          onNewConversation();
        }
      }
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error(error?.message || 'Failed to delete conversation');
      setConversationToDelete(null);
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
        toast.error(error?.message || 'Failed to rename conversation');
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
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded transition-colors',
            navColors.text,
            navColors.hover,
            showSidebar ? 'text-left' : 'justify-center'
          )}
          title={showSidebar ? undefined : "Cuộc trò chuyện mới"}
        >
          <FaPlus className={cn('w-4 h-4', textColors.muted)} />
          {showSidebar && <span className="text-sm font-medium">Cuộc trò chuyện mới</span>}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        {showSidebar ? (
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm đoạn chat"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded text-sm transition-colors bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 focus:outline-none"
            />
          </div>
        ) : (
          <button
            onClick={onToggleSidebar}
            className={cn(
              'w-full flex items-center justify-center p-2 rounded transition-colors',
              navColors.text,
              navColors.hover
            )}
            title="Tìm kiếm đoạn chat"
          >
            <FaSearch className={cn('w-4 h-4', textColors.muted)} />
          </button>
        )}
      </div>

      {/* Conversations List - Only show when sidebar is expanded */}
      {showSidebar && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <div className={cn('flex items-center gap-2 text-xs mb-2', textColors.secondary)}>
              <span>Đoạn chat</span>
            </div>
          </div>

          <div className="px-4">
            {error ? (
              <div className="text-center py-8">
                <p className={cn('mb-2 text-sm', statusColors.dangerText)}>{error}</p>
                <button
                  onClick={loadConversations}
                  className={cn('px-4 py-2 rounded text-sm transition-colors', buttonColors.primary)}
                >
                  Thử lại
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className={cn('rounded-lg border border-dashed p-3', borderColors.medium)}>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <FaHistory className={cn('w-6 h-6 mx-auto mb-2', textColors.muted)} />
                <p className={cn('text-sm', textColors.secondary)}>
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

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteConversation}
        title="Xác nhận xóa cuộc trò chuyện"
        description="Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="destructive"
      />
    </div>
  );
};

export default ConversationList;

