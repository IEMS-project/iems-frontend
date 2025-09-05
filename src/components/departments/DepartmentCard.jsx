import React from "react";
import { Card, CardContent } from "../ui/Card";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

export default function DepartmentCard({ department, onEdit, onDelete }) {
    const navigate = useNavigate();

    const handleCardClick = (e) => {
        // Chỉ navigate khi click vào phần nội dung, không phải nút
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
        <div onClick={handleCardClick} className="group cursor-pointer relative">
            <Card className="h-32 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-4 h-full flex flex-col justify-center">
                    {/* Action buttons - positioned at top right corner */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                        <button
                            onClick={handleEdit}
                            className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            title="Sửa phòng ban"
                        >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Xóa phòng ban"
                        >
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Department content */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${department.color}`}></div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{department.name}</h3>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{department.memberCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">thành viên</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


