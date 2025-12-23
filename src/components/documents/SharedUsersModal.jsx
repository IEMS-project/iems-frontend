import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { documentService } from "../../services/documentService";
import Avatar from "../ui/Avatar";
import Skeleton from "../ui/Skeleton";
import { toast } from "sonner";
import { selectColors, textColors, borderColors, cn } from "../../theme/colors";

export default function SharedUsersModal({
	isOpen,
	onClose,
	item
}) {
	const { t } = useTranslation();
	console.log('SharedUsersModal item:', item);
	const [sharedUsers, setSharedUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(null);

	useEffect(() => {
		if (isOpen && item) {
			loadSharedUsers();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
			toast.success(t('documents.sharedUsers.permissionUpdated'));
		} catch (error) {
			console.error('Error updating permission:', error);
			toast.error(error?.message || t('documents.sharedUsers.updateError'));
		} finally {
			setActionLoading(null);
		}
	}

	async function removeShare(shareId) {
		try {
			setActionLoading(shareId);
			await documentService.removeShare(shareId);
			loadSharedUsers(); // Reload to get updated data
			toast.success(t('documents.sharedUsers.removeSuccess'));
		} catch (error) {
			console.error('Error removing share:', error);
			toast.error(error?.message || t('documents.sharedUsers.removeError'));
		} finally {
			setActionLoading(null);
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('documents.sharedUsers.title')}
			className="max-w-2xl"
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						{t('documents.sharedUsers.close')}
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				{item && (
					<div className={cn("text-sm mb-4", textColors.secondary)}>
						{t('documents.sharedUsers.item', {
							type: item.type === 'folder' ? t('documents.sharedUsers.folder') : t('documents.sharedUsers.file'),
							name: item.name
						})}
					</div>
				)}

				{loading ? (
					<div className="space-y-2">
						{Array.from({ length: 3 }).map((_, idx) => (
							<div key={idx} className={cn("flex items-center justify-between rounded-md border border-dashed p-3", borderColors.light)}>
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
					<div className={cn("text-center py-8", textColors.secondary)}>
						{t('documents.sharedUsers.noUsers')}
					</div>
				) : (
					<div className="space-y-2">
						{sharedUsers.map((user) => (
							<div key={user.shareId} className={cn("flex items-center justify-between p-3 border rounded-md", borderColors.default)}>
								<div className="flex items-center gap-3">
									<Avatar user={user} size="sm" />
									<div>
										<div className={cn("font-medium", textColors.primary)}>
											{user.firstName} {user.lastName}
										</div>
										<div className={cn("text-sm", textColors.secondary)}>
											{user.email}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<select
										value={user.permission}
										onChange={(e) => updatePermission(user.shareId, e.target.value)}
										disabled={actionLoading === user.shareId}
										className={cn(
											"px-2 py-1 rounded text-sm",
											selectColors.base,
											selectColors.focus
										)}
									>
										<option value="VIEWER">{t('documents.share.viewer')}</option>
										<option value="EDITOR">{t('documents.share.editor')}</option>
									</select>
									<Button
										variant="secondary"
										size="sm"
										onClick={() => removeShare(user.shareId)}
										disabled={actionLoading === user.shareId}
										className="text-red-600 hover:text-red-700"
									>
										{actionLoading === user.shareId ? '...' : t('documents.sharedUsers.remove')}
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
