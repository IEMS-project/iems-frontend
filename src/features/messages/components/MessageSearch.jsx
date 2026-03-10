import React, { useState, useEffect } from "react";
import { chatService } from "@/features/messages/api/chatService";
import Avatar from "@/components/ui/Avatar.jsx";
import Skeleton from "@/components/ui/Skeleton";
import { Search, X, Loader2 } from "lucide-react";

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
        return text.replace(regex, '<mark class="bg-muted text-foreground font-medium">$1</mark>');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-foreground" />
                        <h3 className="text-lg font-semibold text-foreground">
                            Tìm kiếm tin nhắn
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-border">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!searchQuery.trim() || loading}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    Tìm kiếm
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && searchResults.length === 0 ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className="rounded-lg border border-dashed border-border p-3">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-3 w-1/5" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length === 0 && searchQuery ? (
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Không tìm thấy tin nhắn nào</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground mb-4">
                                Tìm thấy {total} kết quả
                            </div>
                            
                            {searchResults.map((result) => (
                                <div
                                    key={result.id}
                                    className="bg-muted rounded-lg p-3 hover:bg-muted/80 transition-colors cursor-pointer"
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
                                                <div className="text-sm font-medium text-foreground">
                                                    {getUserName(result.senderId)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatTime(result.sentAt)}
                                                </div>
                                            </div>
                                            
                                            {/* Message content with highlighted keyword */}
                                            <div 
                                                className="text-sm text-foreground"
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
                                        className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 border border-border"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="animate-spin h-4 w-4" />
                                                Đang tải...
                                            </span>
                                        ) : (
                                            'Tải thêm'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nhập từ khóa để tìm kiếm tin nhắn</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
