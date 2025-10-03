import React, { useState, useRef, useEffect } from "react";
import Avatar from "../ui/Avatar";
import { chatService, chatWs } from "../../services/chatService";

export default function MessageItem({ 
    message, 
    currentUserId, 
    getUserName, 
    getUserImage,
    onReply,
    stompClient,
    conversationId,
    onMessageUpdate,
    onJumpToMessage
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const menuRef = useRef(null);

    const isMe = message.senderId === currentUserId;
    const senderName = getUserName(message.senderId);
    const senderImg = getUserImage(message.senderId);

    // Check if message is deleted/recalled
    const isDeletedForMe = message.deletedForUsers && Array.isArray(message.deletedForUsers) && message.deletedForUsers.includes(currentUserId);
    const isRecalled = message.recalled;

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Don't render deleted messages
    if (isDeletedForMe) {
        return null;
    }

    const handleReaction = async (emoji) => {
        try {
            if (stompClient?.connected) {
                stompClient.publish({
                    destination: chatWs.addReaction(conversationId),
                    body: JSON.stringify({
                        messageId: message.id,
                        userId: currentUserId,
                        emoji: emoji,
                        action: 'add'
                    })
                });
            } else {
                await chatService.addReaction(message.id, currentUserId, emoji);
                onMessageUpdate?.();
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
        setShowEmojiPicker(false);
        setShowMenu(false);
    };

    const handleRemoveReaction = async (emoji) => {
        try {
            if (stompClient?.connected) {
                stompClient.publish({
                    destination: chatWs.addReaction(conversationId),
                    body: JSON.stringify({
                        messageId: message.id,
                        userId: currentUserId,
                        emoji: emoji,
                        action: 'remove'
                    })
                });
            } else {
                await chatService.removeReaction(message.id, currentUserId);
                onMessageUpdate?.();
            }
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    };

    const handleDeleteForMe = async () => {
        try {
            // Optimistic update - hide message immediately
            onMessageUpdate?.('delete-for-me', message.id, currentUserId);
            
            // Then call API
            await chatService.deleteForMe(message.id, currentUserId);
        } catch (error) {
            console.error('Error deleting message:', error);
            // Revert optimistic update on error
            onMessageUpdate?.('revert-delete', message.id, currentUserId);
        }
        setShowMenu(false);
    };

    const handleRecall = async () => {
        if (!isMe) return;
        try {
            if (stompClient?.connected) {
                stompClient.publish({
                    destination: chatWs.deleteMessage(conversationId),
                    body: JSON.stringify({
                        messageId: message.id,
                        userId: currentUserId,
                        action: 'recall'
                    })
                });
            } else {
                await chatService.recallMessage(message.id);
                onMessageUpdate?.();
            }
        } catch (error) {
            console.error('Error recalling message:', error);
        }
        setShowMenu(false);
    };

    const handlePin = async () => {
        try {
            if (stompClient?.connected) {
                stompClient.publish({
                    destination: chatWs.pinMessage(conversationId),
                    body: JSON.stringify({
                        messageId: message.id,
                        userId: currentUserId,
                        action: message.pinned ? 'unpin' : 'pin'
                    })
                });
            } else {
                if (message.pinned) {
                    await chatService.unpinMessage(conversationId, message.id);
                } else {
                    await chatService.pinMessage(conversationId, message.id);
                }
                onMessageUpdate?.();
            }
        } catch (error) {
            console.error('Error pinning message:', error);
        }
        setShowMenu(false);
    };

    const formatReactions = () => {
        if (!message.reactions) return [];
        return Object.entries(message.reactions).map(([emoji, users]) => ({
            emoji,
            count: users.length,
            hasReacted: users.includes(currentUserId)
        }));
    };

    const reactions = formatReactions();
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    return (
        <div className={`group flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
            <div className={`flex items-end max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar for others */}
                {!isMe && (
                    <Avatar src={senderImg} name={senderName} size={8} className="mb-1" />
                )}

                <div className={`relative ${isMe ? 'mr-2' : 'ml-2'}`}>
                    {/* Reply indicator */}
                    {message.replyToMessageId && !isRecalled && (
                        <div className={`text-xs mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            <div 
                                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 border-l-2 border-blue-500 max-w-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => onJumpToMessage?.(message.replyToMessageId)}
                                title="Nhấn để xem tin nhắn gốc"
                            >
                                <div className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                                    {getUserName(message.replyToSenderId)}
                                </div>
                                <div className="text-gray-600 dark:text-gray-300 text-xs truncate">
                                    {message.replyToContent}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message bubble */}
                    <div 
                        className="relative"
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setShowMenu(true);
                        }}
                    >
                        <div className={`relative px-3 py-2 rounded-2xl max-w-xs break-words ${
                            isRecalled 
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic border border-dashed" 
                                : isMe 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                        }`}>
                            {isRecalled ? (
                                <span className="text-sm">Tin nhắn đã được thu hồi</span>
                            ) : (
                                <>
                                    <div className="text-sm">
                                        {message.content}
                                    </div>
                                    {message.edited && (
                                        <span className="text-xs opacity-70 ml-2">(đã chỉnh sửa)</span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Three dots menu button (like Zalo) */}
                        {!isRecalled && (
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className={`absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ${
                                    isMe ? '-left-8' : '-right-8'
                                }`}
                            >
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                </svg>
                            </button>
                        )}

                        {/* Menu dropdown */}
                        {showMenu && (
                            <div 
                                ref={menuRef}
                                className={`absolute z-20 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px] ${
                                    isMe ? 'right-0' : 'left-0'
                                }`}
                            >
                                {/* Emoji reactions */}
                                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-600">
                                    <div className="flex gap-1">
                                        {emojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(emoji)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                title={`Thả cảm xúc ${emoji}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={() => {
                                        onReply?.(message);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Trả lời
                                </button>

                                <button
                                    onClick={handlePin}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    {message.pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                </button>

                                <button
                                    onClick={handleDeleteForMe}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Xóa tin nhắn
                                </button>

                                {isMe && (
                                    <button
                                        onClick={handleRecall}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Thu hồi tin nhắn
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reactions display */}
                    {reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {reactions.map(({ emoji, count, hasReacted }) => (
                                <button
                                    key={emoji}
                                    onClick={hasReacted ? () => handleRemoveReaction(emoji) : () => handleReaction(emoji)}
                                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
                                        hasReacted 
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 border border-blue-300' 
                                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                    }`}
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Message info */}
                    <div className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {!isMe && <span className="font-medium">{senderName} • </span>}
                        <span>{new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {message.pinned && (
                            <span className="ml-1 text-blue-600">📌</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}