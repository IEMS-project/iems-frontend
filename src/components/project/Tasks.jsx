import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

const tasksData = [
    { id: "T-101", title: "Thiết kế kiến trúc", assignee: "Nguyễn Văn A", status: "Đang làm", priority: "Cao", dueDate: "2024-10-15" },
    { id: "T-102", title: "API xác thực", assignee: "Trần Thị B", status: "Đang làm", priority: "Trung bình", dueDate: "2024-10-20" },
    { id: "T-103", title: "UI Dashboard", assignee: "Lê Văn C", status: "Chờ", priority: "Thấp", dueDate: "2024-11-01" },
    { id: "T-104", title: "Kiểm thử", assignee: "Phạm D", status: "Chờ", priority: "Trung bình", dueDate: "2024-11-15" },
];

function statusVariant(status) {
    switch (status) {
        case "Hoàn thành": return "green";
        case "Đang làm": return "blue";
        case "Chờ": return "yellow";
        default: return "gray";
    }
}

export default function Tasks() {
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
                    <Table>
                        <THead>
                            <TR>
                                <TH>Mã</TH>
                                <TH>Tiêu đề</TH>
                                <TH>Phụ trách</TH>
                                <TH>Trạng thái</TH>
                                <TH>Ưu tiên</TH>
                                <TH></TH>
                            </TR>
                        </THead>
                        <TBody>
                            {tasksData.map(t => (
                                <TR key={t.id}>
                                    <TD className="font-medium">{t.id}</TD>
                                    <TD>{t.title}</TD>
                                    <TD>{t.assignee}</TD>
                                    <TD><Badge variant={statusVariant(t.status)}>{t.status}</Badge></TD>
                                    <TD>{t.priority}</TD>
                                    <TD>
                                        <button 
                                            onClick={() => handleEditTask(t)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Sửa
                                        </button>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>
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
                        <input
                            type="text"
                            value={formData.id}
                            onChange={(e) => setFormData({...formData, id: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập mã task"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tiêu đề"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phụ trách</label>
                        <input
                            type="text"
                            value={formData.assignee}
                            onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nhập tên người phụ trách"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Chờ">Chờ</option>
                            <option value="Đang làm">Đang làm</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ưu tiên</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Thấp">Thấp</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Cao">Cao</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
