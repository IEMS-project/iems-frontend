import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "./Avatar";
import Skeleton from "./skeleton";
import { textColors, bgColors, borderColors, cn } from '@/theme/colors';

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
    emptyMessage,
    emptySelectedMessage,
    currentUserId,
    maxHeight = 24,
    preselectedUsers = []
}) {
    const { t } = useTranslation();
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
                className={cn("flex-1 rounded-md overflow-auto", bgColors.primary, borderColors.default, borderColors.divider, "border")}
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
                                    className={cn("flex items-center gap-3 p-3 cursor-pointer", bgColors.hover)}
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
                                        <div className={cn("font-medium truncate", textColors.primary)}>
                                            {fullName || u.email || userId}
                                        </div>
                                        <div className={cn("text-sm truncate", textColors.secondary)}>
                                            {u.email}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className={cn("p-6 text-center", textColors.secondary)}>
                                {emptyMessage || t("ui.userSelection.emptyMessage")}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Danh sách đã chọn bên phải */}
            <div
                className={cn("w-80 rounded-md p-2 space-y-2 overflow-auto border", bgColors.primary, borderColors.default)}
                style={{ maxHeight: `${maxHeight}rem` }}
            >
                {selectedList.map((u) => {
                    const userId = u.id || u.userId;
                    const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
                    const isCurrentUser = userId === currentUserId;
                    return (
                        <div
                            key={userId}
                            className={cn("flex items-center gap-2 p-2 rounded-md shadow-sm border", bgColors.secondary, borderColors.light)}
                        >
                            <Avatar
                                user={u}
                                src={u.image}
                                name={fullName || u.email || userId}
                                size="xs"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className={cn("font-medium truncate", textColors.primary)}>
                                    {fullName || u.email || userId}
                                </span>
                                <span className={cn("text-sm truncate", textColors.secondary)}>
                                    {u.email}
                                </span>
                            </div>
                            {!isCurrentUser && (
                                <button
                                    onClick={() => handleRemove(userId)}
                                    className={cn("ml-1 text-xl leading-none", textColors.secondary, "hover:text-red-600 dark:hover:text-red-400")}
                                    title={t("ui.userSelection.deselect")}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
                {selectedList.length === 0 && (
                    <div className={cn("text-sm text-center py-4", textColors.secondary)}>
                        {emptySelectedMessage || t("ui.userSelection.emptySelected")}
                    </div>
                )}
            </div>
        </div>
    );
}
