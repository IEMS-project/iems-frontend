import React, { useMemo } from "react";
import Avatar from "./Avatar";
import Skeleton from "./Skeleton";

/**
 * UserSelectionPanel - Component UI chung để chọn người dùng
 * Hiển thị danh sách người dùng bên trái và danh sách đã chọn bên phải
 * 
 * @param {Array} users - Danh sách tất cả người dùng
 * @param {Set|Array} selectedIds - IDs của người dùng đã chọn
 * @param {Function} onToggle - Callback khi toggle chọn người dùng
 * @param {Function} onRemove - Callback khi xóa người dùng đã chọn
 * @param {string} query - Query tìm kiếm
 * @param {boolean} loading - Trạng thái loading
 * @param {string} emptyMessage - Message khi không có người dùng
 * @param {string} emptySelectedMessage - Message khi chưa chọn ai
 * @param {string} currentUserId - ID người dùng hiện tại (không thể bỏ chọn)
 * @param {number} maxHeight - Chiều cao tối đa của panel (rem)
 * @param {Array} preselectedUsers - Danh sách người dùng đã chọn từ trước (hiển thị bên phải)
 */
export default function UserSelectionPanel({
    users = [],
    selectedIds = new Set(),
    onToggle,
    onRemove,
    query = "",
    loading = false,
    emptyMessage = "Không tìm thấy người dùng",
    emptySelectedMessage = "Chưa chọn ai",
    currentUserId,
    maxHeight = 24,
    preselectedUsers = []
}) {
    // Ensure selectedIds is a Set
    const selectedSet = useMemo(() => {
        if (selectedIds instanceof Set) return selectedIds;
        return new Set(selectedIds || []);
    }, [selectedIds]);

    // Filter users based on query
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
            return (
                fullName.toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.id || u.userId || "").toLowerCase().includes(q)
            );
        });
    }, [query, users]);

    // Get list of selected users
    const selectedList = useMemo(() => {
        if (!selectedSet || selectedSet.size === 0) return [];
        // If preselectedUsers provided, use them directly for display
        if (preselectedUsers && preselectedUsers.length > 0) {
            return preselectedUsers.filter(u => selectedSet.has(u.id || u.userId));
        }
        // Otherwise, derive from users list
        const idToUser = new Map(users.map((u) => [u.id || u.userId, u]));
        return Array.from(selectedSet)
            .map((id) => idToUser.get(id))
            .filter(Boolean);
    }, [selectedSet, users, preselectedUsers]);

    const handleToggle = (id) => {
        if (onToggle) onToggle(id);
    };

    const handleRemove = (id) => {
        if (onRemove) onRemove(id);
        else if (onToggle) onToggle(id);
    };

    return (
        <div className="flex gap-4">
            {/* Danh sách bên trái - Tất cả người dùng */}
            <div
                className="flex-1 border rounded-md overflow-auto divide-y divide-gray-100 dark:divide-gray-800"
                style={{ maxHeight: `${maxHeight}rem` }}
            >
                {loading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {filtered.map((u) => {
                            const userId = u.id || u.userId;
                            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
                            const isChecked = selectedSet.has(userId);
                            return (
                                <div
                                    key={userId}
                                    onClick={() => handleToggle(userId)}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        className="h-4 w-4"
                                    />
                                    <Avatar
                                        user={u}
                                        src={u.image}
                                        name={fullName || u.email || userId}
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {fullName || u.email || userId}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {u.email}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                {emptyMessage}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Danh sách đã chọn bên phải */}
            <div
                className="w-80 border rounded-md p-2 bg-gray-50 dark:bg-gray-900 space-y-2 overflow-auto"
                style={{ maxHeight: `${maxHeight}rem` }}
            >
                {selectedList.map((u) => {
                    const userId = u.id || u.userId;
                    const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
                    const isCurrentUser = userId === currentUserId;
                    return (
                        <div
                            key={userId}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm"
                        >
                            <Avatar
                                user={u}
                                src={u.image}
                                name={fullName || u.email || userId}
                                size="xs"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">
                                    {fullName || u.email || userId}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {u.email}
                                </span>
                            </div>
                            {!isCurrentUser && (
                                <button
                                    onClick={() => handleRemove(userId)}
                                    className="ml-1 hover:text-red-600 text-xl leading-none"
                                    title="Bỏ chọn"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
                {selectedList.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                        {emptySelectedMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
