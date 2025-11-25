import React, { useMemo, useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import UserSelectionPanel from "../ui/UserSelectionPanel";
import { userService } from "../../services/userService";

export default function ShareModal({
	isOpen,
	onClose,
	shareItem,
	selectedRecipients,
	setSelectedRecipients,
	onShare
}) {
	const [query, setQuery] = useState("");
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [sharePermission, setSharePermission] = useState("VIEWER");

	// Load users when modal opens
	useEffect(() => {
		if (isOpen) {
			loadUsers();
		}
	}, [isOpen]);

	async function loadUsers() {
		try {
			setLoading(true);
			const userData = await userService.getUsersForSharing();
			setUsers(userData || []);
		} catch (error) {
			console.error('Error loading users:', error);
			// Fallback to empty array
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}

	function toggle(id) {
		if (selectedRecipients.includes(id)) {
			setSelectedRecipients(prev => prev.filter(userId => userId !== id));
		} else {
			setSelectedRecipients(prev => [...prev, id]);
		}
	}

	async function handleSubmit() {
		if (onShare) {
			await onShare(sharePermission);
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Chia sẻ"
			className="max-w-5xl"
			footer={
				<div className="flex justify-between items-center w-full">
					<div className="flex items-center gap-3">
						<div className="text-sm text-gray-600 dark:text-gray-300">
							Đã chọn {selectedRecipients.length}/{users.length}
						</div>
					</div>
					<div className="flex gap-2">
						<Button variant="secondary" onClick={onClose}>
							Hủy
						</Button>
						<Button onClick={handleSubmit} disabled={selectedRecipients.length === 0}>
							Chia sẻ
						</Button>
					</div>
				</div>
			}
		>
			{shareItem && (
				<div className="space-y-4">
					{/* Item being shared */}
					<div className="text-sm text-gray-600">
						Chia sẻ {shareItem.type === "folder" ? "thư mục" : "tệp"}:
						<span className="font-medium">{shareItem.data.name}</span>
					</div>

					{/* Copy Link Section */}
					<div className="space-y-2">
						<div className="text-sm font-medium">Sao chép liên kết</div>
						<div className="flex items-center gap-2">
							<Input
								readOnly
								value={`${window.location.origin}/share/${shareItem.type}/${shareItem.data.id}`}
								className="flex-1"
							/>
							<Button
								onClick={() => {
									navigator.clipboard.writeText(`${window.location.origin}/share/${shareItem.type}/${shareItem.data.id}`);
								}}
							>
								Sao chép liên kết
							</Button>
						</div>
					</div>

					{/* Search input and permission selection */}
					<div className="flex items-center gap-3">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Nhập tên..."
							className="flex-1"
						/>
						<select
							value={sharePermission}
							onChange={(e) => setSharePermission(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="VIEWER">Xem</option>
							<option value="EDITOR">Chỉnh sửa</option>
						</select>
					</div>

					<UserSelectionPanel
						users={users}
						selectedIds={selectedRecipients}
						onToggle={toggle}
						query={query}
						loading={loading}
						maxHeight={24}
					/>
				</div>
			)}
		</Modal>
	);
}
