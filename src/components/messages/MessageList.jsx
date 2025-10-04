import React, { useEffect } from "react";
import MessageItem from "../messages/MessageItem";
import { FaChevronDown, FaSpinner } from "react-icons/fa";

function generateMessageKey(message, index) {
  if (message._id) return message._id;
  if (message.id && !String(message.id).startsWith('temp-')) return message.id;
  if (message.localId) return message.localId;
  return `temp-${index}-${Date.now()}`;
}

export default function MessageList({
  messages,
  currentUserId,
  getUserName,
  getUserImage,
  onReply,
  onMessageUpdate,
  onJumpToMessage,
  loadingOlderMessages,
  loadingNewerMessages,
  hasMoreBefore,
  hasMoreAfter,
  isJumpMode,
  onReturnToLatest,
  selectedConversationId,
  messagesContainerRef,
  loadOlderById,
  loadNewerById,
}) {
  useEffect(() => {
    const container = messagesContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      const scrollThreshold = 50;
      if (scrollTop <= scrollThreshold && selectedConversationId) {
        loadOlderById(selectedConversationId);
      }
      if (scrollBottom <= scrollThreshold && selectedConversationId) {
        loadNewerById(selectedConversationId);
      }
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });
    return () => container.removeEventListener('scroll', throttledScroll);
  }, [messagesContainerRef, selectedConversationId, loadOlderById, loadNewerById]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 relative"
    >
      {isJumpMode && (
        <button
          onClick={onReturnToLatest}
          title="Trở về hiện tại"
          className="fixed right-4 bottom-4 z-50 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center"
          aria-label="Trở về hiện tại"
        >
          <FaChevronDown className="w-5 h-5" />
        </button>
      )}

      {loadingOlderMessages && (
        <div className="flex justify-center py-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400">Đang tải tin nhắn cũ hơn...</span>
          </div>
        </div>
      )}

      {messages.map((m, idx) => (
        <div key={generateMessageKey(m, idx)} data-message-id={m.id || m._id}>
          <MessageItem
            message={m}
            currentUserId={currentUserId}
            getUserName={getUserName}
            getUserImage={getUserImage}
            onReply={onReply}
            conversationId={selectedConversationId}
            onMessageUpdate={onMessageUpdate}
            onJumpToMessage={(messageId) => onJumpToMessage(selectedConversationId, messageId)}
          />
        </div>
      ))}

      {loadingNewerMessages && (
        <div className="flex justify-center py-4 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 dark:text-green-400">Đang tải tin nhắn mới hơn...</span>
          </div>
        </div>
      )}
    </div>
  );
}



