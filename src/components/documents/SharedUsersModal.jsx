import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { documentService } from "../../services/documentService";
import UserAvatar from "../ui/UserAvatar";
import Skeleton from "../ui/Skeleton";
import { useToast } from "../../context/ToastContext";

export default function SharedUsersModal({ 
	isOpen, 
	onClose, 
	item 
}) {
	const { toast } = useToast();
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
		const users = await documentService.getSharedUsers(item.id, item.type.toUpperCase());
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
			await documentService.updateSharePermission(shareId, newPermission);
			loadSharedUsers(); // Reload to get updated data
			toast.success("Quyền đã được cập nhật");
		} catch (error) {
			console.error('Error updating permission:', error);
			toast.error(error?.message || 'Lỗi khi cập nhật quyền');
		} finally {
			setActionLoading(null);
		}
	}

	async function removeShare(shareId) {
		try {
			setActionLoading(shareId);
			await documentService.removeShare(shareId);
			loadSharedUsers(); // Reload to get updated data
			toast.success("Đã xóa quyền chia sẻ");
		} catch (error) {
			console.error('Error removing share:', error);
			toast.error(error?.message || 'Lỗi khi xóa quyền');
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
					<div className="space-y-2">
						{Array.from({ length: 3 }).map((_, idx) => (
							<div key={idx} className="flex items-center justify-between rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-700">
								<div className="flex items-center gap-3">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-3 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-8 w-28" />
									<Skeleton className="h-8 w-16" />
								</div>
							</div>
						))}
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
