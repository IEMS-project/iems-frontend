import React from "react";
import Avatar from "../ui/Avatar";
import { FaSearch, FaUsers } from "react-icons/fa";

export default function ChatHeader({
  selectedConversation,
  currentUserId,
  getUserName,
  getUserImage,
  pendingDirect,
  selectedPeerId,
  onShowMessageSearch,
  onShowGroupMembers,
  isDirect,
  getPeerId,
  getConversationDisplayName,
}) {
  const conv = selectedConversation;
  const showGroupButton = conv && !isDirect(conv);
  const headerContent = (() => {
    if (conv) {
      const dir = isDirect(conv);
      const dn = getConversationDisplayName(conv, currentUserId);
      const avatarSrc = dir ? getUserImage(getPeerId(conv)) : (conv?.avatarUrl || "");
      return (
        <>
          <Avatar src={avatarSrc} name={dn} size={10} />
          <div className="font-semibold truncate">{dn}</div>
        </>
      );
    }
    if (pendingDirect && selectedPeerId) {
      return (
        <>
          <Avatar src={getUserImage(selectedPeerId)} name={getUserName(selectedPeerId)} size={10} />
          <div className="font-semibold truncate">{getUserName(selectedPeerId)}</div>
        </>
      );
    }
    return <div className="font-semibold truncate">Chọn cuộc trò chuyện</div>;
  })();

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 min-w-0">
        {headerContent}
      </div>
      <div className="flex items-center gap-2">
        {conv && (
          <button
            onClick={onShowMessageSearch}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Tìm kiếm tin nhắn"
          >
            <FaSearch className="w-5 h-5" />
          </button>
        )}
        {showGroupButton && (
          <button
            onClick={onShowGroupMembers}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Quản lý thành viên"
          >
            <FaUsers className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}



