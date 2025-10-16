import React from "react";
import Button from "../ui/Button";

export default function MessageInput({ messageInput, setMessageInput, onSendMessage }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex space-x-2">
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400"
                    rows={2}
                />
                <Button 
                    onClick={onSendMessage}
                    disabled={!messageInput.trim()}
                    className="px-6"
                >
                    Gửi
                </Button>
            </div>
        </div>
    );
}


