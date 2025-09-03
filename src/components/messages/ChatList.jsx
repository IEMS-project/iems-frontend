import React from "react";
import Avatar from "../ui/Avatar";

export default function ChatList({ 
    chats, 
    selectedChat, 
    onChatSelect, 
    activeTab, 
    onTabChange,
    searchQuery,
    onSearchChange
}) {
    return (
        <div className="w-80 border-r border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tin nhắn</h2>
                
                {/* Search */}
                <div className="mt-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-3 flex space-x-1">
                    <button
                        onClick={() => onTabChange("all")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            activeTab === "all"
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => onTabChange("groups")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            activeTab === "groups"
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Nhóm
                    </button>
                    <button
                        onClick={() => onTabChange("individuals")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            activeTab === "individuals"
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Cá nhân
                    </button>
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <p>Không tìm thấy cuộc trò chuyện nào</p>
                    </div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => onChatSelect(chat)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedChat?.id === chat.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="relative">
                                    <Avatar size="md" className={chat.type === "group" ? "bg-purple-500" : ""}>
                                        {chat.avatar}
                                    </Avatar>
                                    {chat.type === "individual" && (
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                            chat.status === "online" ? "bg-green-500" :
                                            chat.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                                        }`}></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                            {chat.name}
                                        </h3>
                                        <span className="text-xs text-gray-500">{chat.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate mt-1">
                                        {chat.lastSender}: {chat.lastMessage}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {chat.type === "group" ? `${chat.members.length} thành viên` : chat.status}
                                            </span>
                                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                                                {chat.unreadCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
