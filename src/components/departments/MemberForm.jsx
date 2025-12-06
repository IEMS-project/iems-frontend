import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../ui/Input";
import Select from "../ui/select";
import { userService } from "../../services/userService";
import {
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    FileText,
    Building2,
    CreditCard,
    IdCard,
    MapPin,
    UserCircle2,
    Lock,
} from "lucide-react";

export default function MemberForm({ formData, setFormData, isEdit = false }) {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [rolesError, setRolesError] = useState("");

    useEffect(() => {
        let mounted = true;
        const loadRoles = async () => {
            try {
                setRolesLoading(true);
                setRolesError("");
                const data = await userService.getRoles();
                if (!mounted) return;
                const normalized = Array.isArray(data)
                    ? data.map((r) => ({
                        id: r.id || r.roleId || r.code || r.name,
                        code: r.code || r.name || r.id,
                        name: r.name || r.code || r.id,
                    }))
                    : [];
                setRoles(normalized);
            } catch (e) {
                if (!mounted) return;
                setRolesError(e?.message || t("departments.memberForm.noRoles"));
            } finally {
                if (mounted) setRolesLoading(false);
            }
        };
        loadRoles();
        return () => { mounted = false; };
    }, []);
    const formatDateInput = (value) => {
        if (!value) return "";
        try {
            const str = String(value);
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
            const d = new Date(str);
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
            return "";
        } catch (e) {
            return "";
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Họ */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.firstNameLabel")}</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                        }
                        placeholder={t("departments.memberForm.firstNamePlaceholder")}
                    />
                </div>

                {/* Tên */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.lastNameLabel")}</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder={t("departments.memberForm.lastNamePlaceholder")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.emailLabel")}</span>
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder={t("departments.memberForm.emailPlaceholder")}
                    />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.phoneLabel")}</span>
                    </label>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder={t("departments.memberForm.phonePlaceholder")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ngày sinh */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.dobLabel")}</span>
                    </label>
                    <Input
                        type="date"
                        value={formatDateInput(formData.dob)}
                        onChange={(e) =>
                            setFormData({ ...formData, dob: e.target.value })
                        }
                    />
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.genderLabel")}</span>
                    </label>
                    <Select
                        value={formData.gender}
                        onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                        }
                        className="w-full"
                    >
                        <option value="MALE">{t("departments.memberForm.male")}</option>
                        <option value="FEMALE">{t("departments.memberForm.female")}</option>
                        <option value="OTHER">{t("departments.memberForm.other")}</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Replace free-text role with system role select labelled 'Vai trò' */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.roleLabel")}</span>
                    </label>
                    <Select
                        value={(formData.roleCodes && formData.roleCodes[0]) || ""}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                roleCodes: e.target.value ? [e.target.value] : [],
                            })
                        }
                        className="w-full"
                    >
                        <option value="">{rolesLoading ? t("departments.memberForm.loadingRoles") : t("departments.memberForm.selectRole")}</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.code}>{r.name}</option>
                        ))}
                    </Select>
                    {rolesError && (
                        <div className="mt-1 text-xs text-red-600">{rolesError}</div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.contractTypeLabel")}</span>
                    </label>
                    <Select
                        value={formData.contractType}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                contractType: e.target.value,
                            })
                        }
                        className="w-full"
                    >
                        <option value="FULLTIME">{t("departments.memberForm.fullTime")}</option>
                        <option value="PARTTIME">{t("departments.memberForm.partTime")}</option>
                        <option value="REMOTE">{t("departments.memberForm.remote")}</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên ngân hàng */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.bankNameLabel")}</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) =>
                            setFormData({ ...formData, bankName: e.target.value })
                        }
                        placeholder={t("departments.memberForm.bankNamePlaceholder")}
                    />
                </div>

                {/* Số tài khoản ngân hàng */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.bankAccountLabel")}</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.bankAccountNumber}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                bankAccountNumber: e.target.value,
                            })
                        }
                        placeholder={t("departments.memberForm.bankAccountPlaceholder")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CCCD */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.personalIdLabel")}</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.personalID}
                        onChange={(e) =>
                            setFormData({ ...formData, personalID: e.target.value })
                        }
                        placeholder={t("departments.memberForm.personalIdPlaceholder")}
                    />
                </div>

                {/* Ngày vào làm */}
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{t("departments.memberForm.startDateLabel")}</span>
                    </label>
                    <Input
                        type="date"
                        value={formatDateInput(formData.startDate)}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                startDate: e.target.value,
                            })
                        }
                    />
                </div>
            </div>

            {!isEdit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tên đăng nhập */}
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                            <span>{t("departments.memberForm.usernameLabel")}</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                            placeholder={t("departments.memberForm.usernamePlaceholder")}
                        />
                    </div>

                    {/* Mật khẩu */}
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span>{t("departments.memberForm.passwordLabel")}</span>
                        </label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder={t("departments.memberForm.passwordPlaceholder")}
                        />
                    </div>
                </div>
            )}

            {/* Địa chỉ */}
            <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{t("departments.memberForm.addressLabel")}</span>
                </label>
                <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder={t("departments.memberForm.addressPlaceholder")}
                />
            </div>
        </div>
    );
}
