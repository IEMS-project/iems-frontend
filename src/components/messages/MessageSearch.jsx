import React, { useState, useEffect } from "react";
import { chatService } from "../../services/chatService";
import Avatar from "../ui/Avatar";

export default function MessageSearch({ 
    conversationId, 
    isVisible, 
    onClose, 
    getUserName,
    getUserImage,
    onMessageClick,
    currentUserId
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (isVisible && conversationId) {
            setSearchQuery("");
            setSearchResults([]);
            setPage(0);
            setHasMore(false);
            setTotal(0);
        }
    }, [isVisible, conversationId]);

    const handleSearch = async (query, pageNum = 0) => {
        if (!query.trim() || !conversationId) return;

        try {
            setLoading(true);
            const result = await chatService.searchMessages(conversationId, query, pageNum, 20);
            
            if (pageNum === 0) {
                setSearchResults(result.messages || []);
            } else {
                setSearchResults(prev => [...prev, ...(result.messages || [])]);
            }
            
            setHasMore(result.hasMore || false);
            setTotal(result.total || 0);
            setPage(pageNum);
        } catch (error) {
            console.error('Error searching messages:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            handleSearch(searchQuery.trim(), 0);
        }
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            handleSearch(searchQuery, page + 1);
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

    const highlightKeyword = (text, keyword) => {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Tìm kiếm tin nhắn
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

                {/* Search Input */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!searchQuery.trim() || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                'Tìm kiếm'
                            )}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && searchResults.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Đang tìm kiếm...</p>
                        </div>
                    ) : searchResults.length === 0 && searchQuery ? (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-gray-500">Không tìm thấy tin nhắn nào</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-3">
                            <div className="text-sm text-gray-500 mb-4">
                                Tìm thấy {total} kết quả
                            </div>
                            
                            {searchResults.map((result) => (
                                <div
                                    key={result.id}
                                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                    onClick={() => onMessageClick?.(result)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <Avatar 
                                            src={getUserImage?.(result.senderId)} 
                                            name={getUserName(result.senderId)} 
                                            size={8} 
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Header with sender name and time */}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {getUserName(result.senderId)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatTime(result.sentAt)}
                                                </div>
                                            </div>
                                            
                                            {/* Message content with highlighted keyword */}
                                            <div 
                                                className="text-sm text-gray-700 dark:text-gray-300"
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightKeyword(result.snippet, searchQuery)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Load more button */}
                            {hasMore && (
                                <div className="text-center pt-4">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Đang tải...' : 'Tải thêm'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-gray-500">Nhập từ khóa để tìm kiếm tin nhắn</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
