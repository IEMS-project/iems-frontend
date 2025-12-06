import React, { useMemo, useState } from "react";
import Avatar from "../../components/ui/Avatar.jsx";
import Skeleton from "../ui/Skeleton";
import { FaPlus, FaEllipsisV, FaBell, FaBellSlash, FaTrash } from "react-icons/fa";
import { Pin } from "lucide-react";
import { chatService } from "../../services/chatService";
import { toast } from "sonner";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useTranslation } from "react-i18next";

export default function ConversationList({
  conversations,
  searchQuery,
  onSearchChange,
  allUsers,
  currentUserId,
  unreadCounts,
  globalUnreadCounts,
  unreadByConv,
  lastMessagesByConv,
  uiTick,
  onSelectConversation,
  onCreateGroupClick,
  startDirectWith,
  getConversationDisplayName,
  isDirect,
  getPeerId,
  getUserName,
  getUserImage,
  onConversationUpdate,
  loadingConversations = false,
  selectedConversationId = null,
}) {
  const { t } = useTranslation();
  const [hoveredConversation, setHoveredConversation] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, conversationId: null, x: 0, y: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

  const filteredConversations = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    const filtered = (conversations || []).filter(c => {
      const dn = getConversationDisplayName(c, currentUserId).toLowerCase();
      return !q || dn.includes(q) || (c.id || '').toLowerCase().includes(q);
    });

    // Sort conversations: pinned first, then regular ones, both sorted by timestamp
    return filtered.sort((a, b) => {
      const aIsPinned = a.isPinned || false;
      const bIsPinned = b.isPinned || false;

      // If one is pinned and the other isn't, pinned comes first
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;

      // If both have same pinned status, sort by timestamp (newest first)
      const aTime = lastMessagesByConv?.current?.[a.id]?.timestamp || a.lastMessage?.sentAt || a.updatedAt || new Date(0);
      const bTime = lastMessagesByConv?.current?.[b.id]?.timestamp || b.lastMessage?.sentAt || b.updatedAt || new Date(0);
      
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [searchQuery, conversations, currentUserId, getConversationDisplayName, lastMessagesByConv, uiTick]);
  const showSkeletons = loadingConversations && filteredConversations.length === 0;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      // Format as "11:32 AM" style
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else if (diffDays === 1) {
      return t('messages.conversation.yesterday', 'Yesterday');
    } else if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePinConversation = async (conversationId, isPinned) => {
    try {
      if (isPinned) {
        await chatService.unpinConversation(conversationId);
      } else {
        await chatService.pinConversation(conversationId);
      }
      // Trigger conversation list refresh
      if (onConversationUpdate) {
        onConversationUpdate();
      }
      // Close context menu
      setContextMenu({ show: false, conversationId: null, x: 0, y: 0 });
    } catch (error) {
      console.error('Error toggling pin status:', error);
    }
  };

  const handleMarkAsUnread = async (conversationId) => {
    try {
      await chatService.markConversationAsUnread(conversationId);
      // Trigger conversation list refresh
      if (onConversationUpdate) {
        onConversationUpdate();
      }
      // Close context menu
      setContextMenu({ show: false, conversationId: null, x: 0, y: 0 });
    } catch (error) {
      console.error('Error marking conversation as unread:', error);
    }
  };

  const handleToggleNotifications = async (conversationId) => {
    try {
      await chatService.toggleNotificationSettings(conversationId);
      // Trigger conversation list refresh
      if (onConversationUpdate) {
        onConversationUpdate();
      }
      // Close context menu
      setContextMenu({ show: false, conversationId: null, x: 0, y: 0 });
    } catch (error) {
      console.error('Error toggling notification settings:', error);
    }
  };
  
  const handleDeleteGroup = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Check if user is the creator
    if (conversation.createdBy !== currentUserId) {
      toast.warning(t('messages.conversation.onlyOwnerCanDelete'));
      return;
    }

    // Set conversation to delete and open dialog
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
    setContextMenu({ show: false, conversationId: null, x: 0, y: 0 });
  };

  const confirmDeleteGroup = async () => {
    if (!conversationToDelete) return;

    try {
      await chatService.deleteGroupConversation(conversationToDelete);
      // Trigger conversation list refresh
      if (onConversationUpdate) {
        onConversationUpdate();
      }
      toast.success(t('messages.conversation.groupDeleted', 'Nhóm đã được xóa thành công'));
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error?.message || t('messages.conversation.deleteGroupError', 'Không thể xóa nhóm. Vui lòng thử lại.'));
      setConversationToDelete(null);
    }
  };

  const handleContextMenu = (e, conversationId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      conversationId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, conversationId: null, x: 0, y: 0 });
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  return (
    <div className="w-80 border-r border-border flex flex-col h-full bg-card text-foreground relative">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 shrink-0">
        <input
          className="flex-1 px-3 py-2 rounded-full text-sm bg-background text-foreground placeholder:text-muted-foreground border border-input focus:ring-2 focus:ring-ring focus:border-transparent transition"
          placeholder={t('messages.conversation.searchPlaceholder', 'Tìm người để nhắn...')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button
          onClick={onCreateGroupClick}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
          title={t('messages.conversation.createGroup')}
        >
          <FaPlus className="w-5 h-5" />
        </button>
      </div>
      {searchQuery && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-card border-b border-border max-h-60 overflow-auto rounded-b-md shadow-lg">
          {allUsers
            .filter(u => (u.userId || u.id) !== currentUserId)
            .filter(u => {
              const q = searchQuery.trim().toLowerCase();
              const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
              return fullName.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            })
            .map(u => {
              const id = u.userId || u.id;
              const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
              return (
                <div key={id} onClick={() => startDirectWith(id)} className="flex items-center gap-3 p-2 hover:bg-muted/70 cursor-pointer">
                  <Avatar src={u.image} name={fullName || u.email || id} size={8} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">{fullName || u.email || id}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </div>
              );
            })}
          {allUsers
            .filter(u => (u.userId || u.id) !== currentUserId)
            .filter(u => {
              const q = searchQuery.trim().toLowerCase();
              const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
              return fullName.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            }).length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">{t('messages.conversation.noUsersFound', 'Không tìm thấy người dùng')}</div>
            )}
        </div>
      )}
      <div className="px-3 py-2 text-xs text-muted-foreground bg-card/70">{t('messages.conversation.conversations', 'Cuộc trò chuyện')}</div>
      <div className="flex-1 overflow-y-auto bg-background">
        {showSkeletons ? (
          <div>
            {skeletonItems.map((_, idx) => (
              <div
                key={idx}
                className="flex gap-3 px-4 py-3"
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? filteredConversations.map(c => {
          const dn = getConversationDisplayName(c, currentUserId);
          const isDir = isDirect(c);
          const peerId = isDir ? getPeerId(c) : null;
          const peerImg = isDir ? getUserImage(peerId) : (c.avatarUrl || "");
          const lastMessageData = lastMessagesByConv?.current?.[c.id];
          const lastType = (typeof lastMessageData === 'object' && lastMessageData?.type) || c.lastMessage?.type || 'TEXT';
          const lastRaw = typeof lastMessageData === 'string' ? lastMessageData : (lastMessageData?.content || c.lastMessage?.content || "");
          const last = lastType === 'IMAGE' ? t('messages.reply.image') : lastType === 'VIDEO' ? t('messages.reply.video') : lastType === 'FILE' ? t('messages.reply.fileShort', '[Tệp]') : lastRaw;
          const lastMessageSenderId = lastMessageData?.senderId || c.lastMessage?.senderId;
          const lastMessageSenderName = lastMessageSenderId ? getUserName(lastMessageSenderId) : "";
          const unread = (unreadCounts?.[c.id]) || (globalUnreadCounts?.[c.id]) || (unreadByConv?.[c.id]) || 0;
          // Use timestamp from lastMessagesByConv if available, fallback to conversation data
          const lastMessageTime = lastMessageData?.timestamp || c.lastMessage?.sentAt || c.updatedAt;
          const isPinned = c.isPinned || false;
          const notificationsEnabled = c.notificationsEnabled !== false; // Default to true
          const manuallyMarkedAsUnread = c.manuallyMarkedAsUnread || false;
          const isHovered = hoveredConversation === c.id;
          const isSelected = selectedConversationId === c.id;

          return (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c)}
              onMouseEnter={() => setHoveredConversation(c.id)}
              onMouseLeave={() => setHoveredConversation(null)}
              onContextMenu={(e) => handleContextMenu(e, c.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                isSelected 
                  ? 'bg-muted/80' 
                  : isHovered 
                    ? 'bg-muted/40' 
                    : ''
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {isDir ? (
                  <Avatar src={peerImg} name={dn} size={12} />
                ) : (
                  <Avatar src={c.avatarUrl} name={dn || c.id} size={12} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Top row: Name and Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {isPinned && (
                      <Pin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="font-semibold text-foreground truncate text-sm">
                      {dn}
                    </div>
                    {!notificationsEnabled && (
                      <FaBellSlash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lastMessageTime && (
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {formatTime(lastMessageTime)}
                      </span>
                    )}
                    {isHovered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, c.id);
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={t('ui.common.actions', 'Tùy chọn')}
                      >
                        <FaEllipsisV className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom row: Message preview and unread badge */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`text-sm truncate flex-1 ${
                      unread > 0
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground font-medium"
                    }`}
                  >
                    {lastMessageSenderName && lastMessageSenderId !== currentUserId && (
                      <span className="mr-1">
                        {lastMessageSenderName}:{" "}
                      </span>
                    )}
                    {last}
                  </div>

                  {unread > 0 && (
                    <span
                      className="shrink-0 text-xs font-medium rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-primary-foreground bg-primary"
                      title={manuallyMarkedAsUnread ? t('messages.conversation.manuallyMarkedUnread', 'Đánh dấu chưa đọc thủ công') : ''}
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {t('messages.conversation.noConversations')}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-100%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const conversation = conversations.find(c => c.id === contextMenu.conversationId);
            const isPinned = conversation?.isPinned || false;
            const notificationsEnabled = conversation?.notificationsEnabled !== false;
            const isGroup = conversation?.type === 'GROUP';
            const isCreator = conversation?.createdBy === currentUserId;

            return (
              <>
                <button
                  onClick={() => handlePinConversation(contextMenu.conversationId, isPinned)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Pin className="w-3 h-3" />
                  {isPinned ? t('messages.conversation.unpin') : t('messages.conversation.pin')}
                </button>
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={() => handleMarkAsUnread(contextMenu.conversationId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  {t('messages.conversation.markAsUnread')}
                </button>
                <button
                  onClick={() => handleToggleNotifications(contextMenu.conversationId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  {notificationsEnabled ? <FaBellSlash className="w-3 h-3" /> : <FaBell className="w-3 h-3" />}
                  {notificationsEnabled ? t('messages.conversation.muteNotifications') : t('messages.conversation.unmuteNotifications')}
                </button>
                {isGroup && isCreator && (
                  <>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => handleDeleteGroup(contextMenu.conversationId)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-destructive flex items-center gap-2"
                    >
                      <FaTrash className="w-3 h-3" />
                      {t('messages.conversation.deleteGroup')}
                    </button>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteGroup}
        title={t('messages.conversation.confirmDeleteTitle', 'Xác nhận xóa nhóm')}
        description={
          conversationToDelete
            ? t('messages.conversation.confirmDeleteDescription', 'Bạn có chắc chắn muốn xóa nhóm "{{name}}"?\n\nTất cả tin nhắn và dữ liệu trong nhóm sẽ bị xóa vĩnh viễn và không thể khôi phục.', { name: conversations.find(c => c.id === conversationToDelete)?.name || t('messages.conversation.thisGroup', 'Nhóm này') })
            : ""
        }
        confirmText={t('messages.conversation.deleteGroup')}
        cancelText={t('ui.common.cancel')}
        variant="destructive"
      />
    </div>
  );
}



