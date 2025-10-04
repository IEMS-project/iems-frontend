import React, { useState, useRef, useEffect } from "react";
import Avatar from "../ui/Avatar";
import { chatService, chatWs } from "../../services/chatService";
import {
    FaRegCopy,
    FaRegTrashAlt,
    FaUndo,
    FaThumbtack,
    FaHeart,
    FaReply,
    FaEllipsisV,
    FaTimes,
    FaCheck
} from "react-icons/fa";

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
    const [showReactionModal, setShowReactionModal] = useState(false);
    const menuRef = useRef(null);
    const bubbleRef = useRef(null);
    const [openMenuUp, setOpenMenuUp] = useState(false);
    const [emojiOpenUp, setEmojiOpenUp] = useState(false);

    // Validate message before rendering - skip invalid messages
    if (!message || !message.senderId || message.senderId === 'U' || message.senderId === 'unknown' || message.senderId.length < 3) {
        console.log('⚠️ Skipping invalid message in MessageItem:', message?.senderId);
        return null;
    }

    // Skip messages without content (except system messages)
    if (!message.type || message.type !== 'SYSTEM_LOG') {
        if (!message.content || message.content.trim() === '') {
            console.log('⚠️ Skipping message without content in MessageItem');
            return null;
        }
    }

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

    // compute whether to open dropdowns upward based on available space
    const computeOpenUp = (elRef, estimatedHeight = 220) => {
        try {
            const el = elRef?.current;
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            return spaceBelow < estimatedHeight + 12;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const onResize = () => {
            if (bubbleRef.current) {
                setOpenMenuUp(computeOpenUp(bubbleRef, 220));
                setEmojiOpenUp(computeOpenUp(bubbleRef, 120));
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Render system log specially (prettify IDs to names when possible)
    if (message?.type === 'SYSTEM_LOG') {
        const prettifySystemContent = (raw) => {
            if (!raw || typeof raw !== 'string') return raw;
            // Replace any token that maps to a known user name
            return raw.split(/(\s+)/).map(token => {
                // Keep whitespace tokens untouched
                if (/^\s+$/.test(token)) return token;
                const name = getUserName?.(token);
                // getUserName returns token itself when unknown; only replace when different
                if (name && name !== token && name !== 'unknown') {
                    return name;
                }
                // If token looks like a UUID, don't show it - use fallback
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
                    return 'Người dùng';
                }
                return token;
            }).join('');
        };

        return (
            <div className="my-2 px-4">
                <div className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {prettifySystemContent(message.content)}
                </div>
            </div>
        );
    }

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
                await chatService.addReaction(message.id, emoji);
                // rely on WS broadcast; don't reload all messages
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
                await chatService.removeReaction(message.id);
                // rely on WS broadcast; don't reload all messages
            }
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    };

    const handleRemoveAllMyReactions = async () => {
        try {
            // Lấy tất cả emoji mà user hiện tại đã react
            const myReactions = reactions.filter(r => r.hasReacted);

            // Gửi request để xóa từng emoji
            for (const reaction of myReactions) {
                if (stompClient?.connected) {
                    stompClient.publish({
                        destination: chatWs.addReaction(conversationId),
                        body: JSON.stringify({
                            messageId: message.id,
                            userId: currentUserId,
                            emoji: reaction.emoji,
                            action: 'remove'
                        })
                    });
                } else {
                    await chatService.removeReaction(message.id);
                }
            }
            setShowReactionModal(false);
        } catch (error) {
            console.error('Error removing all reactions:', error);
        }
    };

    const handleDeleteForMe = async () => {
        try {
            // Optimistic update - hide message immediately
            onMessageUpdate?.('delete-for-me', message.id, currentUserId);

            // Then call API
            await chatService.deleteForMe(message.id);
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
                // rely on WS broadcast; don't reload all messages
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
                // rely on WS broadcast; don't reload all messages
            }
        } catch (error) {
            console.error('Error pinning message:', error);
        }
        setShowMenu(false);
    };

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(message.content || '');
            } else {
                // fallback
                const textarea = document.createElement('textarea');
                textarea.value = message.content || '';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
        } catch (err) {
            console.error('Copy failed', err);
        }
        setShowMenu(false);
    };



    const formatReactions = () => {
        if (!message.reactions) return [];
        return Object.entries(message.reactions).map(([emoji, users]) => ({
            emoji,
            count: users.length,
            hasReacted: users.includes(currentUserId),
            users: users // Lưu danh sách user IDs
        }));
    };

    // Tạo danh sách tất cả users đã react với thông tin chi tiết
    const getAllReactingUsers = () => {
        if (!message.reactions) return [];

        const userMap = new Map();

        // Duyệt qua tất cả reactions để thu thập thông tin users
        Object.entries(message.reactions).forEach(([emoji, userIds]) => {
            userIds.forEach(userId => {
                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        id: userId,
                        name: getUserName(userId),
                        emojis: []
                    });
                }
                userMap.get(userId).emojis.push(emoji);
            });
        });

        return Array.from(userMap.values());
    };

    const reactions = formatReactions();
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    // When any floating UI for this message is open, elevate the whole message
    // so its children (menu, emoji picker, modals) render above neighboring messages.
    const elevated = showMenu || showEmojiPicker || showReactionModal;

    return (
        <div className={`group relative ${elevated ? 'z-50' : ''} flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
            <div className={`flex items-end max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar for others */}
                {!isMe && (
                    <Avatar src={senderImg} name={senderName} size={8} className="mb-1" />
                )}

                <div className={`relative mt-2 ${isMe ? 'mr-2' : 'ml-2'}`}>
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
                        ref={bubbleRef}
                        className="relative"
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setOpenMenuUp(computeOpenUp(bubbleRef, 220));
                            setShowMenu(true);
                        }}
                    >
                        <div className={`relative px-3 py-2 rounded-2xl max-w-xs break-words ${isRecalled
                            ? isMe
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 italic border border-dashed border-blue-300 dark:border-blue-600"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic border border-dashed"
                            : isMe
                                ? "bg-blue-500 text-white"
                                : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                            }`}>
                            {isRecalled ? (
                                <span className="text-sm">Tin nhắn đã được thu hồi</span>
                            ) : (
                                <>
                                    {/* Sender name inside message bubble for others */}
                                    {!isMe && (
                                        <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                                            {senderName}
                                        </div>
                                    )}
                                    <div className="text-sm">
                                        {message.content}
                                    </div>
                                    {message.edited && (
                                        <span className="text-xs opacity-70 ml-2">(đã chỉnh sửa)</span>
                                    )}
                                    {/* Time inside message bubble */}
                                    <div className={`text-xs mt-1 ${isRecalled
                                        ? isMe
                                            ? 'text-blue-500 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                        : isMe
                                            ? 'text-blue-100'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        {message.pinned && (
                                            <span className="ml-1">📌</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Heart reaction button - positioned on bubble edge */}
                        {!isRecalled && (
                            <div className="relative">
                                <button
                                    className="absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
                                    title="Thả cảm xúc"
                                    style={{
                                        [isMe ? 'right' : 'right']: '12px'
                                    }}
                                    onMouseEnter={() => {
                                        setEmojiOpenUp(computeOpenUp(bubbleRef, 120));
                                        setShowEmojiPicker(true);
                                    }}
                                    onMouseLeave={() => setShowEmojiPicker(false)}
                                >
                                    <FaHeart className="w-4 h-4 text-red-500" />
                                </button>

                                {/* Emoji picker - appears on hover over heart */}
                                {showEmojiPicker && (
                                    <div
                                        className={`absolute z-30 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 px-3 ${emojiOpenUp ? 'bottom-full mb-2' : 'top-full mt-2'} ${isMe ? 'right-0' : 'left-0'}`}
                                        style={{
                                            [isMe ? 'right' : 'left']: '-12px'
                                        }}
                                        onMouseEnter={() => setShowEmojiPicker(true)}
                                        onMouseLeave={() => setShowEmojiPicker(false)}
                                    >
                                        <div className="flex gap-2 items-center">
                                            {emojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(emoji)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-xl transition-colors"
                                                    title={`Thả cảm xúc ${emoji}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action buttons container - Reply and Menu */}
                        {!isRecalled && (
                            <div className={`absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ${isMe ? '-left-20' : '-right-20'
                                }`}>
                                {/* Reply button */}
                                <button
                                    onClick={() => {
                                        onReply?.(message);
                                        setShowMenu(false);
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                                    title="Trả lời"
                                >
                                    <FaReply className="w-4 h-4 text-gray-500" />
                                </button>

                                {/* Three dots menu button with relative wrapper */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            if (!showMenu) setOpenMenuUp(computeOpenUp(bubbleRef, 220));
                                            setShowMenu(!showMenu);
                                        }}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                                    >
                                        <FaEllipsisV className="w-4 h-4 text-gray-500" />
                                    </button>

                                    {/* Menu dropdown - positioned next to 3 dots button */}
                                    {showMenu && (
                                        <div
                                            ref={menuRef}
                                            className={`absolute right-0 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] ${openMenuUp ? 'bottom-full mb-2' : 'mt-2'}`}
                                        >
                                            {/* Copy */}
                                            <button
                                                onClick={handleCopy}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <FaRegCopy className="w-4 h-4" />
                                                Copy tin nhắn
                                            </button>

                                            {/* Pin */}
                                            <button
                                                onClick={handlePin}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <FaThumbtack className="w-4 h-4" />
                                                {message.pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                            </button>
                                            {/* Delete for me (red) */}
                                            <button
                                                onClick={handleDeleteForMe}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                            >
                                                <FaRegTrashAlt className="w-4 h-4" />
                                                Xóa chỉ ở phía tôi
                                            </button>

                                            {isMe && (
                                                <button
                                                    onClick={handleRecall}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                                >
                                                    <FaUndo className="w-4 h-4" />
                                                    Thu hồi tin nhắn
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {reactions.length > 0 && (
                            <button
                                onClick={() => setShowReactionModal(true)}
                                className="flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                            >
                                {/* Hiển thị tối đa 3 emoji khác nhau */}
                                {reactions.slice(0, 3).map(({ emoji }) => (
                                    <span key={emoji} className="text-sm mr-1">
                                        {emoji}
                                    </span>
                                ))}
                                {/* Tổng số reaction */}
                                <span className="text-xs font-medium">
                                    {reactions.reduce((sum, r) => sum + r.count, 0)}
                                </span>
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Reaction Details Modal */}
            {showReactionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Biểu cảm</h3>
                            <button
                                onClick={() => setShowReactionModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FaTimes className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {/* User Reactions */}


                            {/* Danh sách tất cả users đã react */}
                            {getAllReactingUsers().map((user) => (
                                <div key={user.id} className={`flex items-center justify-between mb-2 p-2 rounded-lg ${user.id === currentUserId
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}>
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 ${user.id === currentUserId ? 'bg-blue-500' : 'bg-gray-500'
                                            }`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        {user.emojis.map((emoji) => (
                                            <span key={emoji} className="text-sm mr-1">{emoji}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        {reactions.some(r => r.hasReacted) && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <button
                                    onClick={handleRemoveAllMyReactions}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                >
                                    Hủy tất cả biểu cảm của tôi
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
