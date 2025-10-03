import React, { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import UserAvatar from "../ui/UserAvatar";

export default function CreateGroupModal({ open, onClose, allUsers = [], currentUserId, onSubmit }) {
    const [name, setName] = useState("");
    const [query, setQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        if (open) {
            setName("");
            setQuery("");
            const init = new Set();
            if (currentUserId) init.add(currentUserId);
            setSelectedIds(init);
        }
    }, [open, currentUserId]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = allUsers || [];
        return list.filter(u => {
            const id = u.userId || u.id || "";
            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
            return (!q
                || (fullName && fullName.toLowerCase().includes(q))
                || ((u.email || "").toLowerCase().includes(q))
                || id.toLowerCase().includes(q));
        });
    }, [allUsers, query]);

    const selectedList = useMemo(() => {
        if (!selectedIds || selectedIds.size === 0) return [];
        const idToUser = new Map((allUsers || []).map(u => [u.userId || u.id, u]));
        return Array.from(selectedIds).map(id => idToUser.get(id)).filter(Boolean);
    }, [selectedIds, allUsers]);

    function toggle(id) {
        if (!id) return;
        const next = new Set(selectedIds);
        if (next.has(id)) {
            // Keep current user always included
            if (id !== currentUserId) next.delete(id);
        } else if (next.size < 100) {
            next.add(id);
        }
        setSelectedIds(next);
    }

    async function handleSubmit() {
        const memberIds = Array.from(selectedIds);
        if (!name.trim() || memberIds.length < 2) return;
        if (onSubmit) await onSubmit({ name: name.trim(), members: memberIds });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tạo nhóm mới"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Đã chọn {selectedIds.size}/100</div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Hủy</Button>
                        <Button onClick={handleSubmit} disabled={!name.trim() || selectedIds.size < 2}>Tạo nhóm</Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Tên nhóm"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nhập tên nhóm"
                />
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Tìm kiếm thành viên..."
                    className="w-full"
                />
                <div className="flex gap-4">
                    {/* Danh sách tất cả người dùng */}
                    <div className="flex-1 border rounded-md max-h-80 overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {(filtered || []).map((u) => {
                            const id = u.userId || u.id;
                            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
                            const isChecked = selectedIds.has(id);
                            return (
                                <div key={id} onClick={() => toggle(id)} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                    <input type="checkbox" checked={isChecked} readOnly className="h-4 w-4" />
                                    <UserAvatar user={u} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{fullName || u.email || id}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                                    </div>
                                </div>
                            );
                        })}
                        {(filtered || []).length === 0 && (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Không tìm thấy người dùng</div>
                        )}
                    </div>
                    {/* Danh sách đã chọn */}
                    <div className="w-64 border rounded-md p-2 bg-gray-50 dark:bg-gray-900 space-y-2 overflow-auto max-h-80">
                        {selectedList.map((u) => {
                            const id = u.userId || u.id;
                            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
                            return (
                                <div key={id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <UserAvatar user={u} size="xs" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium truncate">{fullName || u.email || id}</span>
                                        <span className="text-sm text-gray-500 truncate">{u.email}</span>
                                    </div>
                                    {id !== currentUserId && (
                                        <button onClick={() => toggle(id)} className="ml-1 hover:text-red-600" title="Bỏ chọn">×</button>
                                    )}
                                </div>
                            );
                        })}
                        {selectedList.length === 0 && (
                            <div className="text-sm text-gray-500 text-center">Chưa chọn ai</div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}


