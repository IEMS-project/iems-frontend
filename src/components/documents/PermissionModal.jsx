import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function PermissionModal({ 
	isOpen, 
	onClose, 
	item, 
	onConfirm 
}) {
	const [permission, setPermission] = useState(item?.permission || "PUBLIC");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			await onConfirm(permission);
			onClose();
		} catch (error) {
			console.error('Error updating permission:', error);
			alert('Lỗi khi cập nhật quyền');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal 
			isOpen={isOpen} 
			onClose={onClose} 
			title={`Cập nhật quyền ${item?.type === 'folder' ? 'thư mục' : 'tệp'}`}
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						Hủy
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading ? 'Đang xử lý...' : 'Cập nhật'}
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Trạng thái hiện tại: <span className="font-medium">{item?.permission === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span>
					</label>
					<div className="space-y-2">
						<label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
							<input 
								type="radio" 
								name="permission" 
								value="PUBLIC"
								checked={permission === "PUBLIC"}
								onChange={(e) => setPermission(e.target.value)}
								className="h-4 w-4"
							/>
							<div>
								<div className="font-medium text-green-600">Công khai</div>
								<div className="text-sm text-gray-500">Mọi người có thể xem và truy cập</div>
							</div>
						</label>
						<label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
							<input 
								type="radio" 
								name="permission" 
								value="PRIVATE"
								checked={permission === "PRIVATE"}
								onChange={(e) => setPermission(e.target.value)}
								className="h-4 w-4"
							/>
							<div>
								<div className="font-medium text-blue-600">Riêng tư</div>
								<div className="text-sm text-gray-500">Chỉ bạn và những người được chia sẻ có thể xem</div>
							</div>
						</label>
					</div>
				</div>
				{item && (
					<div className="text-sm text-gray-500">
						{item.type === 'folder' ? 'Thư mục' : 'Tệp'}: <span className="font-medium">{item.name}</span>
					</div>
				)}
			</div>
		</Modal>
	);
}
