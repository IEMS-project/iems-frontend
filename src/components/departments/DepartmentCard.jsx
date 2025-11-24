import React from "react";
import { Card, CardContent } from "../ui/Card";
import { useNavigate } from "react-router-dom";
import IconActionButton from "@/components/ui/IconActionButton";
import { PencilLine, Trash2 } from "lucide-react";

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
                        <IconActionButton
                            icon={PencilLine}
                            label="Sửa phòng ban"
                            variant="edit"
                            onClick={handleEdit}
                            className="shadow-md"
                        />
                        <IconActionButton
                            icon={Trash2}
                            label="Xóa phòng ban"
                            variant="danger"
                            onClick={handleDelete}
                            className="shadow-md"
                        />
                    </div>
                    
                    {/* Department content */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${department.color || 'bg-blue-500'}`}></div>
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


