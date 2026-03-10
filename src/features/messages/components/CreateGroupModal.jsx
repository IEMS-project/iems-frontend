import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import UserSelectionPanel from "@/components/ui/UserSelectionPanel";
import { useTranslation } from "react-i18next";
import { textColors, cn } from '@/theme/colors';

export default function CreateGroupModal({ open, onClose, allUsers = [], currentUserId, onSubmit }) {
    const { t } = useTranslation();
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
        if (onSubmit) await onSubmit(payload);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('messages.group.createTitle')}
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className={cn("text-sm", textColors.secondary)}>{t('messages.group.selected', { count: selectedIds.size })}</div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>{t('messages.group.cancel')}</Button>
                        <Button onClick={handleSubmit} disabled={!name.trim() || selectedIds.size < 2}>{t('messages.group.create')}</Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <Input
                    label={t('messages.group.groupName')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('messages.group.groupNamePlaceholder')}
                />
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('messages.group.searchMembers')}
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


