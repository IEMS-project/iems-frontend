import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import ConfirmDialog from "../ui/ConfirmDialog";
import { projectService } from "../../services/projectService";
import { toast } from "sonner";
import { Calendar, Target, Trash2, Edit, Plus } from "lucide-react";

export default function ProjectPhases({ projectId }) {
    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editingPhase, setEditingPhase] = useState(null);
    const [deletingPhase, setDeletingPhase] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        goal: "",
        startDate: "",
        endDate: ""
    });

    const loadPhases = async () => {
        try {
            setLoading(true);
            const data = await projectService.getPhases(projectId);
            setPhases(data);
        } catch (error) {
            console.error("Error loading phases:", error);
            toast.error("Không thể tải danh sách giai đoạn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadPhases();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const handleCreatePhase = () => {
        setEditingPhase(null);
        setFormData({
            name: "",
            description: "",
            goal: "",
            startDate: "",
            endDate: ""
        });
        setShowModal(true);
    };

    const handleEditPhase = (phase) => {
        setEditingPhase(phase);
        setFormData({
            name: phase.name,
            description: phase.description || "",
            goal: phase.goal || "",
            startDate: phase.startDate ? new Date(phase.startDate).toISOString().split('T')[0] : "",
            endDate: phase.endDate ? new Date(phase.endDate).toISOString().split('T')[0] : ""
        });
        setShowModal(true);
    };

    const handleDeletePhase = (phase) => {
        setDeletingPhase(phase);
        setShowDeleteDialog(true);
    };

    const confirmDeletePhase = async () => {
        if (!deletingPhase) return;

        try {
            await projectService.deletePhase(projectId, deletingPhase.id);
            toast.success("Giai đoạn đã được xóa thành công");
            await loadPhases();
        } catch (error) {
            console.error("Error deleting phase:", error);
            toast.error(error?.message || "Có lỗi xảy ra khi xóa giai đoạn");
        } finally {
            setDeletingPhase(null);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.warning("Vui lòng nhập tên giai đoạn");
            return;
        }

        try {
            const phaseData = {
                projectId,
                name: formData.name,
                description: formData.description,
                goal: formData.goal,
                startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null,
                endDate: formData.endDate ? `${formData.endDate}T23:59:59` : null
            };

            if (editingPhase) {
                await projectService.updatePhase(projectId, editingPhase.id, phaseData);
                toast.success("Giai đoạn đã được cập nhật thành công");
            } else {
                await projectService.createPhase(projectId, phaseData);
                toast.success("Giai đoạn đã được tạo thành công");
            }

            await loadPhases();
            handleClose();
        } catch (error) {
            console.error("Error saving phase:", error);
            toast.error(error?.message || `Có lỗi xảy ra khi ${editingPhase ? 'cập nhật' : 'tạo'} giai đoạn`);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingPhase(null);
        setFormData({
            name: "",
            description: "",
            goal: "",
            startDate: "",
            endDate: ""
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa xác định";
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-gray-500">Đang tải...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Giai đoạn dự án</CardTitle>
                    <Button onClick={handleCreatePhase}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo giai đoạn
                    </Button>
                </CardHeader>
                <CardContent>
                    {phases.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Chưa có giai đoạn nào. Hãy tạo giai đoạn đầu tiên!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {phases.map((phase) => (
                                <div
                                    key={phase.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    #{phase.sortOrder}
                                                </span>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {phase.name}
                                                </h3>
                                            </div>

                                            {phase.description && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {phase.description}
                                                </p>
                                            )}

                                            {phase.goal && (
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-medium">Mục tiêu:</span> {phase.goal}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Bắt đầu: {formatDate(phase.startDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Kết thúc: {formatDate(phase.endDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditPhase(phase)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeletePhase(phase)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingPhase ? "Chỉnh sửa giai đoạn" : "Tạo giai đoạn mới"}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingPhase ? "Cập nhật" : "Tạo giai đoạn"}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên giai đoạn *
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="VD: Giai đoạn 1: Thu thập yêu cầu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mục tiêu
                        </label>
                        <Input
                            type="text"
                            value={formData.goal}
                            onChange={e => setFormData({ ...formData, goal: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="VD: Hoàn thành tài liệu yêu cầu"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày bắt đầu
                            </label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày kết thúc
                            </label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả
                        </label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Mô tả chi tiết về giai đoạn này"
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDeletePhase}
                title="Xóa giai đoạn"
                description={`Bạn có chắc chắn muốn xóa giai đoạn "${deletingPhase?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="destructive"
            />
        </>
    );
}
