import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { toast } from "sonner";

export default function RenameModal({
	isOpen,
	onClose,
	item,
	onConfirm
}) {
	const { t } = useTranslation();
	const [newName, setNewName] = useState("");
	const [loading, setLoading] = useState(false);
	const currentName = item?.data?.name || "";

	useEffect(() => {
		if (isOpen) {
			setNewName(currentName);
		}
	}, [isOpen, currentName]);

	const handleSubmit = async () => {
		if (!newName.trim()) return;

		setLoading(true);
		try {
			await onConfirm(newName.trim());
			onClose();
			toast.success(t('documents.rename.success'));
		} catch (error) {
			console.error('Error renaming:', error);
			toast.error(error?.message || t('documents.rename.error'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={item?.type === 'folder' ? t('documents.rename.titleFolder') : t('documents.rename.titleFile')}
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						{t('documents.rename.cancel')}
					</Button>
					<Button onClick={handleSubmit} disabled={!newName.trim() || loading}>
						{loading ? t('documents.rename.processing') : t('documents.rename.save')}
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						{item?.type === 'folder' ? t('documents.rename.labelFolder') : t('documents.rename.labelFile')}
					</label>
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder={t('documents.rename.placeholder')}
						className="w-full"
						autoFocus
					/>
				</div>
				{item && (
					<div className="text-sm text-gray-500">
						{t('documents.rename.currentName')} <span className="font-medium">{currentName}</span>
					</div>
				)}
			</div>
		</Modal>
	);
}
