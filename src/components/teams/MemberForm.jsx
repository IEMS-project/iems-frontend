import React from "react";
import Input from "../ui/Input";

export default function MemberForm({ formData, setFormData, isEdit = false }) {
    return (
        <div className="space-y-4">
            <Input
                label="Họ tên"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập họ tên thành viên"
            />
            <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Nhập email thành viên"
            />
            <Input
                label="Vai trò"
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Nhập vai trò thành viên"
            />
        </div>
    );
}


