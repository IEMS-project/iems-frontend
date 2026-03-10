import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { chatService } from "@/features/messages/api/chatService";
import { FaTimes, FaChevronDown, FaChevronUp, FaEllipsisV } from "react-icons/fa";
import { Pin } from "lucide-react";
import { useTranslation } from "react-i18next";

const PinnedMessagesBanner = forwardRef(function PinnedMessagesBanner({
    conversationId,
    getUserName,
    onMessageClick,
    onShowAllPinned,
    onUnpinMessage,
    currentUserId
}, ref) {
    const { t } = useTranslation();
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Expose updatePinnedMessages function to parent via ref
    useImperativeHandle(ref, () => ({
        updatePinnedMessages: (newPinnedMessages) => {
            setPinnedMessages(newPinnedMessages || []);
            setIsVisible((newPinnedMessages || []).length > 0);
        }
    }));

    useEffect(() => {
        if (conversationId) {
            loadPinnedMessages();
        }
    }, [conversationId]);

    const loadPinnedMessages = async () => {
        try {
            const messages = await chatService.getPinnedMessages(conversationId);
            setPinnedMessages(messages || []);
            setIsVisible((messages || []).length > 0);
        } catch (error) {
            console.error('Error loading pinned messages:', error);
            setPinnedMessages([]);
            setIsVisible(false);
        }
    };

    // Update pinned messages when they change (from WebSocket events)
    const updatePinnedMessages = (newPinnedMessages) => {
        setPinnedMessages(newPinnedMessages || []);
        setIsVisible((newPinnedMessages || []).length > 0);
    };

    const closeBanner = () => {
        setIsVisible(false);
    };

    if (!isVisible || pinnedMessages.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-border">
            {/* Header */}
            {!isCollapsed && (
                <div className="flex items-center justify-between px-4 py-2 bg-muted">
                    <div className="text-sm font-medium text-foreground">
                        {t('messages.pinnedMessages.pinnedList', { count: pinnedMessages.length })}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCollapsed(c => !c)}
                            className="flex items-center gap-1 font-medium text-sm text-muted-foreground hover:text-foreground"
                            title={isCollapsed ? t('messages.pinnedMessages.expand', 'Mở rộng') : t('messages.pinnedMessages.collapse', 'Thu gọn')}
                        >
                            {isCollapsed ? t('messages.pinnedMessages.expand', 'Mở rộng') : t('messages.pinnedMessages.collapse', 'Thu gọn')}
                            {isCollapsed ? <FaChevronDown className="w-4 h-4" /> : <FaChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={closeBanner}
                            className="p-1 hover:bg-muted/80 rounded"
                            title={t('ui.common.close')}
                        >
                            <FaTimes className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsed compact view */}
            {isCollapsed && pinnedMessages.length > 0 && (
                <div className="px-4 py-3 border-t border-border">
                    {(() => {
                        const m = pinnedMessages[0];
                        const key = m.id || m._id;
                        const preview = m.recalled ? t('messages.messageItem.recalled') : (m.content || '');
                        const extra = pinnedMessages.length - 1;
                        return (
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                                        <Pin className="w-4 h-4 text-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0" onClick={() => onMessageClick?.(m)}>
                                    <div className="text-sm font-medium text-foreground">{t('messages.pinnedMessages.message', 'Tin nhắn')}</div>
                                    <div className="text-sm text-muted-foreground truncate">
                                        {getUserName?.(m.senderId)}: {preview}
                                    </div>
                                </div>
                                {extra > 0 && (
                                    <button
                                        onClick={() => setIsCollapsed(false)}
                                        className="text-sm font-semibold px-3 py-1 rounded border border-border text-foreground hover:bg-muted"
                                        title={t('messages.pinnedMessages.openPinnedList', 'Mở danh sách ghim')}
                                    >
                                        {t('messages.pinnedMessages.morePinned', { count: extra })}
                                        <FaChevronDown className="w-4 h-4 inline-block ml-1" />
                                    </button>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === key ? null : key)}
                                        className="p-1 hover:bg-muted rounded"
                                        title={t('ui.common.actions', 'Tùy chọn')}
                                    >
                                        <FaEllipsisV className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                    {openMenuId === key && (
                                        <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-md shadow-lg z-10">
                                            <button
                                                className="w-full text-left px-3 py-2 text-destructive hover:bg-muted rounded"
                                                onClick={async () => {
                                                    try { await chatService.unpinMessage(conversationId, key); } catch (e) { /* ignore */ }
                                                    setOpenMenuId(null);
                                                    loadPinnedMessages();
                                                }}
                                            >
                                                {t('messages.messageItem.unpin')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Expanded list */}
            {!isCollapsed && (
                <div className="divide-y divide-border">
                    {pinnedMessages.map((m) => {
                        const key = m.id || m._id;
                        const preview = m.recalled ? t('messages.messageItem.recalled') : (m.content || '');
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                            >
                                {/* Left icon */}
                                <div className="flex-shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                                        <Pin className="w-4 h-4 text-foreground" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onMessageClick?.(m)}>
                                    <div className="text-sm font-medium text-foreground">{t('messages.pinnedMessages.message', 'Tin nhắn')}</div>
                                    <div className="text-sm text-muted-foreground truncate">
                                        {getUserName?.(m.senderId)}: {preview}
                                    </div>
                                </div>

                                {/* Kebab */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === key ? null : key); }}
                                        className="p-1 hover:bg-muted rounded"
                                        title={t('ui.common.actions', 'Tùy chọn')}
                                    >
                                        <FaEllipsisV className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                    {openMenuId === key && (
                                        <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-md shadow-lg z-10">
                                            <button
                                                className="w-full text-left px-3 py-2 text-destructive hover:bg-muted rounded"
                                                onClick={async () => {
                                                    try {
                                                        if (typeof onUnpinMessage === 'function') {
                                                            await onUnpinMessage(conversationId, key);
                                                        } else {
                                                            await chatService.unpinMessage(conversationId, key);
                                                        }
                                                        // Optimistically remove from local state
                                                        setPinnedMessages(prev => prev.filter(pm => (pm.id || pm._id) !== key));
                                                    } catch (e) { /* ignore */ }
                                                    finally {
                                                        setOpenMenuId(null);
                                                    }
                                                }}
                                            >
                                                {t('messages.messageItem.unpin')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export default PinnedMessagesBanner;



