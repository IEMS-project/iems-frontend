import React from "react";

export default function TypingIndicator({ typingUsers, getUserName }) {
    const userIds = Object.keys(typingUsers || {});
    if (!userIds.length) return null;

    const primaryName = getUserName(userIds[0]);
    const othersCount = userIds.length - 1;

    let text = "";
    if (othersCount <= 0) {
        text = `${primaryName}`;
    } else if (othersCount === 1) {
        const secondName = getUserName(userIds[1]);
        text = `${primaryName} và ${secondName}`;
    } else {
        text = `${primaryName} và ${othersCount} người khác`;
    }

    return (
        <div className="bottom-20 left-4 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full flex items-center space-x-3 shadow-lg text-sm text-gray-700 dark:text-gray-200 z-50">
            <span>{text} đang nhập</span>
            <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounceTyping"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounceTyping200"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounceTyping400"></span>
            </span>
        </div>
    );
}
