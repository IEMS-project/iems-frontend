import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useParams, useNavigate } from "react-router-dom";
import { taskService } from "../../services/taskService";
import { projectService } from "../../services/projectService";
import UserSelect from "./UserSelect";
import UserAvatar from "../ui/UserAvatar";
import TaskDetailModal from "./TaskDetailModal";
export default function Tasks({ tasks: tasksProp, onTasksChange }) {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tasksData, setTasksData] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]);

    // Danh sách thành viên trong dự án để chọn làm người phụ trách
    // Tải từ API dự án

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
    const [showDetail, setShowDetail] = useState(false);
    const [detailTask, setDetailTask] = useState(null);
    const [formData, setFormData] = useState({
        id: "",
        title: "",
        description: "",
        assignee: "",
        status: "Chờ",
        priority: "Trung bình",
        taskType: "TASK",
        parentTaskId: "",
        startDate: "",
        dueDate: ""
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [data, members] = await Promise.all([
                    tasksProp ? Promise.resolve(tasksProp) : taskService.getTasksByProject(projectId),
                    projectService.getProjectMembers(projectId)
                ]);

                // Check if response indicates permission error
                if (data && data.status === "error" &&
                    (data.message?.includes("Permission denied") ||
                        data.message?.includes("PERMISSION_DENIED"))) {
                    console.log("Permission error in Tasks response data, redirecting...");
                    navigate("/permission-denied");
                    return;
                }

                const nextTasks = Array.isArray(data) ? data : [];
                setTasksData(nextTasks);
                if (onTasksChange && !tasksProp) onTasksChange(nextTasks);
                const users = Array.isArray(members) ? members.map(m => ({
                    id: m.userId,
                    fullName: m.userName || m.userEmail,
                    email: m.userEmail
                })) : [];
                setAssignableUsers(users);
            } catch (e) {
                console.log("Tasks Error:", e);
                console.log("Error status:", e.status);
                console.log("Error message:", e.message);
                console.log("Error data:", e.data);

                // Check if it's a permission error
                if (e.status === 403 ||
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    console.log("Permission error detected in Tasks, redirecting...");
                    // Redirect immediately to permission denied page
                    navigate("/permission-denied");
                    return;
                } else {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId, navigate, tasksProp]);

    const handleEditTask = (task) => {
        setEditingTask(task);
        const assignedId = task.assignedTo?.id || task.assignedTo || "";
        const currentStatus = (task.status || '').toString();
        const statusForSelect = currentStatus.includes('In Progress') ? 'Đang làm' : (currentStatus.includes('Hoàn thành') || currentStatus.includes('Completed')) ? 'Hoàn thành' : 'Chờ';
        setFormData({
            id: task.id,
            title: task.title,
            description: task.description || "",
            assignee: assignedId,
            status: statusForSelect,
            priority: task.priority,
            taskType: (task.taskType || '').toString().toUpperCase().includes('EPIC') ? 'EPIC'
                : (task.taskType || '').toString().toUpperCase().includes('STORY') ? 'STORY'
                : (task.taskType || '').toString().toUpperCase().includes('BUG') ? 'BUG'
                : 'TASK',
            parentTaskId: task.parentTaskId || "",
            startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : "",
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
        });
        setShowModal(true);
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setFormData({
            id: "",
            title: "",
            description: "",
            assignee: "",
            status: "Chờ",
            priority: "Trung bình",
            taskType: "TASK",
            parentTaskId: "",
            startDate: "",
            dueDate: ""
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (!formData.title.trim()) {
                alert("Vui lòng nhập tiêu đề");
                return;
            }
            if (!formData.assignee) {
                alert("Vui lòng chọn người phụ trách trong dự án");
                return;
            }
            if (!formData.dueDate) {
                alert("Vui lòng chọn hạn hoàn thành");
                return;
            }

            const payload = {
                projectId,
                title: formData.title.trim(),
                description: formData.description?.trim() || undefined,
                assignedTo: formData.assignee,
                status: formData.status,
                priority: formData.priority,
                taskType: formData.taskType,
                parentTaskId: formData.parentTaskId || undefined,
                startDate: formData.startDate || undefined,
                dueDate: formData.dueDate,
            };

            if (editingTask?.id) {
                await taskService.updateTask(editingTask.id, payload);
            } else {
                await taskService.createTask(payload);
            }

            const refreshed = await taskService.getTasksByProject(projectId);
            const list = Array.isArray(refreshed) ? refreshed : [];
            setTasksData(list);
            if (onTasksChange) onTasksChange(list);

            setShowModal(false);
            setFormData({
                id: "",
                title: "",
                description: "",
                assignee: "",
                status: "Chờ",
                priority: "Trung bình",
                taskType: "TASK",
                parentTaskId: "",
                startDate: "",
                dueDate: ""
            });
        } catch (e) {
            console.error("Error saving task:", e);
            if (e.status === 403 ||
                e.message?.includes("PERMISSION_DENIED") ||
                e.message?.includes("permission") ||
                e.message?.includes("quyền") ||
                e.message?.includes("Permission denied")) {
                navigate("/permission-denied");
                return;
            } else {
                alert(e?.message || "Có lỗi xảy ra khi lưu task");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({
            id: "",
            title: "",
            assignee: "",
            status: "Chờ",
            priority: "Trung bình",
            taskType: "TASK",
            parentTaskId: "",
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
                                    tasksData.map(t => {
                                        const assignedName = t.assignedToName || t.assignedTo?.name || t.assignedToEmail || '';
                                        const assignedEmail = t.assignedToEmail || '';
                                        const createdName = t.createdByName || t.createdBy?.name || t.createdByEmail || '';
                                        const createdEmail = t.createdByEmail || '';
                                        return (
                                            <TR key={t.id}>
                                                <TD className="min-w-[180px]">{t.title}</TD>
                                                <TD className="flex items-center gap-2 min-w-[180px]">
                                                    <UserAvatar user={{ firstName: assignedName, email: assignedEmail }} size="xs" />
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="font-medium">{assignedName}</span>
                                                        <span className="text-sm text-gray-500">{assignedEmail}</span>
                                                    </div>
                                                </TD>

                                                <TD className="min-w-[100px]"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></TD>
                                                <TD className="min-w-[100px]">{t.priority}</TD>
                                                <TD className="min-w-[100px]">{t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '-'}</TD>
                                                <TD className="min-w-[100px]">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '-'}</TD>
                                                <TD className="flex items-center gap-2 min-w-[180px]">
                                                    <UserAvatar user={{ firstName: createdName, email: createdEmail }} size="xs" />
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="font-medium">{createdName}</span>
                                                        <span className="text-sm text-gray-500">{createdEmail}</span>
                                                    </div>
                                                </TD>
                                                <TD>
                                                    <button
                                                        onClick={() => handleEditTask(t)}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <span className="mx-1 text-gray-300">|</span>
                                                    <button
                                                        onClick={() => { setDetailTask(t); setShowDetail(true); }}
                                                        className="text-xs text-gray-700 hover:underline"
                                                    >
                                                        Xem
                                                    </button>
                                                </TD>
                                            </TR>
                                        );
                                    })
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
                    {editingTask && (
                        <div className="sm:col-span-2">
                            <div className="text-sm text-gray-600">Dự án: <span className="font-medium">{(editingTask.project && editingTask.project.name) || editingTask.projectName || '-'}</span></div>
                        </div>
                    )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại nhiệm vụ</label>
                        <Select
                            value={formData.taskType}
                            onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="EPIC">Epic</option>
                            <option value="TASK">Task</option>
                            <option value="STORY">Story</option>
                            <option value="BUG">Bug</option>
                        </Select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={5}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mô tả chi tiết cho task"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thuộc nhiệm vụ (Subtask của)</label>
                        <Select
                            value={formData.parentTaskId}
                            onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">-- Không --</option>
                            {tasksData
                                .filter(t => !editingTask || t.id !== editingTask.id)
                                .map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phụ trách</label>
                        <UserSelect
                            assignableUsers={assignableUsers}
                            value={formData.assignee}
                            onChange={(id) => setFormData({ ...formData, assignee: id })}
                        />
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
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </Modal>

            <TaskDetailModal open={showDetail} onClose={() => { setShowDetail(false); setDetailTask(null); }} task={detailTask} />





        </>

    );

}


