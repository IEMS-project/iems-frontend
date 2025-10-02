import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import MemberCard from "../components/departments/MemberCard";
import MemberForm from "../components/departments/MemberForm";
import AddExistingUsersModal from "../components/departments/AddExistingUsersModal";
import PageHeader from "../components/common/PageHeader";
import UserAvatar from "../components/ui/UserAvatar";
import Pagination from "../components/ui/Pagination";
import { departmentService } from "../services/departmentService";
import { userService } from "../services/userService";
import { api } from "../lib/api";


export default function DepartmentDetail() {
    const { departmentId } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [showAddExistingModal, setShowAddExistingModal] = useState(false);
    const [allBasicUsers, setAllBasicUsers] = useState([]);
    const [viewingMember, setViewingMember] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(7);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: "",
        gender: "MALE",
        personalID: "",
        image: "",
        bankAccountNumber: "",
        bankName: "",
        contractType: "REMOTE",
        startDate: "",
        role: "",
        username: "",
        password: "",
        roleCodes: [],
        address: ""
    });

    useEffect(() => {
        const fetchDepartment = async () => {
            try {
                setLoading(true);
                // Use new API that returns department with enriched user details
                const dept = await departmentService.getDepartmentWithUsers(departmentId);
                if (dept) {
                    // Map the enriched users to the expected format
                    if (dept.users && dept.users.length > 0) {
                        const enrichedUsers = dept.users.map(deptUser => ({
                            id: deptUser.id,
                            departmentId: deptUser.departmentId,
                            userId: deptUser.userId,
                            joinedAt: deptUser.joinedAt,
                            leftAt: deptUser.leftAt,
                            isActive: deptUser.isActive,
                            // User details from User Service
                            firstName: deptUser.userDetails?.firstName,
                            lastName: deptUser.userDetails?.lastName,
                            email: deptUser.userDetails?.email,
                            phone: deptUser.userDetails?.phone,
                            dob: deptUser.userDetails?.dob,
                            gender: deptUser.userDetails?.gender,
                            address: deptUser.userDetails?.address,
                            personalID: deptUser.userDetails?.personalID,
                            image: deptUser.userDetails?.image,
                            bankAccountNumber: deptUser.userDetails?.bankAccountNumber,
                            bankName: deptUser.userDetails?.bankName,
                            role: deptUser.userDetails?.role,
                            contractType: deptUser.userDetails?.contractType,
                            startDate: deptUser.userDetails?.startDate,
                            avatar: deptUser.userDetails?.firstName?.charAt(0) || 'U'
                        }));
                        dept.users = enrichedUsers;
                    }
                    setDepartment(dept);
                } else {
                    navigate("/departments");
                }
            } catch (err) {
                setError(err?.message || "Không tải được thông tin phòng ban");
                navigate("/departments");
            } finally {
                setLoading(false);
            }
        };

        if (departmentId) {
            fetchDepartment();
        }
    }, [departmentId, navigate]);

    // Load all basic users for selection modal
    useEffect(() => {
        const fetchBasicUsers = async () => {
            try {
                const users = await userService.getAllUserBasicInfos();
                // Normalize fields for avatar/name rendering
                const normalized = (users || []).map(u => ({
                    id: u.id || u.userId,
                    userId: u.id || u.userId,
                    fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                    email: u.email,
                    image: u.image,
                    firstName: u.firstName,
                    lastName: u.lastName,
                }));
                setAllBasicUsers(normalized);
            } catch (e) {
                // non-blocking
                console.error("Failed to load user basic infos", e);
            }
        };
        fetchBasicUsers();
    }, []);

    const filteredMembers = useMemo(() => {
        if (!department || !department.users) return [];
        const q = search.trim().toLowerCase();
        if (!q) return department.users;
        return department.users.filter(m =>
            (m.firstName && m.firstName.toLowerCase().includes(q)) ||
            (m.lastName && m.lastName.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.phone && m.phone.toLowerCase().includes(q)) ||
            (m.userId && m.userId.toLowerCase().includes(q))
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
            gender: "MALE",
            personalID: "",
            image: "",
            bankAccountNumber: "",
            bankName: "",
            contractType: "REMOTE",
            startDate: "",
            role: "",
            username: "",
            password: "",
            roleCodes: [],
            address: ""
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
            dob: member.dob || "",
            gender: member.gender,
            personalID: member.personalID,
            image: member.image,
            bankAccountNumber: member.bankAccountNumber,
            bankName: member.bankName,
            contractType: member.contractType,
            startDate: member.startDate || "",
            role: member.role,
            username: member.username || "",
            password: "",
            roleCodes: member.roleCodes || [],
            address: member.address
        });
        setShowEditModal(true);
    };

    const handleDeleteMember = async (member) => {
        if (department && window.confirm("Bạn có chắc muốn xóa thành viên này?")) {
            try {
                setLoading(true);

                // Gọi API remove user from department
                await api.removeUserFromDepartment(departmentId, member.userId);

                // Refresh department data để cập nhật danh sách
                const updatedDept = await departmentService.getDepartmentWithUsers(departmentId);
                if (updatedDept) {
                    // Map the enriched users to the expected format
                    if (updatedDept.users && updatedDept.users.length > 0) {
                        const enrichedUsers = updatedDept.users.map(deptUser => ({
                            id: deptUser.id,
                            departmentId: deptUser.departmentId,
                            userId: deptUser.userId,

                            joinedAt: deptUser.joinedAt,
                            leftAt: deptUser.leftAt,
                            isActive: deptUser.isActive,
                            // User details from User Service
                            firstName: deptUser.userDetails?.firstName,
                            lastName: deptUser.userDetails?.lastName,
                            email: deptUser.userDetails?.email,
                            phone: deptUser.userDetails?.phone,
                            dob: deptUser.userDetails?.dob,
                            gender: deptUser.userDetails?.gender,
                            address: deptUser.userDetails?.address,
                            personalID: deptUser.userDetails?.personalID,
                            image: deptUser.userDetails?.image,
                            role: deptUser.userDetails?.role,
                            bankAccountNumber: deptUser.userDetails?.bankAccountNumber,
                            bankName: deptUser.userDetails?.bankName,
                            contractType: deptUser.userDetails?.contractType,
                            startDate: deptUser.userDetails?.startDate,
                            avatar: deptUser.userDetails?.firstName?.charAt(0) || 'U'
                        }));
                        updatedDept.users = enrichedUsers;
                    }
                    setDepartment(updatedDept);
                }
            } catch (error) {
                console.error("Error deleting user:", error);
                setError(error?.message || "Có lỗi xảy ra khi xóa thành viên");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmitAddMember = async () => {
        if (formData.firstName && formData.lastName && formData.email && formData.username && formData.password && formData.roleCodes && formData.roleCodes.length > 0) {
            try {
                setLoading(true);

                // Chuẩn bị dữ liệu để gửi API
                const userData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    address: formData.address,
                    phone: formData.phone,
                    dob: formData.dob ? new Date(formData.dob).toISOString() : null,
                    gender: formData.gender,
                    personalID: formData.personalID,
                    image: formData.image,
                    bankAccountNumber: formData.bankAccountNumber,
                    bankName: formData.bankName,
                    contractType: formData.contractType,
                    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                    // Use first selected system role as persisted role string for display/compat
                    role: (formData.roleCodes && formData.roleCodes[0]) || null,
                    username: formData.username,
                    password: formData.password,
                    roleCodes: formData.roleCodes,
                    departmentId: departmentId
                };

                // Gọi API tạo user
                const newUser = await api.createUser(userData);

                // Đảm bảo user vừa tạo được thêm vào phòng ban ngay lập tức nếu backend không tự gán
                try {
                    const newUserId = newUser?.userId || newUser?.id;
                    if (newUserId) {
                        await api.addUsersToDepartment(departmentId, { userIds: [newUserId] });
                    }
                } catch (_e) {
                    // không chặn luồng nếu API thêm vào phòng ban thất bại; sẽ fallback bằng refresh
                }

                // Refresh department data để lấy user mới
                const updatedDept = await departmentService.getDepartmentWithUsers(departmentId);
                if (updatedDept) {
                    // Map the enriched users to the expected format
                    if (updatedDept.users && updatedDept.users.length > 0) {
                        const enrichedUsers = updatedDept.users.map(deptUser => ({
                            id: deptUser.id,
                            departmentId: deptUser.departmentId,
                            userId: deptUser.userId,
                            joinedAt: deptUser.joinedAt,
                            leftAt: deptUser.leftAt,
                            isActive: deptUser.isActive,
                            // User details from User Service
                            firstName: deptUser.userDetails?.firstName,
                            lastName: deptUser.userDetails?.lastName,
                            email: deptUser.userDetails?.email,
                            phone: deptUser.userDetails?.phone,
                            dob: deptUser.userDetails?.dob,
                            gender: deptUser.userDetails?.gender,
                            address: deptUser.userDetails?.address,
                            personalID: deptUser.userDetails?.personalID,
                            image: deptUser.userDetails?.image,
                            role: deptUser.userDetails?.role,
                            bankAccountNumber: deptUser.userDetails?.bankAccountNumber,
                            bankName: deptUser.userDetails?.bankName,
                            contractType: deptUser.userDetails?.contractType,
                            startDate: deptUser.userDetails?.startDate,
                            avatar: deptUser.userDetails?.firstName?.charAt(0) || 'U'
                        }));
                        updatedDept.users = enrichedUsers;
                    }
                    setDepartment(updatedDept);
                }

                setShowAddModal(false);
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    dob: "",
                    gender: "MALE",
                    personalID: "",
                    image: "",
                    bankAccountNumber: "",
                    bankName: "",
                    contractType: "REMOTE",
                    startDate: "",
                    role: "",
                    username: "",
                    password: "",
                    roleCodes: [],
                    address: ""
                });
            } catch (error) {
                console.error("Error creating user:", error);
                setError(error?.message || "Có lỗi xảy ra khi tạo thành viên mới");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmitEditMember = async () => {
        if (formData.firstName && formData.lastName && formData.email && formData.roleCodes && editingMember) {
            try {
                setLoading(true);

                // Chuẩn bị dữ liệu để gửi API (theo format của curl command)
                const userData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    address: formData.address,
                    phone: formData.phone,
                    dob: formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : null,
                    gender: formData.gender,
                    personalID: formData.personalID,
                    image: formData.image,
                    bankAccountNumber: formData.bankAccountNumber,
                    bankName: formData.bankName,
                    contractType: formData.contractType,
                    startDate: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : null,
                    // Use first selected system role as persisted role string for display/compat
                    role: (formData.roleCodes && formData.roleCodes[0]) || null,
                    roleCodes: formData.roleCodes
                };

                // Gọi API update user
                await api.updateUser(editingMember.userId, userData);

                // Refresh department data để lấy user đã cập nhật
                const updatedDept = await departmentService.getDepartmentWithUsers(departmentId);
                if (updatedDept) {
                    // Map the enriched users to the expected format
                    if (updatedDept.users && updatedDept.users.length > 0) {
                        const enrichedUsers = updatedDept.users.map(deptUser => ({
                            id: deptUser.id,
                            departmentId: deptUser.departmentId,
                            userId: deptUser.userId,
                            joinedAt: deptUser.joinedAt,
                            leftAt: deptUser.leftAt,
                            isActive: deptUser.isActive,
                            // User details from User Service
                            firstName: deptUser.userDetails?.firstName,
                            lastName: deptUser.userDetails?.lastName,
                            email: deptUser.userDetails?.email,
                            phone: deptUser.userDetails?.phone,
                            dob: deptUser.userDetails?.dob,
                            gender: deptUser.userDetails?.gender,
                            address: deptUser.userDetails?.address,
                            role: deptUser.userDetails?.role,
                            personalID: deptUser.userDetails?.personalID,
                            image: deptUser.userDetails?.image,
                            bankAccountNumber: deptUser.userDetails?.bankAccountNumber,
                            bankName: deptUser.userDetails?.bankName,
                            contractType: deptUser.userDetails?.contractType,
                            startDate: deptUser.userDetails?.startDate,
                            avatar: deptUser.userDetails?.firstName?.charAt(0) || 'U'
                        }));
                        updatedDept.users = enrichedUsers;
                    }
                    setDepartment(updatedDept);
                }

                setShowEditModal(false);
                setEditingMember(null);
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    dob: "",
                    gender: "MALE",
                    personalID: "",
                    image: "",
                    bankAccountNumber: "",
                    bankName: "",
                    contractType: "REMOTE",
                    startDate: "",
                    role: "",
                    username: "",
                    password: "",
                    roleCodes: [],
                    address: ""
                });
            } catch (error) {
                console.error("Error updating user:", error);
                setError(error?.message || "Có lỗi xảy ra khi cập nhật thành viên");
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải thông tin phòng ban...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-red-600">{error}</p>
                        <Button onClick={() => navigate("/departments")} className="mt-4">
                            Quay lại danh sách
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!department) {
        return null;
    }

    return (
        <>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <PageHeader
                        breadcrumbs={[{ label: "Phòng ban", to: "/departments" }, { label: department.departmentName || department.name }]}
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
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{department.totalUsers || 0}</p>
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
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{department.activeUsers || 0}</p>
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
                            <Button onClick={() => setShowAddExistingModal(true)} className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M8 9l3 3-3 3M5 12h6" />
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
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={member} size="sm" />
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {member.firstName && member.lastName
                                                                ? `${member.firstName} ${member.lastName}`
                                                                : `User ID: ${member.userId}`}
                                                        </div>
                                                        {member.email && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {member.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.role || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.contractType || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.dob ? new Date(member.dob).toLocaleDateString('vi-VN') : "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.address || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {member.phone || "N/A"}
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
                                                        onClick={() => handleDeleteMember(member)}
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
                                                {department.users && department.users.length === 0
                                                    ? "Phòng ban này chưa có thành viên nào"
                                                    : "Không có thành viên phù hợp với từ khóa tìm kiếm"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={filteredMembers.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[5, 10, 20]}
                            className="mt-4"
                        />
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

            {/* Add Existing Users Modal */}
            <AddExistingUsersModal
                open={showAddExistingModal}
                onClose={() => setShowAddExistingModal(false)}
                allUsers={allBasicUsers}
                onCreateNew={() => {
                    setShowAddExistingModal(false);
                    handleAddMember();
                }}
                onSubmit={async (userIds) => {
                    try {
                        setLoading(true);
                        await departmentService.addUsersToDepartment(departmentId, userIds);
                        const updated = await departmentService.getDepartmentWithUsers(departmentId);
                        if (updated && updated.users && updated.users.length > 0) {
                            const enriched = updated.users.map((deptUser) => ({
                                id: deptUser.id,
                                departmentId: deptUser.departmentId,
                                userId: deptUser.userId,
                                joinedAt: deptUser.joinedAt,
                                leftAt: deptUser.leftAt,
                                isActive: deptUser.isActive,
                                firstName: deptUser.userDetails?.firstName,
                                lastName: deptUser.userDetails?.lastName,
                                email: deptUser.userDetails?.email,
                                phone: deptUser.userDetails?.phone,
                                dob: deptUser.userDetails?.dob,
                                gender: deptUser.userDetails?.gender,
                                address: deptUser.userDetails?.address,
                                personalID: deptUser.userDetails?.personalID,
                                image: deptUser.userDetails?.image,
                                bankAccountNumber: deptUser.userDetails?.bankAccountNumber,
                                bankName: deptUser.userDetails?.bankName,
                                role: deptUser.userDetails?.role,
                                contractType: deptUser.userDetails?.contractType,
                                startDate: deptUser.userDetails?.startDate,
                                avatar: deptUser.userDetails?.firstName?.charAt(0) || "U",
                            }));
                            updated.users = enriched;
                        }
                        setDepartment(updated);
                        setShowAddExistingModal(false);
                    } catch (e) {
                        setError(e?.message || "Có lỗi khi thêm thành viên");
                    } finally {
                        setLoading(false);
                    }
                }}
            />

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
                            <UserAvatar user={viewingMember} size="2xl" />
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {viewingMember.firstName && viewingMember.lastName
                                        ? `${viewingMember.firstName} ${viewingMember.lastName}`
                                        : `User ID: ${viewingMember.userId}`}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">{viewingMember.email || "N/A"}</p>
                                {viewingMember.phone && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{viewingMember.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.firstName || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.lastName || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.phone || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
                                <p className="text-gray-900 dark:text-gray-100">
                                    {viewingMember.dob ? new Date(viewingMember.dob).toLocaleDateString('vi-VN') : "N/A"}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.gender || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.email || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.role || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại hợp đồng</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.contractType || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ngân hàng</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.bankName || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tài khoản ngân hàng</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.bankAccountNumber || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CCCD</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.personalID || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày vào làm</label>
                                <p className="text-gray-900 dark:text-gray-100">
                                    {viewingMember.startDate ? new Date(viewingMember.startDate).toLocaleDateString('vi-VN') : "N/A"}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ</label>
                                <p className="text-gray-900 dark:text-gray-100">{viewingMember.address || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
