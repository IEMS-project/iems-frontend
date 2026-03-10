import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function DeleteModal({ isOpen, onClose, deleteItem, onConfirm }) {
	const { t } = useTranslation();

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t('documents.delete.title')}>
			{deleteItem && (
				<div className="space-y-4">
					<p>
						{deleteItem.type === "folder"
							? t('documents.delete.confirmFolder', { name: deleteItem.data.name })
							: t('documents.delete.confirmFile', { name: deleteItem.data.name })
						}
					</p>
					<div className="flex justify-end gap-2">
						<Button variant="secondary" onClick={onClose}>{t('documents.delete.cancel')}</Button>
						<Button variant="danger" onClick={onConfirm}>{t('documents.delete.delete')}</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
