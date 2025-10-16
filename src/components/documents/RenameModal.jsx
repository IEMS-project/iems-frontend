import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function RenameModal({ 
	isOpen, 
	onClose, 
	item, 
	onConfirm 
}) {
	const [newName, setNewName] = useState(item?.name || "");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!newName.trim()) return;
		
		setLoading(true);
		try {
			await onConfirm(newName.trim());
			onClose();
			setNewName("");
		} catch (error) {
			console.error('Error renaming:', error);
			alert('Lỗi khi đổi tên');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal 
			isOpen={isOpen} 
			onClose={onClose} 
			title={`Đổi tên ${item?.type === 'folder' ? 'thư mục' : 'tệp'}`}
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						Hủy
					</Button>
					<Button onClick={handleSubmit} disabled={!newName.trim() || loading}>
						{loading ? 'Đang xử lý...' : 'Lưu'}
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Tên {item?.type === 'folder' ? 'thư mục' : 'tệp'}
					</label>
					<Input 
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder={`Nhập tên ${item?.type === 'folder' ? 'thư mục' : 'tệp'}...`}
						className="w-full"
						autoFocus
					/>
				</div>
				{item && (
					<div className="text-sm text-gray-500">
						Tên hiện tại: <span className="font-medium">{item.name}</span>
					</div>
				)}
			</div>
		</Modal>
	);
}
