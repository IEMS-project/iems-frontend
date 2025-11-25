import React from "react";
import { useNavigate } from "react-router-dom";
import IconActionButton from "../ui/IconActionButton";
import { PencilLine, Trash2 } from "lucide-react";

export default function DepartmentListItem({ department, onEdit, onDelete }) {
    const navigate = useNavigate();

    const handleRowClick = (e) => {
        // don't navigate if clicking on a control button
        if (!e.target.closest('button')) {
            navigate(`/departments/${department.id}`);
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(department);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(department);
    };

    return (
        <div
            onClick={handleRowClick}
            className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-150"
        >
            <div className="flex items-center px-4 py-3 gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${department.color || 'bg-blue-500'}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="truncate">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{department.name}</div>
                            {department.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{department.description}</div>
                            )}
                        </div>

                        <div className="ml-4 text-right hidden sm:block">
                            <div className="text-lg font-bold text-blue-600">{department.memberCount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">thành viên</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <IconActionButton
                        icon={PencilLine}
                        label="Sửa phòng ban"
                        variant="edit"
                        onClick={handleEdit}
                        className="shadow-sm"
                    />
                    <IconActionButton
                        icon={Trash2}
                        label="Xóa phòng ban"
                        variant="danger"
                        onClick={handleDelete}
                        className="shadow-sm"
                    />
                </div>
            </div>
        </div>
    );
}
