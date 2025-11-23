import React, { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar.jsx";
import Skeleton from "../ui/Skeleton";
import { chatService } from "../../services/chatService";

export default function GroupMembersModal({ open, onClose, conversationId, allUsers = [], currentUserId, onChanged }) {
    const [members, setMembers] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Load current members and initialize selection
    useEffect(() => {
        async function load() {
            if (!open || !conversationId) return;
            try {
                setLoadingMembers(true);
                const list = await chatService.getConversationMembers(conversationId);
                setMembers(list || []);
                const init = new Set((list || []).map(m => m.userId || m.id).filter(Boolean));
                // ensure current user stays selected
                if (currentUserId) init.add(currentUserId);
                setSelectedIds(init);
            } catch (e) { /* ignore */ }
            finally {
                setLoadingMembers(false);
            }
        }
        if (open) {
            setQuery("");
            load();
        }
    }, [open, conversationId, currentUserId]);

    const originalMemberIds = useMemo(() => new Set((members || []).map(m => m.userId || m.id)), [members]);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (allUsers || []).filter(u => {
            const id = u.userId || u.id || "";
            const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
            return (
                !q ||
                (fullName && fullName.toLowerCase().includes(q)) ||
                ((u.email || "").toLowerCase().includes(q)) ||
                id.toLowerCase().includes(q)
            );
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
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    }

    async function handleSave() {
        if (!conversationId) return;
        try {
            setSaving(true);
            // additions: in selected but not in original
            const additions = Array.from(selectedIds).filter(id => !originalMemberIds.has(id));
            // removals: in original but not in selected (cannot remove self)
            const removals = Array.from(originalMemberIds).filter(id => !selectedIds.has(id) && id !== currentUserId);

            // Apply changes
            for (const uid of additions) {
                await chatService.addMember(conversationId, uid);
            }
            for (const uid of removals) {
                await chatService.removeMember(conversationId, uid);
            }

            // Reload and notify
            const list = await chatService.getConversationMembers(conversationId);
            setMembers(list || []);
            onChanged?.();
            onClose?.();
        } catch (e) { /* ignore */ }
        finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Thành viên nhóm"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Đã chọn {selectedIds.size}</div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose} disabled={saving || loadingMembers}>Đóng</Button>
                        <Button onClick={handleSave} disabled={saving || loadingMembers}>Lưu thay đổi</Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Tìm kiếm thành viên..."
                    className="w-full"
                />
                {loadingMembers ? (
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div key={idx} className="flex items-center gap-3 rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-700">
                                    <Skeleton className="h-4 w-4 rounded" />
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="w-64 space-y-2">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                <div className="flex gap-4">
                    {/* Danh sách tất cả người dùng */}
                    <div className="flex-1 border rounded-md max-h-80 overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {(filteredUsers || []).map((u) => {
                            const id = u.userId || u.id;
                            const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
                            const isChecked = selectedIds.has(id);
                            return (
                                <div key={id} onClick={() => toggle(id)} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                    <input type="checkbox" checked={isChecked} readOnly className="h-4 w-4" />
                                    <Avatar
                                        src={u.image}
                                        name={fullName || u.email || id}
                                        size={8}
                                        className="mr-2"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{fullName || u.email || id}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                                    </div>

                                </div>
                            );
                        })}
                        {(filteredUsers || []).length === 0 && (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Không tìm thấy người dùng</div>
                        )}
                    </div>
                    {/* Danh sách đã chọn (thành viên hiện tại ở bên phải) */}
                    <div className="w-64 border rounded-md p-2 bg-gray-50 dark:bg-gray-900 space-y-2 overflow-auto max-h-80">
                        {selectedList.map((u) => {
                            const id = u.userId || u.id;
                            const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
                            return (
                                <div key={id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <Avatar
                                        src={u.image}
                                        name={fullName || u.email || id}
                                        size={8}
                                        className="mr-2"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{fullName || u.email || id}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
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
                )}
            </div>
        </Modal>
    );
}


