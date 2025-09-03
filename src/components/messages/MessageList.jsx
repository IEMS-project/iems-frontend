import React from "react";
import Avatar from "../ui/Avatar";

export default function MessageList({ messages }) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex ${msg.sender === "Bạn" ? "justify-end" : "justify-start"}`}
                >
                    <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                        msg.sender === "Bạn" ? "flex-row-reverse space-x-reverse" : ""
                    }`}>
                        {msg.sender !== "Bạn" && (
                            <Avatar size="sm">{msg.avatar}</Avatar>
                        )}
                        <div className={`px-4 py-2 rounded-lg ${
                            msg.sender === "Bạn"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                        }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
                                msg.sender === "Bạn" ? "text-blue-100" : "text-gray-500"
                            }`}>
                                {msg.timestamp}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
