import React from "react";
import TypingIndicator from "../../components/messages/TypingIndicator";

export default function TypingIndicatorWrapper({ typingUsers, getUserName }) {
  return (
    <div className="px-4 pt-2 pb-1">
      <TypingIndicator typingUsers={typingUsers} getUserName={getUserName} />
    </div>
  );
}



