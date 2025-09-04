import React, { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
const projectData = {
    id: "iems-001",
    name: "IEMS Platform",
    status: "Đang thực hiện",
    code: "IEMS-001",
    client: "ABC Corp",
    projectManager: "Nguyễn Văn A",
    startDate: "2024-09-01",
    endDate: "2024-12-31",
    description: "Hệ thống quản lý năng lượng thông minh cho doanh nghiệp, bao gồm giám sát, báo cáo, tối ưu hóa tiêu thụ."
};

export default function ProjectHeader() {
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: projectData.name,
        code: projectData.code,
        client: projectData.client,
        projectManager: projectData.projectManager,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        description: projectData.description
    });

    const handleEditProject = () => {
        setFormData({
            name: projectData.name,
            code: projectData.code,
            client: projectData.client,
            projectManager: projectData.projectManager,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            description: projectData.description
        });
        setShowEditModal(true);
    };

    const handleSubmit = () => {
        // Here you would typically save the data
        console.log("Updating project:", formData);
        setShowEditModal(false);
    };

    const handleClose = () => {
        setShowEditModal(false);
    };

    return (
        <>
            <Card>
                <CardContent>
                    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Dự án: {projectData.name}</h1>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                <span>Mã: {projectData.code}</span>
                                <span>•</span>
                                <Badge variant="blue">{projectData.status}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary">Chia sẻ</Button>
                            <Button onClick={handleEditProject}>Chỉnh sửa dự án</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={showEditModal}
                onClose={handleClose}
                title="Chỉnh sửa dự án"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                        <Button onClick={handleSubmit}>Lưu thay đổi</Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã dự án</label>
                        <Input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mã dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                        <Input
                            type="text"
                            value={formData.client}
                            onChange={(e) => setFormData({...formData, client: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên khách hàng"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quản lý dự án</label>
                        <Input
                            type="text"
                            value={formData.projectManager}
                            onChange={(e) => setFormData({...formData, projectManager: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên quản lý dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={4}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mô tả dự án"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
