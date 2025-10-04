import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { chatService } from "../../services/chatService";
import Avatar from "../ui/Avatar";
import { FaThumbtack, FaTimes, FaSpinner, FaBookmark } from "react-icons/fa";

const PinnedMessages = forwardRef(function PinnedMessages({ 
    conversationId, 
    isVisible, 
    onClose, 
    getUserName,
    getUserImage,
    onMessageClick,
    onUnpinMessage,
    currentUserId
}, ref) {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // Expose updatePinnedMessages function to parent via ref
    useImperativeHandle(ref, () => ({
        updatePinnedMessages: (newPinnedMessages) => {
            setPinnedMessages(newPinnedMessages || []);
        }
    }));

    useEffect(() => {
        if (isVisible && conversationId) {
            loadPinnedMessages();
        }
    }, [isVisible, conversationId]);

    const loadPinnedMessages = async () => {
        try {
            setLoading(true);
            const messages = await chatService.getPinnedMessages(conversationId);
            setPinnedMessages(messages || []);
        } catch (error) {
            console.error('Error loading pinned messages:', error);
            setPinnedMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUnpinMessage = async (messageId) => {
        try {
            await onUnpinMessage?.(conversationId, messageId);
            // Remove from local state immediately
            setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Error unpinning message:', error);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Hôm qua';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }
    };

    const truncateContent = (content, maxLength = 50) => {
        if (!content) return '';
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <FaThumbtack className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Tin nhắn đã ghim
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                            <p className="text-gray-500 mt-2">Đang tải...</p>
                        </div>
                    ) : pinnedMessages.length === 0 ? (
                        <div className="text-center py-8">
                            <FaBookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Chưa có tin nhắn nào được ghim</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pinnedMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                    onClick={() => onMessageClick?.(message)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <Avatar 
                                            src={getUserImage?.(message.senderId)} 
                                            name={getUserName(message.senderId)} 
                                            size={8} 
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Header with sender name and time */}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {getUserName(message.senderId)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatTime(message.sentAt)}
                                                </div>
                                            </div>
                                            
                                            {/* Message content */}
                                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                {truncateContent(message.content)}
                                            </div>
                                            
                                            {/* Footer with pin info and actions */}
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-gray-500">
                                                    Ghim bởi {getUserName(message.pinnedBy)}
                                                </div>
                                                
                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {/* Go to message button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMessageClick?.(message);
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        Đi tới tin nhắn
                                                    </button>
                                                    
                                                    {/* Unpin button (if user has permission) */}
                                                    {(message.pinnedBy === currentUserId || message.senderId === currentUserId) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUnpinMessage(message.id);
                                                            }}
                                                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Bỏ ghim
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default PinnedMessages;



