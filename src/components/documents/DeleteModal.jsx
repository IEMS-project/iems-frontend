import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function DeleteModal({ isOpen, onClose, deleteItem, onConfirm }) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa">
			{deleteItem && (
				<div className="space-y-4">
					<p>
						Bạn có chắc muốn xóa {deleteItem.type === "folder" ? "thư mục" : "tệp"} 
						<span className="font-medium">{deleteItem.data.name}</span>
						{deleteItem.type === "folder" ? " và tất cả nội dung bên trong" : ""}?
					</p>
					<div className="flex justify-end gap-2">
						<Button variant="secondary" onClick={onClose}>Hủy</Button>
						<Button variant="danger" onClick={onConfirm}>Xóa</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
