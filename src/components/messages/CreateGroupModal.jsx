import React, { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import UserSelectionPanel from "../ui/UserSelectionPanel";

export default function CreateGroupModal({ open, onClose, allUsers = [], currentUserId, onSubmit }) {
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [query, setQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        if (open) {
            setName("");
            setAvatarUrl("");
            setQuery("");
            const init = new Set();
            if (currentUserId) init.add(currentUserId);
            setSelectedIds(init);
        }
    }, [open, currentUserId]);

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
        const payload = { name: name.trim(), members: memberIds, type: 'GROUP' };
        if (avatarUrl && avatarUrl.trim()) payload.avatarUrl = avatarUrl.trim();
        if (onSubmit) await onSubmit(payload);
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
                    label="Ảnh nhóm (URL)"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="Dán URL ảnh nhóm (tùy chọn)"
                />
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Tìm kiếm thành viên..."
                    className="w-full"
                />
                <UserSelectionPanel
                    users={allUsers}
                    selectedIds={selectedIds}
                    onToggle={toggle}
                    query={query}
                    currentUserId={currentUserId}
                    maxHeight={24}
                />
            </div>
        </Modal>
    );
}


