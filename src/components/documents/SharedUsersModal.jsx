import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { api } from "../../lib/api";
import UserAvatar from "../ui/UserAvatar";

export default function SharedUsersModal({ 
	isOpen, 
	onClose, 
	item 
}) {
	console.log('SharedUsersModal item:', item);
	const [sharedUsers, setSharedUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(null);

	useEffect(() => {
		if (isOpen && item) {
			loadSharedUsers();
		}
	}, [isOpen, item]);

	async function loadSharedUsers() {
		try {
			setLoading(true);
			if (!item?.id) return;
		const users = await api.getSharedUsers(item.id, item.type.toUpperCase());
			setSharedUsers(users || []);
		} catch (error) {
			console.error('Error loading shared users:', error);
			setSharedUsers([]);
		} finally {
			setLoading(false);
		}
	}

	async function updatePermission(shareId, newPermission) {
		try {
			setActionLoading(shareId);
			await api.updateSharePermission(shareId, newPermission);
			loadSharedUsers(); // Reload to get updated data
		} catch (error) {
			console.error('Error updating permission:', error);
			alert('Lỗi khi cập nhật quyền');
		} finally {
			setActionLoading(null);
		}
	}

	async function removeShare(shareId) {
		try {
			setActionLoading(shareId);
			await api.removeShare(shareId);
			loadSharedUsers(); // Reload to get updated data
		} catch (error) {
			console.error('Error removing share:', error);
			alert('Lỗi khi xóa quyền');
		} finally {
			setActionLoading(null);
		}
	}

	return (
		<Modal 
			isOpen={isOpen} 
			onClose={onClose} 
			title={`Người dùng đã chia sẻ`}
			className="max-w-2xl"
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						Đóng
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				{item && (
					<div className="text-sm text-gray-600 mb-4">
						{item.type === 'folder' ? 'Thư mục' : 'Tệp'}: <span className="font-medium">{item.name}</span>
					</div>
				)}
				
				{loading ? (
					<div className="text-center py-8 text-gray-500">
						Đang tải danh sách người dùng...
					</div>
				) : sharedUsers.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						Chưa chia sẻ với ai
					</div>
				) : (
					<div className="space-y-2">
						{sharedUsers.map((user) => (
							<div key={user.shareId} className="flex items-center justify-between p-3 border rounded-md">
								<div className="flex items-center gap-3">
									<UserAvatar user={user} size="sm" />
									<div>
										<div className="font-medium">
											{user.firstName} {user.lastName}
										</div>
										<div className="text-sm text-gray-500">
											{user.email}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<select
										value={user.permission}
										onChange={(e) => updatePermission(user.shareId, e.target.value)}
										disabled={actionLoading === user.shareId}
										className="px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									>
										<option value="VIEWER">Xem</option>
										<option value="EDITOR">Chỉnh sửa</option>
									</select>
									<Button
										variant="secondary"
										size="sm"
										onClick={() => removeShare(user.shareId)}
										disabled={actionLoading === user.shareId}
										className="text-red-600 hover:text-red-700"
									>
										{actionLoading === user.shareId ? '...' : 'Xóa'}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</Modal>
	);
}
