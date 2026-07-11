import React, { useEffect } from "react";
import MessageItem from "./MessageItem";
import MessageTimestamp from "./MessageTimestamp";
import { FaChevronDown, FaSpinner } from "react-icons/fa";
import { getChatTimeMs, isSameLocalDay } from "@/features/messages/utils/chatTime";

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
  getUserPremium,
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
  // Helper function to determine if messages should be grouped
  const shouldGroupMessages = (currentMsg, previousMsg) => {
    if (!previousMsg || !currentMsg) return false;

    // Don't group system messages
    if (currentMsg.type === 'SYSTEM_LOG' || previousMsg.type === 'SYSTEM_LOG') return false;

    // Check if same sender
    if (currentMsg.senderId !== previousMsg.senderId) return false;

    // Check if within 5 minutes (300000 ms)
    const timeDiff = getChatTimeMs(currentMsg.sentAt) - getChatTimeMs(previousMsg.sentAt);
    if (timeDiff > 300000) return false; // 5 minutes

    return true;
  };

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
      className="flex-1 overflow-y-auto bg-background relative"
    >
      {isJumpMode && (
        <button
          onClick={onReturnToLatest}
          title="Trở về hiện tại"
          className="fixed right-4 bottom-4 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center"
          aria-label="Trở về hiện tại"
        >
          <FaChevronDown className="w-5 h-5" />
        </button>
      )}

      {loadingOlderMessages && (
        <div className="flex justify-center py-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Đang tải tin nhắn cũ hơn...</span>
          </div>
        </div>
      )}

      {messages.map((m, idx) => {
        const previousMsg = idx > 0 ? messages[idx - 1] : null;
        const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
        const shouldGroup = shouldGroupMessages(m, previousMsg);
        const isLastInGroup = !shouldGroupMessages(nextMsg, m);

        // Show timestamp if:
        // 1. First message
        // 2. More than 30 minutes from previous message
        // 3. Different day from previous message
        let showTimestamp = false;
        if (!previousMsg) {
          showTimestamp = true;
        } else if (m.sentAt && previousMsg.sentAt) {
          const timeDiff = getChatTimeMs(m.sentAt) - getChatTimeMs(previousMsg.sentAt);
          const diffDays = !isSameLocalDay(m.sentAt, previousMsg.sentAt);
          showTimestamp = timeDiff > 1800000 || diffDays; // 30 minutes or different day
        }

        return (
          <React.Fragment key={generateMessageKey(m, idx)}>
            {showTimestamp && <MessageTimestamp date={m.sentAt} />}
            <div data-message-id={m.id || m._id}>
              <MessageItem
                message={m}
                currentUserId={currentUserId}
                getUserName={getUserName}
                getUserImage={getUserImage}
                getUserPremium={getUserPremium}
                onReply={onReply}
                conversationId={selectedConversationId}
                onMessageUpdate={onMessageUpdate}
                onJumpToMessage={(messageId) => onJumpToMessage(selectedConversationId, messageId)}
                showAvatar={!shouldGroup}
                showName={!shouldGroup}
                showTime={isLastInGroup}
              />
            </div>
          </React.Fragment>
        );
      })}

      {loadingNewerMessages && (
        <div className="flex justify-center py-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Đang tải tin nhắn mới hơn...</span>
          </div>
        </div>
      )}
    </div>
  );
}



