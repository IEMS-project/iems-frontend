import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import { projectService } from "../services/projectService";
import { toast } from "sonner";
import { columns } from "./projects-columns";
import { ProjectsDataTable } from "./projects-data-table";

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        managerId: ""
    });

    // Load projects on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const projectsData = await projectService.getProjectsTable();
                setProjects(projectsData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCreateProject = () => {
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            managerId: ""
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.warning("Vui lòng nhập tên dự án");
            return;
        }
        if (!formData.managerId) {
            toast.warning("Vui lòng chọn quản lý dự án");
            return;
        }

        try {
            const projectData = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
            };

            await projectService.createProject(projectData);

            // Reload projects
            const updatedProjects = await projectService.getProjectsTable();
            setProjects(updatedProjects);

            setShowModal(false);
            setFormData({
                name: "",
                description: "",
                startDate: "",
                endDate: "",
                managerId: ""
            });
            toast.success("Dự án đã được tạo thành công");
        } catch (error) {
            console.error("Error creating project:", error);
            toast.error(error?.message || "Có lỗi xảy ra khi tạo dự án. Vui lòng thử lại.");
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            managerId: ""
        });
    };

    // Lấy danh sách manager từ dự án hiện có (unique)
    const managers = Array.from(
        new Map(
            projects.map(p => [p.managerId, { id: p.managerId, name: p.managerName, email: p.managerEmail, image: p.managerImage }])
        ).values()
    );

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Danh sách dự án</CardTitle>
                        <Button onClick={handleCreateProject}>Tạo dự án</Button>
                    </CardHeader>
                    <CardContent>
                        <ProjectsDataTable columns={columns} data={projects} loading={loading} />
                    </CardContent>
                </Card>
            </div>

            <Modal
                open={showModal}
                onClose={handleClose}
                title="Tạo dự án mới"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit}>Tạo dự án</Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên dự án *
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên dự án"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quản lý dự án *
                        </label>
                        <select
                            value={formData.managerId}
                            onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        >
                            <option value="">Chọn quản lý dự án</option>
                            {managers.map(manager => (
                                <option key={manager.id} value={manager.id}>
                                    {manager.name} ({manager.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mô tả dự án"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
