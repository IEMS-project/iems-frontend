import React, { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import UserAvatar from "../ui/UserAvatar";

export default function AddExistingUsersModal({
  open,
  onClose,
  allUsers = [],
  initialSelectedIds = [],
  onSubmit,
  onCreateNew,
  title = "Thêm thành viên",
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds || []));
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => {
      const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
      return (
        fullName.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    });
  }, [allUsers, query]);

  const selectedList = useMemo(() => {
    if (!selectedIds || selectedIds.size === 0) return [];
    const idToUser = new Map(allUsers.map((u) => [u.userId || u.id, u]));
    return Array.from(selectedIds)
      .map((id) => idToUser.get(id))
      .filter(Boolean);
  }, [selectedIds, allUsers]);

  function toggle(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 100) next.add(id);
    setSelectedIds(next);
  }

  function removeSelected(id) {
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
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
      title={title}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Đã chọn {selectedIds.size}/100
            </div>
            {onCreateNew && (
              <Button variant="secondary" onClick={onCreateNew}>
                Thêm thành viên mới
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={selectedIds.size === 0}>
              Thêm
            </Button>
          </div>
        </div>
      }
    >
      {/* Search input */}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nhập tên..."
        className="w-full mb-4"
      />

      <div className="flex gap-4">
        {/* Danh sách bên trái */}
        <div className="flex-1 border rounded-md max-h-96 overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((u) => {
            const id = u.userId || u.id;
            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
            const isChecked = selectedIds.has(id);
            return (
              <div
                key={id}
                onClick={() => toggle(id)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="h-4 w-4"
                />
                <UserAvatar user={u} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {fullName || u.email || id}
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
              Không tìm thấy người dùng
            </div>
          )}
        </div>

        {/* Danh sách đã chọn bên phải */}
        <div className="w-64 border rounded-md p-2 bg-gray-50 dark:bg-gray-900 space-y-2 overflow-auto max-h-96">
          {selectedList.map((u) => {
            const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim();
            return (
              <div
                key={u.userId || u.id}
                className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm"
              >
                <UserAvatar user={u} size="xs" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">
                    {fullName || u.email || u.userId}
                  </span>
                  <span className="text-sm text-gray-500 truncate">
                    {u.email}
                  </span>
                </div>
                <button
                  onClick={() => removeSelected(u.userId || u.id)}
                  className="ml-1 hover:text-red-600"
                  title="Bỏ chọn"
                >
                  ×
                </button>
              </div>
            );
          })}
          {selectedList.length === 0 && (
            <div className="text-sm text-gray-500 text-center">Chưa chọn ai</div>
          )}
        </div>
      </div>
    </Modal>

  );
}


