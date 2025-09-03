import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

const membersData = [
    { id: 1, name: "Nguyễn Văn A", role: "PM", email: "nguyenvana@example.com", status: "Hoạt động" },
    { id: 2, name: "Trần Thị B", role: "Backend", email: "tranthib@example.com", status: "Hoạt động" },
    { id: 3, name: "Lê Văn C", role: "Frontend", email: "levanc@example.com", status: "Hoạt động" },
    { id: 4, name: "Phạm D", role: "QA", email: "phamd@example.com", status: "Hoạt động" },
];

export default function Members() {
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        email: "",
        status: "Hoạt động"
    });

    const handleEditMember = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            role: member.role,
            email: member.email,
            status: member.status
        });
        setShowModal(true);
    };

    const handleAddMember = () => {
        setEditingMember(null);
        setFormData({
            name: "",
            role: "",
            email: "",
            status: "Hoạt động"
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        // Here you would typically save the data
        console.log("Saving member:", formData);
        setShowModal(false);
        setFormData({ name: "", role: "", email: "", status: "Hoạt động" });
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({ name: "", role: "", email: "", status: "Hoạt động" });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Thành viên</CardTitle>
                        <Button size="sm" onClick={handleAddMember}>+ Thêm</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {membersData.map(m => (
                            <li key={m.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar name={m.name} size={9} />
                                    <div>
                                        <div className="text-sm font-medium">{m.name}</div>
                                        <div className="text-xs text-gray-500">{m.role}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="gray">{m.status}</Badge>
                                    <button 
                                        onClick={() => handleEditMember(m)}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Sửa
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                        <Button onClick={handleSubmit}>
                            {editingMember ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên thành viên"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                        <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập vai trò"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập email"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Không hoạt động">Không hoạt động</option>
                            <option value="Tạm nghỉ">Tạm nghỉ</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </>
    );
}
