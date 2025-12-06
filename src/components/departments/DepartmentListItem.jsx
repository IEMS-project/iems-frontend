import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import IconActionButton from "../ui/IconActionButton";
import { PencilLine, Trash2 } from "lucide-react";
import { textColors, bgColors, statusColors } from "@/theme/colors";

export default function DepartmentListItem({ department, onEdit, onDelete }) {
    const { t } = useTranslation();
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
            className={`group cursor-pointer ${bgColors.hover} transition-colors duration-150`}
        >
            <div className="flex items-center px-4 py-3 gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${department.color || 'bg-blue-500'}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="truncate">
                            <div className={`text-sm font-semibold ${textColors.primary} truncate`}>{department.name}</div>
                            {department.description && (
                                <div className={`text-xs ${textColors.muted} truncate`}>{department.description}</div>
                            )}
                        </div>

                        <div className="ml-4 text-right hidden sm:block">
                            <div className={`text-lg font-bold ${statusColors.infoText}`}>{department.memberCount}</div>
                            <div className={`text-xs ${textColors.muted}`}>{t("departments.members")}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <IconActionButton
                        icon={PencilLine}
                        label={t("departments.tooltips.editDepartment")}
                        variant="edit"
                        onClick={handleEdit}
                        className="shadow-sm"
                    />
                    <IconActionButton
                        icon={Trash2}
                        label={t("departments.tooltips.deleteDepartment")}
                        variant="danger"
                        onClick={handleDelete}
                        className="shadow-sm"
                    />
                </div>
            </div>
        </div>
    );
}
