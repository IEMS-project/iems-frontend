import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../../services/projectService";
import { useErrorHandler } from "../common/ErrorBoundary";

export default function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();
    const [loading, setLoading] = useState(true);
    const [projectData, setProjectData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "",
        managerId: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await projectService.getProjectById(projectId);
                
                // Check if response indicates permission error
                if (data && data.status === "error" && 
                    (data.message?.includes("Permission denied") || 
                     data.message?.includes("PERMISSION_DENIED"))) {
                    console.log("Permission error in response data, redirecting...");
                    navigate("/permission-denied");
                    return;
                }
                
                setProjectData(data);
                setFormData({
                    name: data?.name || "",
                    description: data?.description || "",
                    startDate: data?.startDate ? (new Date(data.startDate)).toISOString().slice(0, 10) : "",
                    endDate: data?.endDate ? (new Date(data.endDate)).toISOString().slice(0, 10) : "",
                    status: data?.status || "",
                    managerId: data?.managerId || "",
                });
            } catch (e) {
                console.log("ProjectDetails Error:", e);
                console.log("Error status:", e.status);
                console.log("Error message:", e.message);
                console.log("Error data:", e.data);
                
                // Check if it's a permission error
                if (e.status === 403 || 
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    console.log("Permission error detected, redirecting...");
                    // Redirect immediately to permission denied page
                    navigate("/permission-denied");
                    return;
                } else {
                    console.log("Other error, using handleError");
                    handleError(e);
                }
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId, navigate]);

    const handleEditProject = () => {
        if (!projectData) return;
        setFormData({
            name: projectData.name || "",
            description: projectData.description || "",
            startDate: projectData.startDate ? (new Date(projectData.startDate)).toISOString().slice(0, 10) : "",
            endDate: projectData.endDate ? (new Date(projectData.endDate)).toISOString().slice(0, 10) : "",
            status: projectData.status || "",
            managerId: projectData.managerId || "",
        });
        setShowEditModal(true);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Basic validation
            if (!formData.name.trim()) {
                alert("Vui lòng nhập tên dự án");
                return;
            }
            
            // Prepare data for API call
            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                status: formData.status || null,
                managerId: formData.managerId || null,
            };
            
            console.log("Updating project:", updateData);
            
            // Call API to update project
            const updatedProject = await projectService.updateProject(projectId, updateData);
            
            // Update local state with new data
            setProjectData(updatedProject);
            
            // Close modal
            setShowEditModal(false);
            
            console.log("Project updated successfully:", updatedProject);
        } catch (error) {
            console.error("Error updating project:", error);
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowEditModal(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Dự án: {projectData?.name || '-'}</h1>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                <span>Quản lý: {projectData?.managerName || projectData?.managerEmail || projectData?.managerId || '-'}</span>
                                <span>•</span>
                                <Badge variant="blue">{projectData?.status || 'Chưa xác định'}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary">Chia sẻ</Button>
                            <Button onClick={handleEditProject}>Chỉnh sửa dự án</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
       
                        <div>
                            <div className="text-xs uppercase text-gray-500">Ngày bắt đầu</div>
                            <div className="text-gray-800 dark:text-gray-100">{projectData?.startDate ? new Date(projectData.startDate).toLocaleDateString('vi-VN') : '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Hạn hoàn thành</div>
                            <div className="text-gray-800 dark:text-gray-100">{projectData?.endDate ? new Date(projectData.endDate).toLocaleDateString('vi-VN') : '-'}</div>
                        </div>
                        <div className="sm:col-span-2">
                            <div className="text-xs uppercase text-gray-500">Mô tả</div>
                            <div className="text-gray-800 dark:text-gray-100">{projectData?.description || '-'}</div>
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
                        <Button variant="secondary" onClick={handleClose} disabled={loading}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên dự án"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn trạng thái</option>
                            <option value="PLANNING">Lập kế hoạch</option>
                            <option value="IN_PROGRESS">Đang thực hiện</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Hủy bỏ</option>
                            <option value="ON_HOLD">Tạm dừng</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
