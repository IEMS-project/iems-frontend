import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useParams } from "react-router-dom";
import { taskService } from "../../services/taskService";
import UserAvatar from "../ui/UserAvatar";
export default function Tasks() {
    const { projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [tasksData, setTasksData] = useState([]);

    // Danh sách thành viên có sẵn để chọn làm người phụ trách
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

    function statusVariant(status) {
        switch (status) {
            case "Hoàn thành": return "green";
            case "Đang làm": return "blue";
            case "Chờ": return "yellow";
            default: return "gray";
        }
    }

    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        id: "",
        title: "",
        assignee: "",
        status: "Chờ",
        priority: "Trung bình",
        dueDate: ""
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await taskService.getTasksByProject(projectId);
                setTasksData(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId]);

    const handleEditTask = (task) => {
        setEditingTask(task);
        setFormData({
            id: task.id,
            title: task.title,
            assignee: task.assignee,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate
        });
        setShowModal(true);
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setFormData({
            id: "",
            title: "",
            assignee: "",
            status: "Chờ",
            priority: "Trung bình",
            dueDate: ""
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        // Here you would typically save the data
        console.log("Saving task:", formData);
        setShowModal(false);
        setFormData({
            id: "",
            title: "",
            assignee: "",
            status: "Chờ",
            priority: "Trung bình",
            dueDate: ""
        });
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({
            id: "",
            title: "",
            assignee: "",
            status: "Chờ",
            priority: "Trung bình",
            dueDate: ""
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Nhiệm vụ</CardTitle>
                        <Button size="sm" onClick={handleAddTask}>+ Thêm task</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                        <Table className="min-w-full">
                            <THead>
                                <TR>
                                    <TH className="sticky top-0 bg-white z-10">Nhiệm vụ</TH>
                                    <TH className="sticky top-0 bg-white z-10">Người thực hiện</TH>
                                    <TH className="sticky top-0 bg-white z-10">Trạng thái</TH>
                                    <TH className="sticky top-0 bg-white z-10">Độ ưu tiên</TH>
                                    <TH className="sticky top-0 bg-white z-10">Bắt đầu</TH>
                                    <TH className="sticky top-0 bg-white z-10">Kết thúc</TH>
                                    <TH className="sticky top-0 bg-white z-10">Người tạo</TH>
                                    <TH className="sticky top-0 bg-white z-10">Hành động</TH>


                                </TR>
                            </THead>
                            <TBody>
                                {loading ? (
                                    <TR><TD colSpan="8" className="py-6 text-center text-gray-500">Đang tải...</TD></TR>
                                ) : tasksData.length === 0 ? (
                                    <TR><TD colSpan="8" className="py-6 text-center text-gray-500">Chưa có task</TD></TR>
                                ) : (
                                    tasksData.map(t => (
                                        <TR key={t.id}>
                                            <TD className="min-w-[180px]">{t.title}</TD>
                                            <TD className="flex items-center gap-2 min-w-[180px]">
                                                <UserAvatar user={{ firstName: t.assignedToName, email: t.assignedToEmail }} size="xs" />
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="font-medium">{t.assignedToName || t.assignedToEmail || t.assignedTo}</span>
                                                    <span className="text-sm text-gray-500">{t.assignedToEmail}</span>
                                                </div>
                                            </TD>

                                            <TD className="min-w-[100px]"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></TD>
                                            <TD className="min-w-[100px]">{t.priority}</TD>
                                            <TD className="min-w-[100px]">{t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '-'}</TD>
                                            <TD className="min-w-[100px]">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '-'}</TD>
                                            <TD className="flex items-center gap-2 min-w-[180px]">
                                                <UserAvatar user={{ firstName: t.createdByName, email: t.createdByEmail }} size="xs" />
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="font-medium">{t.createdByName || t.createdByEmail || t.createdBy}</span>
                                                    <span className="text-sm text-gray-500">{t.createdByEmail}</span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <button
                                                    onClick={() => handleEditTask(t)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Sửa
                                                </button>
                                            </TD>
                                        </TR>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingTask ? 'Chỉnh sửa task' : 'Thêm task mới'}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                        <Button onClick={handleSubmit}>
                            {editingTask ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã task</label>
                        <Input
                            type="text"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mã task"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                        <Input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tiêu đề"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phụ trách</label>
                        <Select
                            value={formData.assignee}
                            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn người phụ trách</option>
                            {availableMembers.map(member => (
                                <option key={member} value={member}>{member}</option>
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
                            <option value="Chờ">Chờ</option>
                            <option value="Đang làm">Đang làm</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ưu tiên</label>
                        <Select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Thấp">Thấp</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Cao">Cao</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
