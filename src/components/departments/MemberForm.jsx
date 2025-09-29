import React from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";

export default function MemberForm({ formData, setFormData, isEdit = false }) {
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
                {/* Vai trò công việc -> Input text */}
                <Input
                    label="Vai trò"
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="Nhập vai trò (VD: Backend, Kế toán, Marketing...)"
                />

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
                {!isEdit && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Vai trò hệ thống
                        </label>
                        <Select
                            value={formData.roleCodes}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    roleCodes: [e.target.value],
                                })
                            }
                            className="w-full"
                        >
                            <option value="">Chọn vai trò hệ thống</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="HR">HR</option>
                            <option value="ACCOUNTANT">Accountant</option>
                            <option value="EMPLOYEE">Employee</option>
                        </Select>
                    </div>
                )}
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
