import React, { useMemo, useState, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import PinnedMessagesBannerWrapper from "../messages/PinnedMessagesBannerWrapper";
import MessageList from "../messages/MessageList";
import TypingIndicatorWrapper from "../messages/TypingIndicatorWrapper";
import MessageComposer from "../messages/MessageComposer";
import GroupSidebar from "../messages/GroupSidebar";

export default function ChatArea({
  selectedConversationId,
  selectedConversation,
  messages,
  currentUserId,
  getUserName,
  getUserImage,
  onSend,
  onReply,
  onCancelReply,
  onMessageUpdate,
  onJumpToMessage,
  onSendMedia,
  typingUsers,
  onShowMessageSearch,
  onShowGroupMembers,
  isJumpMode,
  onReturnToLatest,
  loadingOlderMessages,
  loadingNewerMessages,
  messagesContainerRef,
  content,
  onContentChange,
  onTyping,
  replyingTo,
  pendingDirect,
  selectedPeerId,
  pinnedMessagesBannerRef,
  loadOlderById,
  loadNewerById,
  isDirect,
  getPeerId,
  getConversationDisplayName,
  onShowPinnedMessages,
  onUnpinMessage,
  onConversationMetaUpdated,
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [localConversation, setLocalConversation] = useState(null);
  const handleToggleSidebar = () => setShowSidebar(s => !s);
  const effectiveConversation = useMemo(() => localConversation || selectedConversation, [localConversation, selectedConversation]);

  // Reset local overrides when switching to a different conversation
  useEffect(() => {
    setLocalConversation(null);
  }, [selectedConversationId]);
  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col">
      <ChatHeader
        selectedConversation={effectiveConversation}
        currentUserId={currentUserId}
        getUserName={getUserName}
        getUserImage={getUserImage}
        pendingDirect={pendingDirect}
        selectedPeerId={selectedPeerId}
        onShowMessageSearch={onShowMessageSearch}
        onShowGroupMembers={onShowGroupMembers}
        isDirect={isDirect}
        getPeerId={getPeerId}
        getConversationDisplayName={getConversationDisplayName}
        onToggleSidebar={handleToggleSidebar}
      />

      {selectedConversationId && (
        <PinnedMessagesBannerWrapper
          ref={pinnedMessagesBannerRef}
          conversationId={selectedConversationId}
          getUserName={getUserName}
          onMessageClick={(message) => onJumpToMessage(selectedConversationId, message.id || message._id)}
          onShowAllPinned={onShowPinnedMessages}
          onUnpinMessage={onUnpinMessage}
          currentUserId={currentUserId}
        />
      )}

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        getUserName={getUserName}
        getUserImage={getUserImage}
        onReply={onReply}
        onMessageUpdate={onMessageUpdate}
        onJumpToMessage={onJumpToMessage}
        loadingOlderMessages={loadingOlderMessages}
        loadingNewerMessages={loadingNewerMessages}
        hasMoreBefore={true}
        hasMoreAfter={true}
        isJumpMode={isJumpMode}
        onReturnToLatest={onReturnToLatest}
        selectedConversationId={selectedConversationId}
        messagesContainerRef={messagesContainerRef}
        loadOlderById={loadOlderById}
        loadNewerById={loadNewerById}
      />

      <TypingIndicatorWrapper typingUsers={typingUsers} getUserName={getUserName} />

      <MessageComposer
        content={content}
        onContentChange={onContentChange}
        onSend={onSend}
        onTyping={onTyping}
        onSendMedia={onSendMedia}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        getUserName={getUserName}
      />
      </div>
      {showSidebar && effectiveConversation && (
        <GroupSidebar
          conversation={effectiveConversation}
          currentUserId={currentUserId}
          getUserName={getUserName}
          getUserImage={getUserImage}
          onReply={onReply}
          onConversationUpdated={(updated) => {
            // Update local state so header and sidebar reflect changes immediately
            setLocalConversation(updated);
            try { onConversationMetaUpdated && onConversationMetaUpdated(updated); } catch (_) { }
          }}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}


