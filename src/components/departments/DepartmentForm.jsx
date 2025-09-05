import React from "react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";

const colorOptions = [
    { value: "bg-blue-500", label: "Xanh dương", color: "bg-blue-500" },
    { value: "bg-purple-500", label: "Tím", color: "bg-purple-500" },
    { value: "bg-green-500", label: "Xanh lá", color: "bg-green-500" },
    { value: "bg-orange-500", label: "Cam", color: "bg-orange-500" },
    { value: "bg-red-500", label: "Đỏ", color: "bg-red-500" },
    { value: "bg-pink-500", label: "Hồng", color: "bg-pink-500" },
    { value: "bg-indigo-500", label: "Chàm", color: "bg-indigo-500" },
    { value: "bg-teal-500", label: "Xanh ngọc", color: "bg-teal-500" },
];

export default function DepartmentForm({ formData, setFormData, isEdit = false }) {
    return (
        <div className="space-y-4">
            <Input
                label="Tên phòng ban"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên phòng ban"
                required
            />
            <Textarea
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả phòng ban"
                rows={3}
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Màu sắc
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((option) => (
                        <div
                            key={option.value}
                            className={`w-8 h-8 rounded-full ${option.color} cursor-pointer border-2 ${
                                formData.color === option.value 
                                    ? 'border-gray-900 dark:border-white' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}
                            onClick={() => setFormData({ ...formData, color: option.value })}
                            title={option.label}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
