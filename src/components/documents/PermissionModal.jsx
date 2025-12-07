import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { toast } from "sonner";

export default function PermissionModal({
	isOpen,
	onClose,
	item,
	onConfirm
}) {
	const { t } = useTranslation();
	const [permission, setPermission] = useState(item?.permission || "PUBLIC");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			await onConfirm(permission);
			onClose();
			toast.success(t('documents.permission.success'));
		} catch (error) {
			console.error('Error updating permission:', error);
			toast.error(error?.message || t('documents.permission.error'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={item?.type === 'folder' ? t('documents.permission.titleFolder') : t('documents.permission.titleFile')}
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						{t('documents.permission.cancel')}
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading ? t('documents.permission.processing') : t('documents.permission.update')}
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						{t('documents.permission.currentStatus')} <span className="font-medium">{item?.permission === 'PUBLIC' ? t('documents.permission.public') : t('documents.permission.private')}</span>
					</label>
					<div className="space-y-2">
						<label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted ">
							<input
								type="radio"
								name="permission"
								value="PUBLIC"
								checked={permission === "PUBLIC"}
								onChange={(e) => setPermission(e.target.value)}
								className="h-4 w-4"
							/>
							<div>
								<div className="font-medium text-green-600">{t('documents.permission.public')}</div>
								<div className="text-sm text-gray-500">{t('documents.permission.publicDesc')}</div>
							</div>
						</label>
						<label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted">
							<input
								type="radio"
								name="permission"
								value="PRIVATE"
								checked={permission === "PRIVATE"}
								onChange={(e) => setPermission(e.target.value)}
								className="h-4 w-4"
							/>
							<div>
								<div className="font-medium text-blue-600">{t('documents.permission.private')}</div>
								<div className="text-sm text-gray-500">{t('documents.permission.privateDesc')}</div>
							</div>
						</label>
					</div>
				</div>
				{item && (
					<div className="text-sm text-gray-500">
						{item.type === 'folder' ? t('documents.types.folder') : t('documents.types.file')}: <span className="font-medium">{item.name}</span>
					</div>
				)}
			</div>
		</Modal>
	);
}
