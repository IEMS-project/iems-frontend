import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import UserSelectionPanel from "../ui/UserSelectionPanel";
import { userService } from "../../services/userService";
import { selectColors, textColors, cn } from "../../theme/colors";

export default function ShareModal({
	isOpen,
	onClose,
	shareItem,
	selectedRecipients,
	setSelectedRecipients,
	onShare
}) {
	const { t } = useTranslation();
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
			title={t('documents.share.title')}
			className="max-w-5xl"
			footer={
				<div className="flex justify-between items-center w-full">
					<div className="flex items-center gap-3">
						<div className={cn("text-sm", textColors.secondary)}>
							{t('documents.share.selected', { count: selectedRecipients.length, total: users.length })}
						</div>
					</div>
					<div className="flex gap-2">
						<Button variant="secondary" onClick={onClose}>
							{t('documents.share.cancel')}
						</Button>
						<Button onClick={handleSubmit} disabled={selectedRecipients.length === 0}>
							{t('documents.share.share')}
						</Button>
					</div>
				</div>
			}
		>
			{shareItem && (
				<div className="space-y-4">
					{/* Item being shared */}
					<div className={cn("text-sm", textColors.secondary)}>
						{t('documents.share.shareItem', {
							type: shareItem.type === "folder" ? t('documents.share.folder') : t('documents.share.file'),
							name: shareItem.data.name
						}).replace('<strong>', '').replace('</strong>', '')}
						<span className={cn("font-medium", textColors.primary)}> {shareItem.data.name}</span>
					</div>

					{/* Search input and permission selection */}
					<div className="flex items-center gap-3">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t('documents.share.searchPlaceholder')}
							className="flex-1"
						/>
						<select
							value={sharePermission}
							onChange={(e) => setSharePermission(e.target.value)}
							className={cn(
								"px-2 py-1 rounded text-sm",
								selectColors.base,
								selectColors.focus
							)}
						>
							<option value="VIEWER">{t('documents.share.viewer')}</option>
							<option value="EDITOR">{t('documents.share.editor')}</option>
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
