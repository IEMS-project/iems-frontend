import React, { useEffect, useState } from "react";
import { chatService } from "../../services/chatService";
import Avatar from "../ui/Avatar";

export default function ConversationMembersModal({ open, onClose, conversationId }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && conversationId) {
            loadMembers();
        }
    }, [open, conversationId]);

    async function loadMembers() {
        if (!conversationId) return;
        setLoading(true);
        try {
            const data = await chatService.getConversationMembers(conversationId);
            setMembers(data?.data || data || []);
        } catch (err) {
            console.error("Failed to load members:", err);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Thành viên cuộc trò chuyện</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                                Không tìm thấy thành viên
                            </div>
                        ) : (
                            members.map((member) => (
                                <div
                                    key={member.userId || member.id}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                                >
                                    <Avatar
                                        src={member.userImage || member.image}
                                        name={member.userName || member.fullName || member.email}
                                        size={10}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {member.userName || member.fullName || member.email}
                                        </div>
                                        {member.userEmail && member.userEmail !== member.userName && (
                                            <div className="text-sm text-gray-500 truncate">
                                                {member.userEmail}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
