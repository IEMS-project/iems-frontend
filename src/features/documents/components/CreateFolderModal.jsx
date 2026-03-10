import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CreateFolderModal({
	isOpen,
	onClose,
	newFolderName,
	setNewFolderName,
	onConfirm
}) {
	const { t } = useTranslation();

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t('documents.createFolder.title')}>
			<div className="space-y-3">
				<Input
					placeholder={t('documents.createFolder.placeholder')}
					value={newFolderName}
					onChange={(e) => setNewFolderName(e.target.value)}
				/>
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>{t('documents.createFolder.cancel')}</Button>
					<Button onClick={onConfirm} disabled={!newFolderName.trim()}>{t('documents.createFolder.create')}</Button>
				</div>
			</div>
		</Modal>
	);
}
