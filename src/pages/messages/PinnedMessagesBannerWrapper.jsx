import React, { forwardRef, useImperativeHandle } from "react";
import PinnedMessagesBanner from "../../components/messages/PinnedMessagesBanner";

const PinnedMessagesBannerWrapper = forwardRef(function PinnedMessagesBannerWrapper(
  { conversationId, getUserName, onMessageClick, onShowAllPinned, onUnpinMessage, currentUserId },
  ref
) {
  const localRef = React.useRef(null);

  useImperativeHandle(ref, () => ({
    updatePinnedMessages: (messages) => {
      if (localRef.current?.updatePinnedMessages) {
        localRef.current.updatePinnedMessages(messages);
      }
    }
  }));

  return (
    <PinnedMessagesBanner
      ref={localRef}
      conversationId={conversationId}
      getUserName={getUserName}
      onMessageClick={onMessageClick}
      onShowAllPinned={onShowAllPinned}
      onUnpinMessage={onUnpinMessage}
      currentUserId={currentUserId}
    />
  );
});

export default PinnedMessagesBannerWrapper;



