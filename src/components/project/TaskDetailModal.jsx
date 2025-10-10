import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function TaskDetailModal({ open, onClose, task }) {
    const statusVariant = (status) => {
        switch (status) {
            case "Hoàn thành": return "green";
            case "Đang làm": return "blue";
            case "Chờ": return "yellow";
            default: return "gray";
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Chi tiết task"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Đóng</Button>
                </div>
            }
        >
            {task && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <div className="text-xs uppercase text-gray-500">Dự án</div>
                            <div className="text-gray-800">{(task.project && task.project.name) || task.projectName || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Trạng thái</div>
                            <div className="text-gray-800"><Badge variant={statusVariant(task.status)}>{task.status}</Badge></div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Ưu tiên</div>
                            <div className="text-gray-800">{task.priority}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Người thực hiện</div>
                            <div className="text-gray-800">{task.userName || task.assignedToName || task.assigneeName || task.assignedTo?.name || task.assignedToEmail || task.assigneeEmail || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Bắt đầu</div>
                            <div className="text-gray-800">{task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-gray-500">Hạn hoàn thành</div>
                            <div className="text-gray-800">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : (task.endDate ? new Date(task.endDate).toLocaleDateString('vi-VN') : '-')}</div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">Mô tả</div>
                        <div className="whitespace-pre-wrap rounded border p-3 text-sm text-gray-800 bg-white">{task.description || '—'}</div>
                    </div>
                </div>
            )}
        </Modal>
    );
}





