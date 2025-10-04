import React, { useMemo, useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import UserAvatar from "../ui/UserAvatar";
import { api } from "../../lib/api";

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
			const userData = await api.getUsersForSharing();
			setUsers(userData || []);
		} catch (error) {
			console.error('Error loading users:', error);
			// Fallback to empty array
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;
		return users.filter((u) => {
			const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
			return (
				fullName.toLowerCase().includes(q) ||
				(u.email || "").toLowerCase().includes(q)
			);
		});
	}, [query, users]);

	const selectedList = useMemo(() => {
		if (!selectedRecipients || selectedRecipients.length === 0) return [];
		const idToUser = new Map(users.map((u) => [u.id || u.userId, u]));
		return selectedRecipients
			.map((id) => idToUser.get(id))
			.filter(Boolean);
	}, [selectedRecipients, users]);

	function toggle(id) {
		if (selectedRecipients.includes(id)) {
			setSelectedRecipients(prev => prev.filter(userId => userId !== id));
		} else {
			setSelectedRecipients(prev => [...prev, id]);
		}
	}

	function removeSelected(id) {
		setSelectedRecipients(prev => prev.filter(userId => userId !== id));
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
			className="max-w-4xl"
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

					<div className="flex gap-4">
						{/* Danh sách bên trái */}
						<div className="w-3/5 border rounded-md max-h-[36rem] overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
							{loading ? (
								<div className="p-6 text-center text-gray-500 dark:text-gray-400">
									Đang tải danh sách người dùng...
								</div>
							) : (
								<>
									{filtered.map((u) => {
										const userId = u.id || u.userId;
										const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
										const isChecked = selectedRecipients.includes(userId);
										return (
											<div
												key={userId}
												onClick={() => toggle(userId)}
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
											Không tìm thấy người dùng
										</div>
									)}
								</>
							)}
						</div>

						{/* Danh sách đã chọn bên phải */}
						<div className="w-2/5 border rounded-md p-2 bg-gray-50 dark:bg-gray-900 space-y-2 overflow-auto max-h-[36rem]">
							{selectedList.map((u) => {
								const userId = u.id || u.userId;
								const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
								return (
									<div
										key={userId}
										className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm"
									>
										<UserAvatar user={u} size="xs" />
										<div className="flex flex-col flex-1 min-w-0">
											<span className="font-medium truncate">
												{fullName || u.email || userId}
											</span>
											<span className="text-sm text-gray-500 truncate">
												{u.email}
											</span>
										</div>
										<button
											onClick={() => removeSelected(userId)}
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
				</div>
			)}
		</Modal>
	);
}
