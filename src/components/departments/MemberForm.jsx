import React, { useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { userService } from "../../services/userService";

export default function MemberForm({ formData, setFormData, isEdit = false }) {
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
                setRolesError(e?.message || "Không tải được danh sách vai trò");
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
                <Input
                    label="Họ"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Nhập họ"
                />
                <Input
                    label="Tên"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Nhập tên"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Nhập email"
                />
                <Input
                    label="Số điện thoại"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Nhập số điện thoại"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Ngày sinh"
                    type="date"
                    value={formatDateInput(formData.dob)}
                    onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                    }
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Giới tính
                    </label>
                    <Select
                        value={formData.gender}
                        onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                        }
                        className="w-full"
                    >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Replace free-text role with system role select labelled 'Vai trò' */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vai trò
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
                        <option value="">{rolesLoading ? "Đang tải..." : "Chọn vai trò"}</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.code}>{r.name}</option>
                        ))}
                    </Select>
                    {rolesError && (
                        <div className="mt-1 text-xs text-red-600">{rolesError}</div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Loại hợp đồng
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
                        <option value="FULLTIME">Full-time</option>
                        <option value="PARTTIME">Part-time</option>
                        <option value="REMOTE">Remote</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Tên ngân hàng"
                    type="text"
                    value={formData.bankName}
                    onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                    }
                    placeholder="Nhập tên ngân hàng"
                />
                <Input
                    label="Số tài khoản ngân hàng"
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            bankAccountNumber: e.target.value,
                        })
                    }
                    placeholder="Nhập số tài khoản ngân hàng"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="CCCD"
                    type="text"
                    value={formData.personalID}
                    onChange={(e) =>
                        setFormData({ ...formData, personalID: e.target.value })
                    }
                    placeholder="Nhập số CCCD"
                />
                <Input
                    label="Ngày vào làm"
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

            {!isEdit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Tên đăng nhập"
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                        }
                        placeholder="Nhập tên đăng nhập"
                    />
                    <Input
                        label="Mật khẩu"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Nhập mật khẩu"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Hình ảnh"
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="Nhập URL hình ảnh"
                />
            </div>

            <Input
                label="Địa chỉ"
                type="text"
                value={formData.address}
                onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Nhập địa chỉ"
            />
        </div>
    );
}
