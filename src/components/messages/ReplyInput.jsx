import React from "react";

export default function ReplyInput({ 
    replyingTo, 
    onCancelReply, 
    getUserName 
}) {
    if (!replyingTo) return null;

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

    const renderPreview = () => {
        const content = replyingTo.content || '';
        const type = (replyingTo.type || '').toUpperCase();
        if (type === 'IMAGE') return '[Ảnh]';
        if (type === 'VIDEO') return '[Video]';
        if (type === 'FILE') return `[Tệp] ${stripTsPrefixFromUrl(content)}`;
        if (/^https?:\/\//i.test(content)) {
            const name = stripTsPrefixFromUrl(content);
            const ext = (name.split('.').pop() || '').toLowerCase();
            if (["jpg","jpeg","png","gif","webp","bmp","svg"].includes(ext)) return '[Ảnh]';
            if (["mp4","mov","m4v","webm","avi","mkv"].includes(ext)) return '[Video]';
            return `[Tệp] ${name}`;
        }
        return content;
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 mx-4 mb-2 rounded-r-lg">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    {/* Reply icon */}
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Trả lời {getUserName(replyingTo.senderId)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                            {renderPreview()}
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={onCancelReply}
                    className="ml-2 p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-full flex-shrink-0"
                    title="Hủy trả lời"
                >
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
