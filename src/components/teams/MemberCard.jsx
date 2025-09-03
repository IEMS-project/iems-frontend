import React from "react";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

export default function MemberCard({ member, onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
                <Avatar size="sm">{member.avatar}</Avatar>
                <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                        {member.role}
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
