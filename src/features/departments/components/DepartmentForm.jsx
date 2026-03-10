import React from "react";
import { useTranslation } from "react-i18next";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/select";
import { textColors, inputColors, borderColors } from "@/theme/colors";

export default function DepartmentForm({ formData, setFormData, isEdit = false, userOptions = [] }) {
    const { t } = useTranslation();

    const colorOptions = [
        { value: "bg-blue-500", labelKey: "departments.colors.blue", color: "bg-blue-500" },
        { value: "bg-purple-500", labelKey: "departments.colors.purple", color: "bg-purple-500" },
        { value: "bg-green-500", labelKey: "departments.colors.green", color: "bg-green-500" },
        { value: "bg-orange-500", labelKey: "departments.colors.orange", color: "bg-orange-500" },
        { value: "bg-red-500", labelKey: "departments.colors.red", color: "bg-red-500" },
        { value: "bg-pink-500", labelKey: "departments.colors.pink", color: "bg-pink-500" },
        { value: "bg-indigo-500", labelKey: "departments.colors.indigo", color: "bg-indigo-500" },
        { value: "bg-teal-500", labelKey: "departments.colors.teal", color: "bg-teal-500" },
    ];

    return (
        <div className="space-y-4">
            <Input
                label={t("departments.form.departmentName")}
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("departments.form.departmentNamePlaceholder")}
                required
            />
            <Textarea
                label={t("departments.form.description")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("departments.form.descriptionPlaceholder")}
                rows={3}
            />
            <div>
                <label className={`block text-sm font-medium ${textColors.primary} mb-2`}>
                    {isEdit ? t("departments.form.managerOptional") : t("departments.form.managerCanBeEmpty")}
                </label>
                <select
                    className={`w-full h-10 rounded-md ${inputColors.base} ${inputColors.focus} px-3 text-sm`}
                    value={formData.managerId || ""}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value || null })}
                >
                    <option value="">{t("departments.form.notSelected")}</option>
                    {userOptions.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className={`block text-sm font-medium ${textColors.primary} mb-2`}>
                    {t("departments.form.color")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((option) => (
                        <div
                            key={option.value}
                            className={`w-8 h-8 rounded-full ${option.color} cursor-pointer border-2 ${formData.color === option.value
                                ? `${textColors.primary} border-current`
                                : `${borderColors.medium}`
                                }`}
                            onClick={() => setFormData({ ...formData, color: option.value })}
                            title={t(option.labelKey)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
