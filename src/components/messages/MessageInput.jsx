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
        <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
