import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { chatService } from "../../services/chatService";
import { FaThumbtack, FaTimes, FaChevronDown, FaChevronUp, FaEllipsisV } from "react-icons/fa";

const PinnedMessagesBanner = forwardRef(function PinnedMessagesBanner({
    conversationId,
    getUserName,
    onMessageClick,
    onShowAllPinned,
    onUnpinMessage,
    currentUserId
}, ref) {
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
        <div className="border-b border-gray-200 dark:border-gray-800">
            {/* Header */}
            {!isCollapsed && (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/40">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Danh sách ghim ({pinnedMessages.length})
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCollapsed(c => !c)}
                            className="flex items-center gap-1 font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                        >
                            {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                            {isCollapsed ? <FaChevronDown className="w-4 h-4" /> : <FaChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={closeBanner}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title="Đóng"
                        >
                            <FaTimes className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsed compact view */}
            {isCollapsed && pinnedMessages.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                    {(() => {
                        const m = pinnedMessages[0];
                        const key = m.id || m._id;
                        const preview = m.recalled ? 'Tin nhắn đã được thu hồi' : (m.content || '');
                        const extra = pinnedMessages.length - 1;
                        return (
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FaThumbtack className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0" onClick={() => onMessageClick?.(m)}>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Tin nhắn</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        {getUserName?.(m.senderId)}: {preview}
                                    </div>
                                </div>
                                {extra > 0 && (
                                    <button
                                        onClick={() => setIsCollapsed(false)}
                                        className="text-sm font-semibold px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        title="Mở danh sách ghim"
                                    >
                                        +{extra} ghim
                                        <FaChevronDown className="w-4 h-4 inline-block ml-1" />
                                    </button>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === key ? null : key)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                        title="Tùy chọn"
                                    >
                                        <FaEllipsisV className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    {openMenuId === key && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                            <button
                                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                                                onClick={async () => {
                                                    try { await chatService.unpinMessage(conversationId, key); } catch (e) { /* ignore */ }
                                                    setOpenMenuId(null);
                                                    loadPinnedMessages();
                                                }}
                                            >
                                                Bỏ ghim
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
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pinnedMessages.map((m) => {
                        const key = m.id || m._id;
                        const preview = m.recalled ? 'Tin nhắn đã được thu hồi' : (m.content || '');
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                            >
                                {/* Left icon */}
                                <div className="flex-shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FaThumbtack className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onMessageClick?.(m)}>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Tin nhắn</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        {getUserName?.(m.senderId)}: {preview}
                                    </div>
                                </div>

                                {/* Kebab */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === key ? null : key); }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                        title="Tùy chọn"
                                    >
                                        <FaEllipsisV className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    {openMenuId === key && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                            <button
                                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
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
                                                Bỏ ghim
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



