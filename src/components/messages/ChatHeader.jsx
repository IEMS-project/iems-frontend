import React from "react";
import Avatar from "../ui/Avatar";

export default function ChatHeader({ selectedChat }) {
    if (!selectedChat) return null;

    return (
        <div className="p-4 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex items-center space-x-3">
                <Avatar size="md" className={selectedChat.type === "group" ? "bg-purple-500" : ""}>
                    {selectedChat.avatar}
                </Avatar>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedChat.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedChat.type === "group" 
                            ? `${selectedChat.members.length} thành viên` 
                            : selectedChat.status === "online" ? "Đang hoạt động" : "Không hoạt động"
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}


