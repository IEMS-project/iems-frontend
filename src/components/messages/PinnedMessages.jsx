import React, { useState, useEffect } from "react";
import { chatService } from "../../services/chatService";
import Avatar from "../ui/Avatar";

export default function PinnedMessages({ 
    conversationId, 
    isVisible, 
    onClose, 
    getUserName,
    getUserImage,
    onMessageClick,
    onUnpinMessage,
    currentUserId
}) {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [loading, setLoading] = useState(false);

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
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Tin nhắn đã ghim
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Đang tải...</p>
                        </div>
                    ) : pinnedMessages.length === 0 ? (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
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
}



