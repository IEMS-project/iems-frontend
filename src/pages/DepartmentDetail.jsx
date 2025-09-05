import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import MemberCard from "../components/departments/MemberCard";
import MemberForm from "../components/departments/MemberForm";
import PageHeader from "../components/common/PageHeader";

const initialDepartments = {
    "dev": {
        id: "dev",
        name: "Phát triển",
        description: "Phát triển sản phẩm và tính năng mới",
        memberCount: 8,
        color: "bg-blue-500",
        members: [
            { 
                id: "M001", 
                firstName: "Nguyễn", 
                lastName: "Văn A", 
                email: "a.nguyen@company.com", 
                phone: "0123456789",
                dob: "1990-05-15",
                gender: "Nam",
                role: "Backend", 
                contractType: "Full-time", 
                address: "123 Đường ABC, Quận 1, TP.HCM",
                cccd: "123456789012",
                bankName: "Vietcombank",
                bankAccount: "1234567890",
                joinDate: "2020-01-15",
                avatar: "A" 
            },
            { 
                id: "M002", 
                firstName: "Trần", 
                lastName: "Thị B", 
                email: "b.tran@company.com", 
                phone: "0123456790",
                dob: "1992-08-20",
                gender: "Nữ",
                role: "Frontend", 
                contractType: "Full-time", 
                address: "456 Đường DEF, Quận 2, TP.HCM",
                cccd: "123456789013",
                bankName: "BIDV",
                bankAccount: "1234567891",
                joinDate: "2020-03-10",
                avatar: "B" 
            },
            { 
                id: "M003", 
                firstName: "Lê", 
                lastName: "Văn C", 
                email: "c.le@company.com", 
                phone: "0123456791",
                dob: "1988-12-03",
                gender: "Nam",
                role: "Backend", 
                contractType: "Part-time", 
                address: "789 Đường GHI, Quận 3, TP.HCM",
                cccd: "123456789014",
                bankName: "Agribank",
                bankAccount: "1234567892",
                joinDate: "2021-06-01",
                avatar: "C" 
            },
            { 
                id: "M004", 
                firstName: "Phạm", 
                lastName: "Thị D", 
                email: "d.pham@company.com", 
                phone: "0123456792",
                dob: "1995-03-25",
                gender: "Nữ",
                role: "Frontend", 
                contractType: "Remote", 
                address: "321 Đường JKL, Quận 4, TP.HCM",
                cccd: "123456789015",
                bankName: "Techcombank",
                bankAccount: "1234567893",
                joinDate: "2021-09-15",
                avatar: "D" 
            },
            { 
                id: "M005", 
                firstName: "Hoàng", 
                lastName: "Văn E", 
                email: "e.hoang@company.com", 
                phone: "0123456793",
                dob: "1991-07-10",
                gender: "Nam",
                role: "Backend", 
                contractType: "Full-time", 
                address: "654 Đường MNO, Quận 5, TP.HCM",
                cccd: "123456789016",
                bankName: "Vietinbank",
                bankAccount: "1234567894",
                joinDate: "2020-11-20",
                avatar: "E" 
            },
            { 
                id: "M006", 
                firstName: "Vũ", 
                lastName: "Thị F", 
                email: "f.vu@company.com", 
                phone: "0123456794",
                dob: "1993-11-18",
                gender: "Nữ",
                role: "Frontend", 
                contractType: "Full-time", 
                address: "987 Đường PQR, Quận 6, TP.HCM",
                cccd: "123456789017",
                bankName: "ACB",
                bankAccount: "1234567895",
                joinDate: "2022-02-01",
                avatar: "F" 
            },
            { 
                id: "M007", 
                firstName: "Đặng", 
                lastName: "Văn G", 
                email: "g.dang@company.com", 
                phone: "0123456795",
                dob: "1989-04-12",
                gender: "Nam",
                role: "Backend", 
                contractType: "Remote", 
                address: "147 Đường STU, Quận 7, TP.HCM",
                cccd: "123456789018",
                bankName: "Sacombank",
                bankAccount: "1234567896",
                joinDate: "2021-04-10",
                avatar: "G" 
            },
            { 
                id: "M008", 
                firstName: "Bùi", 
                lastName: "Thị H", 
                email: "h.bui@company.com", 
                phone: "0123456796",
                dob: "1994-09-30",
                gender: "Nữ",
                role: "Frontend", 
                contractType: "Part-time", 
                address: "258 Đường VWX, Quận 8, TP.HCM",
                cccd: "123456789019",
                bankName: "MB Bank",
                bankAccount: "1234567897",
                joinDate: "2022-07-05",
                avatar: "H" 
            }
        ]
    },
    "design": {
        id: "design",
        name: "Thiết kế",
        description: "Thiết kế UI/UX và trải nghiệm người dùng",
        memberCount: 4,
        color: "bg-purple-500",
        members: [
            { id: "M009", name: "Ngô Văn I", email: "i.ngo@company.com", role: "Designer", contractType: "Full-time", avatar: "I" },
            { id: "M010", name: "Đinh Thị K", email: "k.dinh@company.com", role: "Designer", contractType: "Full-time", avatar: "K" },
            { id: "M011", name: "Lý Văn L", email: "l.ly@company.com", role: "Designer", contractType: "Part-time", avatar: "L" },
            { id: "M012", name: "Hồ Thị M", email: "m.ho@company.com", role: "Designer", contractType: "Remote", avatar: "M" }
        ]
    },
    "marketing": {
        id: "marketing",
        name: "Marketing",
        description: "Quảng cáo và truyền thông sản phẩm",
        memberCount: 6,
        color: "bg-green-500",
        members: [
            { id: "M013", name: "Dương Văn N", email: "n.duong@company.com", role: "Marketing", contractType: "Full-time", avatar: "N" },
            { id: "M014", name: "Võ Thị O", email: "o.vo@company.com", role: "Marketing", contractType: "Full-time", avatar: "O" },
            { id: "M015", name: "Tô Văn P", email: "p.to@company.com", role: "Marketing", contractType: "Part-time", avatar: "P" },
            { id: "M016", name: "Châu Thị Q", email: "q.chau@company.com", role: "Marketing", contractType: "Remote", avatar: "Q" },
            { id: "M017", name: "Hà Văn R", email: "r.ha@company.com", role: "Marketing", contractType: "Full-time", avatar: "R" },
            { id: "M018", name: "Lâm Thị S", email: "s.lam@company.com", role: "Marketing", contractType: "Part-time", avatar: "S" }
        ]
    },
    "support": {
        id: "support",
        name: "Hỗ trợ",
        description: "Hỗ trợ khách hàng và giải đáp thắc mắc",
        memberCount: 5,
        color: "bg-orange-500",
        members: [
            { id: "M019", name: "Thái Văn T", email: "t.thai@company.com", role: "Support", contractType: "Full-time", avatar: "T" },
            { id: "M020", name: "Từ Thị U", email: "u.tu@company.com", role: "Support", contractType: "Full-time", avatar: "U" },
            { id: "M021", name: "Trịnh Văn V", email: "v.trinh@company.com", role: "Support", contractType: "Part-time", avatar: "V" },
            { id: "M022", name: "Đoàn Thị W", email: "w.doan@company.com", role: "Support", contractType: "Remote", avatar: "W" },
            { id: "M023", name: "Mai Văn X", email: "x.mai@company.com", role: "Support", contractType: "Full-time", avatar: "X" }
        ]
    }
};

export default function DepartmentDetail() {
    const { departmentId } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [viewingMember, setViewingMember] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: "",
        gender: "Nam",
        role: "",
        contractType: "Full-time",
        address: "",
        cccd: "",
        bankName: "",
        bankAccount: "",
        joinDate: ""
    });

    useEffect(() => {
        const dept = initialDepartments[departmentId];
        if (dept) {
            setDepartment(dept);
        } else {
            navigate("/departments");
        }
    }, [departmentId, navigate]);

    const filteredMembers = useMemo(() => {
        if (!department) return [];
        const q = search.trim().toLowerCase();
        if (!q) return department.members;
        return department.members.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q)
        );
    }, [department, search]);

    const totalPages = useMemo(() => {
        if (!filteredMembers) return 1;
        return Math.max(1, Math.ceil(filteredMembers.length / pageSize));
    }, [filteredMembers, pageSize]);

    const paginatedMembers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredMembers.slice(start, start + pageSize);
    }, [filteredMembers, page, pageSize]);

    useEffect(() => {
        // Reset to first page when search or pageSize changes
        setPage(1);
    }, [search, pageSize]);

    const handleAddMember = () => {
        setFormData({ 
            firstName: "", 
            lastName: "", 
            email: "", 
            phone: "",
            dob: "",
            gender: "Nam",
            role: "", 
            contractType: "Full-time",
            address: "",
            cccd: "",
            bankName: "",
            bankAccount: "",
            joinDate: ""
        });
        setShowAddModal(true);
    };

    const handleViewMember = (member) => {
        setViewingMember(member);
        setShowViewModal(true);
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
        setFormData({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone,
            dob: member.dob,
            gender: member.gender,
            role: member.role,
            contractType: member.contractType,
            address: member.address,
            cccd: member.cccd,
            bankName: member.bankName,
            bankAccount: member.bankAccount,
            joinDate: member.joinDate
        });
        setShowEditModal(true);
    };

    const handleDeleteMember = (memberId) => {
        if (department && window.confirm("Bạn có chắc muốn xóa thành viên này?")) {
            const updatedMembers = department.members.filter(m => m.id !== memberId);
            const updatedDepartment = {
                ...department,
                members: updatedMembers,
                memberCount: updatedMembers.length
            };
            setDepartment(updatedDepartment);
        }
    };

    const handleSubmitAddMember = () => {
        if (formData.firstName && formData.lastName && formData.email && formData.role) {
            const newMember = {
                id: `M${String(Date.now()).slice(-6)}`,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                dob: formData.dob,
                gender: formData.gender,
                role: formData.role,
                contractType: formData.contractType,
                address: formData.address,
                cccd: formData.cccd,
                bankName: formData.bankName,
                bankAccount: formData.bankAccount,
                joinDate: formData.joinDate,
                avatar: formData.firstName.charAt(0)
            };

            const updatedMembers = [...department.members, newMember];
            const updatedDepartment = {
                ...department,
                members: updatedMembers,
                memberCount: updatedMembers.length
            };

            setDepartment(updatedDepartment);
            setShowAddModal(false);
            setFormData({ 
                firstName: "", 
                lastName: "", 
                email: "", 
                phone: "",
                dob: "",
                gender: "Nam",
                role: "", 
                contractType: "Full-time",
                address: "",
                cccd: "",
                bankName: "",
                bankAccount: "",
                joinDate: ""
            });
        }
    };

    const handleSubmitEditMember = () => {
        if (formData.firstName && formData.lastName && formData.email && formData.role && editingMember) {
            const updatedMembers = department.members.map(m =>
                m.id === editingMember.id
                    ? { 
                        ...m, 
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email, 
                        phone: formData.phone,
                        dob: formData.dob,
                        gender: formData.gender,
                        role: formData.role, 
                        contractType: formData.contractType,
                        address: formData.address,
                        cccd: formData.cccd,
                        bankName: formData.bankName,
                        bankAccount: formData.bankAccount,
                        joinDate: formData.joinDate,
                        avatar: formData.firstName.charAt(0) 
                    }
                    : m
            );

            const updatedDepartment = {
                ...department,
                members: updatedMembers
            };

            setDepartment(updatedDepartment);
            setShowEditModal(false);
            setEditingMember(null);
            setFormData({ 
                firstName: "", 
                lastName: "", 
                email: "", 
                phone: "",
                dob: "",
                gender: "Nam",
                role: "", 
                contractType: "Full-time",
                address: "",
                cccd: "",
                bankName: "",
                bankAccount: "",
                joinDate: ""
            });
        }
    };

    if (!department) {
        return null;
    }

    return (
        <>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <PageHeader
                        breadcrumbs={[{ label: "Phòng ban", to: "/departments" }, { label: department.name }]}
                    />
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <Card>

                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className={`p-3 ${department.color} rounded-lg`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-50">Tổng thành viên</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{department.memberCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-50">Đang hoạt động</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{department.memberCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-50">Cập nhật gần nhất</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Hôm nay</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members List */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Danh sách thành viên
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm thành viên..."
                                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <Select
                                className="h-10 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={5}>5 / trang</option>
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                            </Select>
                            <Button onClick={handleAddMember} className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Thêm thành viên
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Tên</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Vai trò</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Loại hợp đồng</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Ngày sinh</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Địa chỉ</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">SĐT</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                            {paginatedMembers.map((member) => (
                                        <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {member.firstName} {member.lastName}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.contractType}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.dob}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.address}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.phone}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewMember(member)}
                                                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditMember(member)}
                                                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Cập nhật"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMember(member.id)}
                                                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                            ))}
                            {paginatedMembers.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                                                Không có thành viên phù hợp
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                Trang {page} / {totalPages} • Tổng {filteredMembers.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Trước</Button>
                                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Sau</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Member Modal */}
            <Modal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Thêm thành viên mới"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Hủy</Button>
                        <Button onClick={handleSubmitAddMember}>Thêm thành viên</Button>
                    </div>
                }
            >
                <MemberForm formData={formData} setFormData={setFormData} />
            </Modal>

            {/* Edit Member Modal */}
            <Modal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa thành viên"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Hủy</Button>
                        <Button onClick={handleSubmitEditMember}>Cập nhật</Button>
                    </div>
                }
            >
                <MemberForm formData={formData} setFormData={setFormData} isEdit={true} />
            </Modal>

            {/* View Member Modal */}
            <Modal
                open={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Chi tiết thành viên"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowViewModal(false)}>Đóng</Button>
                        <Button onClick={() => {
                            setShowViewModal(false);
                            handleEditMember(viewingMember);
                        }}>Chỉnh sửa</Button>
                    </div>
                }
            >
                {viewingMember && (
                    <div className="space-y-6">
                        {/* Avatar and Basic Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {viewingMember.avatar}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {viewingMember.firstName} {viewingMember.lastName}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">{viewingMember.email}</p>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.firstName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.lastName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.phone}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.dob}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.gender}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.role}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại hợp đồng</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.contractType}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ngân hàng</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.bankName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tài khoản ngân hàng</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.bankAccount}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CCCD</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.cccd}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày vào làm</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.joinDate}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.address}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
