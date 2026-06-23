import React from "react";
import Avatar from "@/components/ui/Avatar.jsx";
import { Search, Users, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChatHeader({
  selectedConversation,
  currentUserId,
  getUserName,
  getUserImage,
  getUserPremium,
  pendingDirect,
  selectedPeerId,
  onShowMessageSearch,
  onShowGroupMembers,
  isDirect,
  getPeerId,
  getConversationDisplayName,
  onToggleSidebar,
}) {
  const { t } = useTranslation();
  const conv = selectedConversation;
  const showGroupButton = conv && !isDirect(conv);
  const headerContent = (() => {
    if (conv) {
      const dir = isDirect(conv);
      const dn = getConversationDisplayName(conv, currentUserId);
      const peerId = dir ? getPeerId(conv) : null;
      const avatarSrc = dir ? getUserImage(peerId) : (conv?.avatarUrl || "");
      return (
        <>
          <Avatar src={avatarSrc} name={dn} size={10} premium={dir ? getUserPremium?.(peerId) : false} />
          <div className="min-w-0">
            <div className="font-semibold truncate text-foreground">{dn}</div>
            <div className="text-xs text-muted-foreground truncate">
              {dir ? t('messages.header.active') : t('messages.header.members', { count: (conv?.members || []).length })}
            </div>
          </div>
        </>
      );
    }
    if (pendingDirect && selectedPeerId) {
      return (
        <>
          <Avatar src={getUserImage(selectedPeerId)} name={getUserName(selectedPeerId)} size={10} premium={getUserPremium?.(selectedPeerId)} />
          <div className="font-semibold truncate text-foreground">{getUserName(selectedPeerId)}</div>
        </>
      );
    }
    return <div className="font-semibold truncate text-muted-foreground">{t('messages.emptyChat.title')}</div>;
  })();

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-3 min-w-0">
        {headerContent}
      </div>
      <div className="flex items-center gap-2">
        {conv && (
          <button
            onClick={onShowMessageSearch}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            title={t('messages.header.searchMessages')}
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {showGroupButton && (
          <button
            onClick={onShowGroupMembers}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            title={t('messages.header.manageMembers')}
          >
            <Users className="w-5 h-5" />
          </button>
        )}
        {conv && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            title={t('messages.header.conversationInfo')}
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}



