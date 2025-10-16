import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function CreateFolderModal({ 
	isOpen, 
	onClose, 
	newFolderName, 
	setNewFolderName, 
	onConfirm 
}) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Thư mục mới">
			<div className="space-y-3">
				<Input 
					placeholder="Tên thư mục" 
					value={newFolderName} 
					onChange={(e) => setNewFolderName(e.target.value)} 
				/>
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>Hủy</Button>
					<Button onClick={onConfirm} disabled={!newFolderName.trim()}>Tạo</Button>
				</div>
			</div>
		</Modal>
	);
}
