import React, { useState, useRef, useEffect } from "react";
import MediaPreviewModal from "./MediaPreviewModal";
import Avatar from "@/components/ui/Avatar.jsx";
import { chatService, chatWs } from "@/features/messages/api/chatService";
import {
    Copy,
    Trash2,
    Undo2,
    Pin,
    Heart,
    Reply,
    MoreVertical,
    X,
    Check
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Simple in-memory cache for file sizes keyed by URL
const fileSizeCache = new Map();

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) return null;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
        val /= 1024;
        i++;
    }
    return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

export default function MessageItem({
    message,
    currentUserId,
    getUserName,
    getUserImage,
    onReply,
    stompClient,
    conversationId,
    onMessageUpdate,
    onJumpToMessage,
    showAvatar = true,
    showName = true,
    showTime = true
}) {
    const { t } = useTranslation();
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactionModal, setShowReactionModal] = useState(false);
    const menuRef = useRef(null);
    const bubbleRef = useRef(null);
    const [openMenuUp, setOpenMenuUp] = useState(false);
    const [emojiOpenUp, setEmojiOpenUp] = useState(false);
    const hideEmojiTimeoutRef = useRef(null);

    // Validate and derive booleans without early-returning (keep hooks order stable)
    const invalidSender = !message || !message.senderId || message.senderId === 'U' || message.senderId === 'unknown' || message.senderId.length < 3;
    const isSystemLog = (message?.type || '') === 'SYSTEM_LOG';
    const isEmptyNonSystem = !isSystemLog && (!message?.content || (message.content + '').trim() === '');

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
        return () => {
            window.removeEventListener('resize', onResize);
            if (hideEmojiTimeoutRef.current) {
                clearTimeout(hideEmojiTimeoutRef.current);
            }
        };
    }, []);

    // Don't render deleted messages or invalid/empty ones
    const shouldHide = isDeletedForMe || invalidSender || isEmptyNonSystem;

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

    const [previewMedia, setPreviewMedia] = useState({ isOpen: false, url: "", type: "" });
    const [fileSizeText, setFileSizeText] = useState(null);

    const stripTsPrefixFromUrl = (url) => {
        try {
            const decoded = decodeURIComponent(url || '');
            const last = decoded.substring(decoded.lastIndexOf('/') + 1);
            const hyphen = last.indexOf('-');
            const leading = hyphen > 0 ? last.substring(0, hyphen) : '';
            if (/^\d{10,17}$/.test(leading)) return last.substring(hyphen + 1) || last;
            return last || decoded;
        } catch (_) { return url || 'Tệp'; }
    };

    const renderReplyPreview = () => {
        const content = message.replyToContent || '';
        const type = (message.replyToType || '').toUpperCase();
        if (type === 'IMAGE') return <span className="text-muted-foreground">{t('messages.reply.image')}</span>;
        if (type === 'VIDEO') return <span className="text-muted-foreground">{t('messages.reply.video')}</span>;
        if (type === 'FILE') {
            const name = stripTsPrefixFromUrl(content);
            return <span className="text-muted-foreground">{t('messages.reply.file', { fileName: name })}</span>;
        }
        if (/^https?:\/\//i.test(content)) {
            const name = stripTsPrefixFromUrl(content);
            const ext = (name.split('.').pop() || '').toLowerCase();
            if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return <span className="text-muted-foreground">{t('messages.reply.image')}</span>;
            if (["mp4", "mov", "m4v", "webm", "avi", "mkv"].includes(ext)) return <span className="text-muted-foreground">{t('messages.reply.video')}</span>;
            return <span className="text-muted-foreground">{t('messages.reply.file', { fileName: name })}</span>;
        }
        return <span className="text-muted-foreground">{content}</span>;
    };

    // When any floating UI for this message is open, elevate the whole message
    // so its children (menu, emoji picker, modals) render above neighboring messages.
    const elevated = showMenu || showEmojiPicker || showReactionModal;

    // Try to resolve file size for FILE messages
    useEffect(() => {
        const msgType = (message.type || '').toUpperCase();
        if (msgType !== 'FILE') {
            setFileSizeText(null);
            return;
        }
        const url = message.content || '';
        // Prefer explicit size from message when available
        const explicitSize = message.fileSizeBytes || message.fileSize || message.sizeBytes || message.metadata?.size;
        if (Number.isFinite(explicitSize)) {
            setFileSizeText(formatBytes(Number(explicitSize)));
            return;
        }
        if (!url || url.startsWith('blob:')) {
            setFileSizeText(null);
            return;
        }
        if (fileSizeCache.has(url)) {
            setFileSizeText(fileSizeCache.get(url));
            return;
        }
        let aborted = false;
        (async () => {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(timer);
                const len = res.headers.get('content-length');
                const sizeText = len ? formatBytes(Number(len)) : null;
                if (!aborted) {
                    if (sizeText) fileSizeCache.set(url, sizeText);
                    setFileSizeText(sizeText);
                }
            } catch {
                if (!aborted) setFileSizeText(null);
            }
        })();
        return () => { aborted = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message.type, message.content]);

    return (
        <>
            {/* System log render */}
            {isSystemLog && !invalidSender && (
                <div className="my-2 px-4">
                    <div className="text-center text-xs font-semibold text-muted-foreground">
                        {(() => {
                            const raw = message?.content;
                            if (!raw || typeof raw !== 'string') return raw;
                            return raw.split(/(\s+)/).map(token => {
                                if (/^\s+$/.test(token)) return token;
                                const name = getUserName?.(token);
                                if (name && name !== token && name !== 'unknown') return name;
                                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return t('messages.messageItem.user', 'Người dùng');
                                return token;
                            }).join('');
                        })()}
                    </div>
                </div>
            )}

            {/* Regular message render */}
            {!isSystemLog && !shouldHide && (
                <div className={`group relative ${elevated ? 'z-50' : ''} flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mb-2' : 'mb-1'} px-4`}>
                    <div className={`flex  items-start max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar for others */}
                        {!isMe && showAvatar && (
                            <Avatar src={senderImg} name={senderName} size={8} className="mb-1" />
                        )}
                        {!isMe && !showAvatar && (
                            <div className="w-8 mb-1" />
                        )}

                        <div className={`relative ${isMe ? 'mr-2' : 'ml-2'}`}>
                            {/* Reply indicator */}
                            {message.replyToMessageId && !isRecalled && (
                                <div className={`text-xs mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                    <div
                                        className="bg-muted rounded-lg p-2 border-l-2 border-border max-w-xs cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => onJumpToMessage?.(message.replyToMessageId)}
                                        title={t('messages.messageItem.clickToViewOriginal', 'Nhấn để xem tin nhắn gốc')}
                                    >
                                        <div className="text-foreground font-medium text-xs">
                                            {getUserName(message.replyToSenderId)}
                                        </div>
                                        <div className="text-muted-foreground text-xs truncate">
                                            {renderReplyPreview()}
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
                                { /* Different container styles for media vs text */}
                                <div className={`relative ${isRecalled
                                    ? 'px-3 py-2 max-w-xs break-words'
                                    : (['IMAGE', 'VIDEO'].includes((message.type || '').toUpperCase())
                                        ? 'p-1 max-w-sm'
                                        : 'px-3 py-2 max-w-xs break-words')} rounded-lg ${isRecalled
                                            ? isMe
                                                ? "bg-muted text-muted-foreground italic border border-dashed border-border"
                                                : "bg-muted text-muted-foreground italic border border-dashed border-border"
                                            : isMe
                                                ? (['IMAGE', 'VIDEO'].includes((message.type || '').toUpperCase()) ? 'bg-transparent' : 'bg-foreground text-background')
                                                : (['IMAGE', 'VIDEO'].includes((message.type || '').toUpperCase()) ? 'bg-transparent' : 'bg-muted text-foreground')
                                    }`}>
                                    {isRecalled ? (
                                        <span className="text-sm">{t('messages.messageItem.recalled')}</span>
                                    ) : (
                                        <>
                                            {/* Sender name inside message bubble for others */}
                                            {!isMe && showName && (
                                                <div className="text-xs font-medium mb-1 text-foreground">
                                                    {senderName}
                                                </div>
                                            )}
                                            <div className="text-sm">
                                                {(() => {
                                                    const msgType = (message.type || '').toUpperCase();
                                                    if (msgType === 'IMAGE') {
                                                        return (
                                                            <div className="overflow-hidden rounded-xl border border-border bg-muted/50">
                                                                <img
                                                                    src={message.content}
                                                                    alt="image"
                                                                    className="max-w-xs cursor-pointer hover:opacity-90 transition"
                                                                    loading="lazy"
                                                                    onClick={() => setPreviewMedia({ isOpen: true, url: message.content, type: 'IMAGE' })}
                                                                />
                                                            </div>
                                                        );
                                                    }
                                                    if (msgType === 'VIDEO') {
                                                        return (
                                                            <div className="overflow-hidden rounded-xl border border-border bg-black">
                                                                <video
                                                                    className="max-w-xs cursor-pointer"
                                                                    onClick={() => setPreviewMedia({ isOpen: true, url: message.content, type: 'VIDEO' })}
                                                                    controls
                                                                    preload="metadata"
                                                                >
                                                                    <source src={message.content} />
                                                                </video>
                                                            </div>
                                                        );
                                                    }
                                                    if (msgType === 'FILE') {
                                                        const url = message.content || '';
                                                        let name = t('messages.messageItem.fileAttachment', 'Tệp đính kèm');
                                                        try {
                                                            if (!url.startsWith('blob:')) {
                                                                const decoded = decodeURIComponent(url);
                                                                const lastSlash = decoded.lastIndexOf('/') + 1;
                                                                const lastSegment = decoded.substring(lastSlash) || '';
                                                                const hyphenIdx = lastSegment.indexOf('-');
                                                                const leading = hyphenIdx > 0 ? lastSegment.substring(0, hyphenIdx) : '';
                                                                name = /^\d{10,17}$/.test(leading) ? (lastSegment.substring(hyphenIdx + 1) || lastSegment) : (lastSegment || 'Tệp đính kèm');
                                                            }
                                                        } catch (_) { }
                                                        const linkCls = isMe ? 'text-background hover:underline' : 'text-foreground underline';
                                                        return (
                                                            <div className={`flex items-start gap-3`}>
                                                                <span className="inline-flex w-8 h-8 items-center justify-center rounded bg-muted text-muted-foreground text-xs">FILE</span>
                                                                <div className="flex flex-col min-w-0">
                                                                    <a href={url} target="_blank" rel="noreferrer" className={`truncate ${linkCls}`} title={name}>{name}</a>
                                                                    {fileSizeText && (
                                                                        <span className={`text-xs ${isMe ? 'text-background/70' : 'text-muted-foreground'}`}>{fileSizeText}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return (<>{message.content}</>);
                                                })()}
                                            </div>
                                            {message.edited && (
                                                <span className="text-xs opacity-70 ml-2">{t('messages.messageItem.edited')}</span>
                                            )}
                                            {/* Time inside message bubble (hidden for my IMAGE/VIDEO) */}
                                            {showTime && !(isMe && ['IMAGE', 'VIDEO'].includes((message.type || '').toUpperCase())) && (
                                                <div className={`text-xs mt-1 ${isRecalled
                                                    ? 'text-muted-foreground'
                                                    : isMe
                                                        ? 'text-background/70'
                                                        : 'text-muted-foreground'
                                                    }`}>
                                                    {new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    {message.pinned && (
                                                        <span className="ml-1">📌</span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Heart reaction button - positioned on bubble edge */}
                                {!isRecalled && (
                                    <div
                                        className="relative"
                                        onMouseEnter={() => {
                                            if (hideEmojiTimeoutRef.current) {
                                                clearTimeout(hideEmojiTimeoutRef.current);
                                            }
                                            setEmojiOpenUp(computeOpenUp(bubbleRef, 120));
                                            setShowEmojiPicker(true);
                                        }}
                                        onMouseLeave={() => {
                                            if (hideEmojiTimeoutRef.current) {
                                                clearTimeout(hideEmojiTimeoutRef.current);
                                            }
                                            hideEmojiTimeoutRef.current = setTimeout(() => {
                                                setShowEmojiPicker(false);
                                            }, 150);
                                        }}
                                    >
                                        <button
                                            className="absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-full bg-card shadow-md border border-border"
                                            title={t('messages.messageItem.react', 'Thả cảm xúc')}
                                            style={{
                                                [isMe ? 'right' : 'right']: '12px'
                                            }}
                                        >
                                            <Heart className="w-4 h-4 text-destructive" />
                                        </button>

                                        {/* Emoji picker - appears on hover over heart */}
                                        {showEmojiPicker && (
                                            <div
                                                className={`absolute z-30 bg-card rounded-2xl shadow-xl border border-border py-2 px-3 ${emojiOpenUp ? 'bottom-full mb-2' : 'top-full mt-2'} ${isMe ? 'right-0' : 'left-0'}`}
                                                style={{
                                                    [isMe ? 'right' : 'left']: '-12px'
                                                }}
                                            >
                                                <div className="flex gap-2 items-center">
                                                    {emojis.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(emoji)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-xl transition-colors"
                                                            title={t('messages.messageItem.reactWith', { emoji })}
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
                                            className="p-1 hover:bg-muted rounded-full"
                                            title={t('messages.messageItem.reply')}
                                        >
                                            <Reply className="w-4 h-4 text-muted-foreground" />
                                        </button>

                                        {/* Three dots menu button with relative wrapper */}
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    if (!showMenu) setOpenMenuUp(computeOpenUp(bubbleRef, 220));
                                                    setShowMenu(!showMenu);
                                                }}
                                                className="p-1 hover:bg-muted rounded-full"
                                            >
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </button>

                                            {/* Menu dropdown - positioned next to 3 dots button */}
                                            {showMenu && (
                                                <div
                                                    ref={menuRef}
                                                    className={`absolute right-0 z-20 bg-card rounded-lg shadow-lg border border-border py-1 min-w-[200px] ${openMenuUp ? 'bottom-full mb-2' : 'mt-2'}`}
                                                >
                                                    {/* Copy */}
                                                    <button
                                                        onClick={handleCopy}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        {t('messages.messageItem.copy')}
                                                    </button>

                                                    {/* Pin */}
                                                    <button
                                                        onClick={handlePin}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                                                    >
                                                        <Pin className="w-4 h-4" />
                                                        {message.pinned ? t('messages.messageItem.unpin') : t('messages.messageItem.pin')}
                                                    </button>
                                                    {/* Delete for me (red) */}
                                                    <button
                                                        onClick={handleDeleteForMe}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        {t('messages.messageItem.deleteForMe')}
                                                    </button>

                                                    {isMe && (
                                                        <button
                                                            onClick={handleRecall}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                                        >
                                                            <Undo2 className="w-4 h-4" />
                                                            {t('messages.messageItem.recall')}
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
                                        className="flex items-center px-2 py-0.5 rounded-full bg-muted border border-border shadow-sm hover:bg-muted/80 transition-colors cursor-pointer"
                                    >
                                        {/* Hiển thị tối đa 3 emoji khác nhau */}
                                        {reactions.slice(0, 3).map(({ emoji }) => (
                                            <span key={emoji} className="text-sm mr-1">
                                                {emoji}
                                            </span>
                                        ))}
                                        {/* Tổng số reaction */}
                                        <span className="text-xs font-medium text-foreground">
                                            {reactions.reduce((sum, r) => sum + r.count, 0)}
                                        </span>
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Reaction Details Modal */}
                    {showReactionModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 border border-border">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border">
                                    <h3 className="text-lg font-semibold text-foreground">{t('messages.messageItem.reactions')}</h3>
                                    <button
                                        onClick={() => setShowReactionModal(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* User Reactions */}


                                    {/* Danh sách tất cả users đã react */}
                                    {getAllReactingUsers().map((user) => (
                                        <div key={user.id} className={`flex items-center justify-between mb-2 p-2 rounded-lg ${user.id === currentUserId
                                            ? 'bg-muted'
                                            : 'hover:bg-muted/50'
                                            }`}>
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mr-3 ${user.id === currentUserId ? 'bg-primary' : 'bg-muted-foreground'
                                                    }`}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">
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
                                    <div className="border-t border-border p-4">
                                        <button
                                            onClick={handleRemoveAllMyReactions}
                                            className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                                        >
                                            {t('messages.messageItem.removeAllMyReactions')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!isSystemLog && !shouldHide && (
                <MediaPreviewModal
                    isOpen={previewMedia.isOpen}
                    mediaUrl={previewMedia.url}
                    mediaType={previewMedia.type}
                    messageId={message.id}
                    senderId={message.senderId}
                    senderName={senderName}
                    senderImage={senderImg}
                    sentAt={message.sentAt}
                    onReplyMessage={(msg) => {
                        onReply?.({
                            ...message,
                            id: msg.id,
                            content: msg.content,
                            type: msg.type,
                            senderId: msg.senderId,
                            sentAt: msg.sentAt
                        });
                        setPreviewMedia({ isOpen: false, url: "", type: "" });
                    }}
                    getUserName={getUserName}
                    getUserImage={getUserImage}
                    onViewUser={() => { }}
                    onPrev={undefined}
                    onNext={undefined}
                    onClose={() => setPreviewMedia({ isOpen: false, url: "", type: "" })}
                />
            )}
        </>
    );
}

// Render media preview modal at the end to avoid z-index conflicts
// We attach it outside of the returned bubble content so it overlays properly
export function MessageItemWithPreview(props) {
    return <MessageItem {...props} />;
}
