import React, { useMemo, useState } from "react";
import Avatar from "../../components/ui/Avatar";
import { FaPlus, FaThumbtack, FaEllipsisV, FaBell, FaBellSlash, FaTrash } from "react-icons/fa";
import { chatService } from "../../services/chatService";

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
  onSelectConversation,
  onCreateGroupClick,
  startDirectWith,
  getConversationDisplayName,
  isDirect,
  getPeerId,
  getUserName,
  getUserImage,
  onConversationUpdate,
}) {
  const [hoveredConversation, setHoveredConversation] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, conversationId: null, x: 0, y: 0 });

  const filteredConversations = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return (conversations || []).filter(c => {
      const dn = getConversationDisplayName(c, currentUserId).toLowerCase();
      return !q || dn.includes(q) || (c.id || '').toLowerCase().includes(q);
    });
  }, [searchQuery, conversations, currentUserId, getConversationDisplayName]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const handlePinConversation = async (conversationId, isPinned) => {
    try {
      if (isPinned) {
        await chatService.unpinConversation(conversationId, currentUserId);
      } else {
        await chatService.pinConversation(conversationId, currentUserId);
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
      await chatService.markConversationAsUnread(conversationId, currentUserId);
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
      await chatService.toggleNotificationSettings(conversationId, currentUserId);
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

  const handleDeleteGroup = async (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Check if user is the creator
    if (conversation.createdBy !== currentUserId) {
      alert('Chỉ người tạo nhóm mới có thể xóa nhóm này');
      return;
    }

    // Confirm deletion
    const confirmMessage = `Bạn có chắc chắn muốn xóa nhóm "${conversation.name || 'Nhóm này'}"?\n\nTất cả tin nhắn và dữ liệu trong nhóm sẽ bị xóa vĩnh viễn và không thể khôi phục.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await chatService.deleteGroupConversation(conversationId, currentUserId);
      // Trigger conversation list refresh
      if (onConversationUpdate) {
        onConversationUpdate();
      }
      // Close context menu
      setContextMenu({ show: false, conversationId: null, x: 0, y: 0 });
      alert('Nhóm đã được xóa thành công');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Không thể xóa nhóm. Vui lòng thử lại.');
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
    <div className="w-80 border-r border-gray-200 flex flex-col dark:border-gray-800">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="font-semibold">Chat</div>
        <button className="text-sm px-2 py-1 border rounded flex items-center gap-1" onClick={onCreateGroupClick}>
          <FaPlus className="w-3 h-3" />
          Tạo nhóm
        </button>
      </div>
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <input
          className="w-full px-3 py-2 border rounded-full text-sm dark:bg-gray-900 dark:border-gray-700"
          placeholder="Tìm người để nhắn..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <div className="mt-3 max-h-60 overflow-auto rounded-md border border-gray-100 divide-y dark:border-gray-800 dark:divide-gray-800">
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
                  <div key={id} onClick={() => startDirectWith(id)} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800/50">
                    <Avatar src={u.image} name={fullName || u.email || id} size={8} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{fullName || u.email || id}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
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
                <div className="p-3 text-sm text-gray-500">Không tìm thấy người dùng</div>
              )}
          </div>
        )}
      </div>
      <div className="px-3 py-2 text-xs text-gray-500">Cuộc trò chuyện</div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map(c => {
          const dn = getConversationDisplayName(c, currentUserId);
          const isDir = isDirect(c);
          const peerId = isDir ? getPeerId(c) : null;
          const peerImg = isDir ? getUserImage(peerId) : (c.avatarUrl || "");
          const lastMessageData = lastMessagesByConv?.current?.[c.id];
          const last = typeof lastMessageData === 'string' ? lastMessageData : (lastMessageData?.content || "");
          const lastMessageSenderId = lastMessageData?.senderId || c.lastMessage?.senderId;
          const lastMessageSenderName = lastMessageSenderId ? getUserName(lastMessageSenderId) : "";
          const unread = (unreadCounts?.[c.id]) || (globalUnreadCounts?.[c.id]) || (unreadByConv?.[c.id]) || 0;
          const lastMessageTime = c.lastMessage?.sentAt || c.updatedAt;
          const isPinned = c.isPinned || false;
          const notificationsEnabled = c.notificationsEnabled !== false; // Default to true
          const manuallyMarkedAsUnread = c.manuallyMarkedAsUnread || false;
          const isHovered = hoveredConversation === c.id;

          return (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c)}
              onMouseEnter={() => setHoveredConversation(c.id)}
              onMouseLeave={() => setHoveredConversation(null)}
              className={`flex gap-3 px-3 py-2 border-b border-gray-50 cursor-pointer dark:border-gray-800 transition-colors duration-200 ${isPinned ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${isHovered ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
            >
              <div className="w-10 h-10">
                {isDir ? (
                  <Avatar src={peerImg} name={dn} size={10} />
                ) : (
                  <Avatar src={c.avatarUrl} name={dn || c.id} size={10} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPinned && (
                      <FaThumbtack className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    )}
                    <div className="font-medium truncate">{dn}</div>
                    {!notificationsEnabled && (
                      <FaBellSlash className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isHovered ? (
                      <button
                        onClick={(e) => handleContextMenu(e, c.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Tùy chọn"
                      >
                        <FaEllipsisV className="w-3 h-3" />
                      </button>
                    ) : (
                      lastMessageTime && (
                        <span className="text-xs text-gray-400">
                          {formatTime(lastMessageTime)}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div
                    className={`text-xs truncate flex-1 ${unread > 0
                      ? "text-black dark:text-white font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                      }`}
                  >
                    {lastMessageSenderName && (
                      <span>
                        {lastMessageSenderId === currentUserId ? "Bạn" : lastMessageSenderName}:{" "}
                      </span>
                    )}
                    {last}
                  </div>

                  {unread > 0 ? (
                    <span
                      className={`shrink-0 text-[10px] rounded-full w-5 h-5 ml-2 flex items-center justify-center text-white ${notificationsEnabled ? 'bg-red-600' : 'bg-gray-500'
                        }`}
                      title={manuallyMarkedAsUnread ? 'Đánh dấu chưa đọc thủ công' : ''}
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] rounded-full w-5 h-5 ml-2 opacity-0">
                      0
                    </span>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[160px]"
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
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <FaThumbtack className="w-3 h-3" />
                  {isPinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => handleMarkAsUnread(contextMenu.conversationId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Đánh dấu chưa đọc
                </button>
                <button
                  onClick={() => handleToggleNotifications(contextMenu.conversationId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {notificationsEnabled ? <FaBellSlash className="w-3 h-3" /> : <FaBell className="w-3 h-3" />}
                  {notificationsEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
                </button>
                {isGroup && isCreator && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => handleDeleteGroup(contextMenu.conversationId)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                    >
                      <FaTrash className="w-3 h-3" />
                      Xóa nhóm
                    </button>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}



