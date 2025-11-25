import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import UserSelect from "../components/project/UserSelect";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import { toast } from "sonner";
import { columns } from "../components/project/projects-columns";
import { ProjectsDataTable } from "../components/project/projects-data-table";

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        managerId: "",
        status: ""
    });

    // Load projects and users on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [projectsData, usersData] = await Promise.all([
                    projectService.getProjectsTable(),
                    userService.getAllUserBasicInfos()
                ]);
                setProjects(projectsData);
                setUsers(usersData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCreateProject = () => {
        setEditingProject(null);
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            managerId: "",
            status: "PLANNING"
        });
        setShowModal(true);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || "",
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
            managerId: project.managerId,
            status: project.status || "PLANNING"
        });
        setShowModal(true);
    };

    const handleDeleteProject = (project) => {
        setDeletingProject(project);
        setShowDeleteDialog(true);
    };

    const confirmDeleteProject = async () => {
        if (!deletingProject) return;

        try {
            await projectService.deleteProject(deletingProject.id);
            toast.success("Dự án đã được xóa thành công");

            // Reload projects
            const updatedProjects = await projectService.getProjectsTable();
            setProjects(updatedProjects);
        } catch (error) {
            console.error("Error deleting project:", error);
            toast.error(error?.message || "Có lỗi xảy ra khi xóa dự án. Vui lòng thử lại.");
        } finally {
            setDeletingProject(null);
        }
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

            if (editingProject) {
                await projectService.updateProject(editingProject.id, projectData);
                toast.success("Dự án đã được cập nhật thành công");
            } else {
                await projectService.createProject(projectData);
                toast.success("Dự án đã được tạo thành công");
            }

            // Reload projects
            const updatedProjects = await projectService.getProjectsTable();
            setProjects(updatedProjects);

            setShowModal(false);
            setEditingProject(null);
            setFormData({
                name: "",
                description: "",
                startDate: "",
                endDate: "",
                managerId: "",
                status: ""
            });
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error(error?.message || `Có lỗi xảy ra khi ${editingProject ? 'cập nhật' : 'tạo'} dự án. Vui lòng thử lại.`);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            managerId: "",
            status: ""
        });
    };

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Danh sách dự án</CardTitle>
                        <Button onClick={handleCreateProject}>Tạo dự án</Button>
                    </CardHeader>
                    <CardContent>
                        <ProjectsDataTable
                            columns={columns}
                            data={projects}
                            loading={loading}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                        />
                    </CardContent>
                </Card>
            </div>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingProject ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingProject ? "Cập nhật" : "Tạo dự án"}
                        </Button>
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
                        <UserSelect
                            assignableUsers={users}
                            value={formData.managerId}
                            onChange={(userId) => setFormData({ ...formData, managerId: userId })}
                        />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái dự án
                        </label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="PLANNING">Lên kế hoạch</option>
                            <option value="IN_PROGRESS">Đang thực hiện</option>
                            <option value="ON_HOLD">Tạm dừng</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
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

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDeleteProject}
                title="Xóa dự án"
                description={`Bạn có chắc chắn muốn xóa dự án "${deletingProject?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="destructive"
            />
        </>
    );
}
