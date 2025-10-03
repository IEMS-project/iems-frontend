import React, { useState, useEffect } from "react";
import { chatService } from "../../services/chatService";

export default function PinnedMessagesBanner({ 
    conversationId, 
    getUserName,
    onMessageClick,
    onShowAllPinned
}) {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

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
            setCurrentIndex(0);
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
        if (currentIndex >= (newPinnedMessages || []).length) {
            setCurrentIndex(0);
        }
    };

    // Expose update function to parent component
    useEffect(() => {
        if (onShowAllPinned) {
            onShowAllPinned.updatePinnedMessages = updatePinnedMessages;
        }
    }, [onShowAllPinned]);

    const nextMessage = () => {
        if (pinnedMessages.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
        }
    };

    const prevMessage = () => {
        if (pinnedMessages.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
        }
    };

    const closeBanner = () => {
        setIsVisible(false);
    };

    if (!isVisible || pinnedMessages.length === 0) {
        return null;
    }

    const currentMessage = pinnedMessages[currentIndex];

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Pin icon */}
                    <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>

                    {/* Message content */}
                    <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onMessageClick?.(currentMessage)}
                    >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            Tin nhắn đã ghim • {getUserName(currentMessage.senderId)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {currentMessage.content}
                        </div>
                    </div>

                    {/* Show all pinned button */}
                    {pinnedMessages.length > 1 && (
                        <button
                            onClick={() => onShowAllPinned?.()}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-800/50"
                        >
                            Xem tất cả
                        </button>
                    )}

                    {/* Navigation buttons */}
                    {pinnedMessages.length > 1 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={prevMessage}
                                className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 rounded"
                                title="Tin nhắn ghim trước"
                            >
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            
                            <span className="text-xs text-gray-500 px-2">
                                {currentIndex + 1}/{pinnedMessages.length}
                            </span>
                            
                            <button
                                onClick={nextMessage}
                                className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 rounded"
                                title="Tin nhắn ghim tiếp theo"
                            >
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={closeBanner}
                        className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 rounded flex-shrink-0"
                        title="Đóng"
                    >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}



