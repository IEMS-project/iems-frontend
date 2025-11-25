import React, { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import UserSelectionPanel from "../ui/UserSelectionPanel";
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
                <UserSelectionPanel
                    users={allUsers}
                    selectedIds={selectedIds}
                    onToggle={toggle}
                    query={query}
                    loading={loadingMembers}
                    currentUserId={currentUserId}
                    maxHeight={24}
                    preselectedUsers={members}
                />
            </div>
        </Modal>
    );
}


