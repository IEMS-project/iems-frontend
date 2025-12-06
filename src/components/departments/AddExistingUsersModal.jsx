import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import UserSelectionPanel from "../ui/UserSelectionPanel";

export default function AddExistingUsersModal({
  open,
  onClose,
  allUsers = [],
  initialSelectedIds = [],
  onSubmit,
  onCreateNew,
  title,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds || []));
    }
  }, [open]);

  function toggle(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 100) next.add(id);
    setSelectedIds(next);
  }

  function selectAllVisible() {
    const q = query.trim().toLowerCase();
    const filtered = !q ? allUsers : allUsers.filter((u) => {
      const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
      return (
        fullName.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    });
    const next = new Set(selectedIds);
    for (const u of filtered) {
      const id = u.userId || u.id;
      if (next.size >= 100) break;
      next.add(id);
    }
    setSelectedIds(next);
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  async function handleSubmit() {
    if (onSubmit) {
      await onSubmit(Array.from(selectedIds));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || t("ui.addExistingUsersModal.title")}
      className="max-w-5xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t("ui.addExistingUsersModal.selected", { count: selectedIds.size, total: allUsers?.length || 0 })}
            </div>
            {onCreateNew && (
              <Button variant="secondary" onClick={onCreateNew}>
                {t("ui.addExistingUsersModal.addNewMember")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t("ui.addExistingUsersModal.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={selectedIds.size === 0}>
              {t("ui.addExistingUsersModal.add")}
            </Button>
          </div>
        </div>
      }
    >
      {/* Search input and bulk actions */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ui.addExistingUsersModal.searchPlaceholder")}
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={selectAllVisible} className="whitespace-nowrap">
            {t("ui.addExistingUsersModal.selectAll")}
          </Button>
          <Button variant="outline" onClick={clearAll} className="whitespace-nowrap">
            {t("ui.addExistingUsersModal.deselectAll")}
          </Button>
        </div>
      </div>

      <UserSelectionPanel
        users={allUsers}
        selectedIds={selectedIds}
        onToggle={toggle}
        query={query}
        maxHeight={24}
      />
    </Modal>

  );
}


