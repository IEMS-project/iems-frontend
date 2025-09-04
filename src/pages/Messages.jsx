import React, { useState, useMemo } from "react";
import ChatList from "../components/messages/ChatList";
import ChatHeader from "../components/messages/ChatHeader";
import MessageList from "../components/messages/MessageList";
import MessageInput from "../components/messages/MessageInput";
import EmptyChat from "../components/messages/EmptyChat";
import PageHeader from "../components/common/PageHeader";

const initialChats = {
    groups: [
        {
            id: "g1",
            name: "Team Phát triển",
            type: "group",
            lastMessage: "Ai review code cho tôi với?",
            lastSender: "Nguyễn Văn A",
            timestamp: "14:30",
            unreadCount: 3,
            avatar: "TP",
            members: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"]
        },
        {
            id: "g2",
            name: "Marketing Team",
            type: "group",
            lastMessage: "Chiến dịch mới sẽ launch tuần sau",
            lastSender: "Dương Văn N",
            timestamp: "12:15",
            unreadCount: 0,
            avatar: "MT",
            members: ["Dương Văn N", "Võ Thị O", "Tô Văn P"]
        },
        {
            id: "g3",
            name: "Design Review",
            type: "group",
            lastMessage: "UI mới đã được approve",
            lastSender: "Ngô Văn I",
            timestamp: "09:45",
            unreadCount: 1,
            avatar: "DR",
            members: ["Ngô Văn I", "Đinh Thị K", "Lý Văn L"]
        }
    ],
    individuals: [
        {
            id: "i1",
            name: "Nguyễn Văn A",
            type: "individual",
            lastMessage: "Code review xong rồi, merge thôi",
            lastSender: "Nguyễn Văn A",
            timestamp: "15:20",
            unreadCount: 0,
            avatar: "A",
            status: "online"
        },
        {
            id: "i2",
            name: "Trần Thị B",
            type: "individual",
            lastMessage: "Bug đã fix xong, test lại nhé",
            lastSender: "Trần Thị B",
            timestamp: "13:45",
            unreadCount: 2,
            avatar: "B",
            status: "online"
        },
        {
            id: "i3",
            name: "Lê Văn C",
            type: "individual",
            lastMessage: "Meeting 3h chiều nhé",
            lastSender: "Lê Văn C",
            timestamp: "11:30",
            unreadCount: 0,
            avatar: "C",
            status: "away"
        },
        {
            id: "i4",
            name: "Phạm Thị D",
            type: "individual",
            lastMessage: "Tài liệu đã gửi email",
            lastSender: "Phạm Thị D",
            timestamp: "10:15",
            unreadCount: 0,
            avatar: "D",
            status: "offline"
        }
    ]
};

const sampleMessages = [
    {
        id: 1,
        sender: "Nguyễn Văn A",
        message: "Chào team! Hôm nay có ai rảnh review code cho tôi không?",
        timestamp: "14:25",
        avatar: "A"
    },
    {
        id: 2,
        sender: "Trần Thị B",
        message: "Tôi rảnh đây, gửi link repo đi",
        timestamp: "14:26",
        avatar: "B"
    },
    {
        id: 3,
        sender: "Lê Văn C",
        message: "Tôi cũng rảnh, review cùng",
        timestamp: "14:27",
        avatar: "C"
    },
    {
        id: 4,
        sender: "Nguyễn Văn A",
        message: "Cảm ơn team! Đây là link: https://github.com/...",
        timestamp: "14:28",
        avatar: "A"
    },
    {
        id: 5,
        sender: "Phạm Thị D",
        message: "Tôi cũng tham gia review nhé",
        timestamp: "14:30",
        avatar: "D"
    }
];

export default function Messages() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState(sampleMessages);
    const [searchQuery, setSearchQuery] = useState("");

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
    };

    const handleSendMessage = () => {
        if (messageInput.trim() && selectedChat) {
            const newMessage = {
                id: Date.now(),
                sender: "Bạn",
                message: messageInput.trim(),
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                avatar: "B"
            };
            setMessages([...messages, newMessage]);
            setMessageInput("");
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchQuery(""); // Reset search when changing tabs
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    // Filter chats based on active tab and search query
    const filteredChats = useMemo(() => {
        let chats = [];

        if (activeTab === "all") {
            chats = [...initialChats.groups, ...initialChats.individuals];
        } else if (activeTab === "groups") {
            chats = initialChats.groups;
        } else if (activeTab === "individuals") {
            chats = initialChats.individuals;
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            chats = chats.filter(chat =>
                chat.name.toLowerCase().includes(query) ||
                chat.lastMessage.toLowerCase().includes(query) ||
                chat.lastSender.toLowerCase().includes(query)
            );
        }

        return chats;
    }, [activeTab, searchQuery]);

    return (
        <div className="h-[calc(100vh-100px)] overflow-hidden flex flex-col space-y-6">
            <PageHeader breadcrumbs={[{ label: "Tin nhắn", to: "/messages" }]} />

            <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                {/* Sidebar - Chat List */}
                <ChatList
                    chats={filteredChats}
                    selectedChat={selectedChat}
                    onChatSelect={handleChatSelect}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                />

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedChat ? (
                        <>
                            <ChatHeader selectedChat={selectedChat} />
                            <MessageList messages={messages} />
                            <MessageInput
                                messageInput={messageInput}
                                setMessageInput={setMessageInput}
                                onSendMessage={handleSendMessage}
                            />
                        </>
                    ) : (
                        <EmptyChat />
                    )}
                </div>
            </div>
        </div>
    );
}
