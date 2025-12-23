import React from "react";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button";
import { textColors, bgColors, statusColors } from "@/theme/colors";

function MemberCard({ member, onEdit, onDelete }) {
    return (
        <div className={`flex items-start justify-between p-3 rounded-lg ${bgColors.muted}`}>
            <div className="flex items-start gap-3">
                <Avatar size="sm">{member.avatar}</Avatar>
                <div className="space-y-1">
                    <div className={`font-medium ${textColors.primary}`}>{member.name} <span className={`ml-2 text-xs ${textColors.muted}`}>#{member.id}</span></div>
                    <div className={`text-sm ${textColors.secondary}`}>{member.email}</div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${statusColors.infoBg} ${statusColors.infoText}`}>{member.role}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(member)}
                >
                    Sửa
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDelete(member.id)}
                    className="text-red-600 hover:text-red-700"
                >
                    Xóa
                </Button>
            </div>
        </div>
    );
}

export default React.memo(MemberCard, (prev, next) => {
    return (
        prev.member.id === next.member.id &&
        prev.member.name === next.member.name &&
        prev.member.email === next.member.email &&
        prev.member.role === next.member.role &&
        prev.onEdit === next.onEdit &&
        prev.onDelete === next.onDelete
    );
});


