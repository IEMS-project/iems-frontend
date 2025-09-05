import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
const membersData = [
    { id: 1, name: "Nguyễn Văn A", role: "PM", status: "Hoạt động" },
    { id: 2, name: "Trần Thị B", role: "Backend", status: "Hoạt động" },
    { id: 3, name: "Lê Văn C", role: "Frontend", status: "Hoạt động" },
    { id: 4, name: "Phạm D", role: "QA", status: "Hoạt động" },
    { id: 5, name: "Hoàng Thị E", role: "UI/UX", status: "Hoạt động" },
    { id: 6, name: "Vũ Văn F", role: "DevOps", status: "Hoạt động" },
    { id: 7, name: "Đặng Thị G", role: "Business Analyst", status: "Hoạt động" },
    { id: 8, name: "Bùi Văn H", role: "Scrum Master", status: "Hoạt động" }
];

// Danh sách thành viên có sẵn để chọn
const availableMembers = [
    "Nguyễn Văn A",
    "Trần Thị B", 
    "Lê Văn C",
    "Phạm D",
    "Hoàng Thị E",
    "Vũ Văn F",
    "Đặng Thị G",
    "Bùi Văn H"
];

// Danh sách vai trò có sẵn
const availableRoles = [
    "PM",
    "Frontend",
    "Backend", 
    "Full-stack",
    "QA",
    "DevOps",
    "UI/UX",
    "Business Analyst",
    "Scrum Master"
];

export default function Members() {
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        status: "Hoạt động"
    });

    const handleEditMember = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            role: member.role,
            status: member.status
        });
        setShowModal(true);
    };

    const handleAddMember = () => {
        setEditingMember(null);
        setFormData({
            name: "",
            role: "",
            status: "Hoạt động"
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        // Here you would typically save the data
        console.log("Saving member:", formData);
        setShowModal(false);
        setFormData({ name: "", role: "", status: "Hoạt động" });
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({ name: "", role: "", status: "Hoạt động" });
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
                    <div className="max-h-44 overflow-y-auto">
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
                    </div>
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
                        <Select
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn thành viên</option>
                            {availableMembers.map(member => (
                                <option key={member} value={member}>{member}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                        <Select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn vai trò</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Không hoạt động">Không hoạt động</option>
                            <option value="Tạm nghỉ">Tạm nghỉ</option>
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}
