import React from "react";
import ChatHeader from "./ChatHeader";
import PinnedMessagesBannerWrapper from "./PinnedMessagesBannerWrapper";
import MessageList from "./MessageList";
import TypingIndicatorWrapper from "./TypingIndicatorWrapper";
import MessageComposer from "./MessageComposer";

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
}) {
  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader
        selectedConversation={selectedConversation}
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
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        getUserName={getUserName}
      />
    </div>
  );
}


