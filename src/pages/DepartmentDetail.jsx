import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/select";
import MemberCard from "../components/departments/MemberCard";
import MemberForm from "../components/departments/MemberForm";
import AddExistingUsersModal from "../components/departments/AddExistingUsersModal";
import Avatar from "../components/ui/Avatar";
import Pagination from "../components/ui/pagination";
import Skeleton from "../components/ui/Skeleton";
import { departmentService } from "../services/departmentService";
import { userService } from "../services/userService";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
    User,
    Mail,
    Phone,
    Calendar,
    IdCard,
    MapPin,
    Building2,
    CreditCard,
    Shield,
    FileText,
} from "lucide-react";


import { textColors, statusColors, bgColors, borderColors, inputColors } from "../theme/colors";

export default function DepartmentDetail() {
    const { t } = useTranslation();
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
    const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
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

    const handleDeleteMember = (member) => {
        setMemberToDelete(member);
        setDeleteMemberDialogOpen(true);
    };

    const confirmDeleteMember = async () => {
        if (!department || !memberToDelete) return;
        try {
            setLoading(true);

            // Gọi API remove user from department
            await departmentService.removeUserFromDepartment(departmentId, memberToDelete.userId);

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
            setDeleteMemberDialogOpen(false);
            setMemberToDelete(null);
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
                const newUser = await userService.createUser(userData);

                // Đảm bảo user vừa tạo được thêm vào phòng ban ngay lập tức nếu backend không tự gán
                try {
                    const newUserId = newUser?.userId || newUser?.id;
                    if (newUserId) {
                        await departmentService.addUsersToDepartment(departmentId, [newUserId]);
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
                await userService.updateUser(editingMember.userId, userData);

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
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <Card key={idx}>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-3 w-1/2" />
                                        <Skeleton className="h-5 w-1/3" />
                                    </div>
                                </div>
                                {idx === 2 && <Skeleton className="h-10 w-full" />}
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-full md:w-56" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
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
                            {t("ui.common.back")}
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
                                    <p className={`text-sm font-medium ${textColors.secondary}`}>{t("departments.totalMembers")}</p>
                                    <p className={`text-2xl font-semibold ${textColors.primary}`}>{department.totalUsers || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className={`p-3 ${statusColors.successBg} rounded-lg`}>
                                    <svg className={`w-6 h-6 ${statusColors.successText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className={`text-sm font-medium ${textColors.secondary}`}>{t("departments.activeMembers")}</p>
                                    <p className={`text-2xl font-semibold ${textColors.primary}`}>{department.activeUsers || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`p-3 ${statusColors.infoBg} rounded-lg`}>
                                        <svg className={`w-6 h-6 ${statusColors.infoText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className={`text-sm font-medium ${textColors.secondary}`}>{t("departments.manager")}</p>
                                        <p className={`text-2xl font-semibold ${textColors.primary}`}>{department.managerName || t("departments.notAssigned")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className={`h-10 rounded-md px-3 text-sm ${inputColors.base} ${inputColors.focus}`}
                                        value={department.managerId || ''}
                                        onChange={async (e) => {
                                            try {
                                                const newId = e.target.value || null;
                                                const updated = await departmentService.updateDepartmentManager(department.id, newId);
                                                setDepartment({ ...department, managerId: updated?.managerId || null, managerName: updated?.managerName || null });
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                    >
                                        <option value="">{t("departments.notAssigned")}</option>
                                        {(allBasicUsers || []).map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.fullName}
                                            </option>
                                        ))}
                                    </select>
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
                            {t("departments.memberList")}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("departments.searchMember")}
                                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <Button onClick={() => setShowAddExistingModal(true)} className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M8 9l3 3-3 3M5 12h6" />
                                </svg>
                                {t("departments.addMember")}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${borderColors.medium}`}>
                                        <th className={`text-left py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.name")}</th>
                                        <th className={`text-left py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.role")}</th>
                                        <th className={`text-left py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.contractType")}</th>
                                        <th className={`text-left py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.dob")}</th>
                                        <th className={`text-left py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.address")}</th>
                                        <th className={`text-left py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.phone")}</th>
                                        <th className={`text-center py-3 px-4 font-medium ${textColors.primary}`}>{t("departments.columns.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedMembers.map((member) => (
                                        <tr key={member.id} className={`border-b ${borderColors.light} ${bgColors.hover}`}>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar user={member} size="sm" />
                                                    <div>
                                                        <div className={`font-medium ${textColors.primary}`}>
                                                            {member.firstName && member.lastName
                                                                ? `${member.firstName} ${member.lastName}`
                                                                : `User ID: ${member.userId}`}
                                                        </div>
                                                        {member.email && (
                                                            <div className={`text-sm ${textColors.muted}`}>
                                                                {member.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={textColors.primary}>
                                                    {member.role || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={textColors.primary}>
                                                    {member.contractType || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={textColors.primary}>
                                                    {member.dob ? new Date(member.dob).toLocaleDateString('vi-VN') : "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={textColors.primary}>
                                                    {member.address || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={textColors.primary}>
                                                    {member.phone || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewMember(member)}
                                                        className={`p-2 ${statusColors.infoText} hover:${statusColors.infoBg} rounded-lg transition-colors`}
                                                        title={t("departments.viewDetails")}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditMember(member)}
                                                        className={`p-2 ${statusColors.successText} hover:${statusColors.successBg} rounded-lg transition-colors`}
                                                        title={t("departments.actions.edit")}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMember(member)}
                                                        className={`p-2 ${statusColors.dangerText} hover:${statusColors.dangerBg} rounded-lg transition-colors`}
                                                        title={t("departments.actions.delete")}
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
                                            <td colSpan="7" className={`py-8 px-4 text-center ${textColors.muted}`}>
                                                {department.users && department.users.length === 0
                                                    ? t("departments.noMembers")
                                                    : t("departments.noMatchingMembers")}
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
                title={t("departments.addNewMember")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>{t("departments.actions.cancel")}</Button>
                        <Button onClick={handleSubmitAddMember}>{t("departments.addMember")}</Button>
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
                title={t("departments.editMember")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>{t("departments.actions.cancel")}</Button>
                        <Button onClick={handleSubmitEditMember}>{t("departments.actions.update")}</Button>
                    </div>
                }
            >
                <MemberForm formData={formData} setFormData={setFormData} isEdit={true} />
            </Modal>

            {/* View Member Modal */}
            <Modal
                open={showViewModal}
                onClose={() => setShowViewModal(false)}
                title={t("departments.memberDetails")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowViewModal(false)}>{t("departments.actions.close")}</Button>
                        <Button onClick={() => {
                            setShowViewModal(false);
                            handleEditMember(viewingMember);
                        }}>{t("departments.actions.edit")}</Button>
                    </div>
                }
            >
                {viewingMember && (
                    <div className="space-y-6">
                        {/* Avatar and Basic Info */}
                        <div className="flex items-center gap-4">
                            <Avatar user={viewingMember} size="2xl" />
                            <div>
                                <h3 className={`text-xl font-semibold ${textColors.primary}`}>
                                    {viewingMember.firstName && viewingMember.lastName
                                        ? `${viewingMember.firstName} ${viewingMember.lastName}`
                                        : `User ID: ${viewingMember.userId}`}
                                </h3>
                                <p className={textColors.secondary}>{viewingMember.email || "N/A"}</p>
                                {viewingMember.phone && (
                                    <p className={`text-sm ${textColors.muted}`}>{viewingMember.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.firstName")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.firstName || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.lastName")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.lastName || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.phone")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.phone || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.dob")}</span>
                                </label>
                                <p className={textColors.primary}>
                                    {viewingMember.dob ? new Date(viewingMember.dob).toLocaleDateString('vi-VN') : "N/A"}
                                </p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.gender")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.gender || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.email")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.email || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.role")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.role || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.contractType")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.contractType || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.bankName")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.bankName || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.bankAccount")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.bankAccountNumber || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <IdCard className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.personalId")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.personalID || "N/A"}</p>
                            </div>
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.startDate")}</span>
                                </label>
                                <p className={textColors.primary}>
                                    {viewingMember.startDate ? new Date(viewingMember.startDate).toLocaleDateString('vi-VN') : "N/A"}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className={`flex items-center gap-2 text-sm font-medium ${textColors.secondary} mb-1`}>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{t("departments.fields.address")}</span>
                                </label>
                                <p className={textColors.primary}>{viewingMember.address || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Member Confirmation Dialog */}
            <ConfirmDialog
                open={deleteMemberDialogOpen}
                onOpenChange={(open) => {
                    setDeleteMemberDialogOpen(open);
                    if (!open) setMemberToDelete(null);
                }}
                onConfirm={confirmDeleteMember}
                title={t("departments.confirmDeleteMember")}
                description={t("departments.deleteMemberDescription")}
                confirmText={t("departments.actions.delete")}
                cancelText={t("departments.actions.cancel")}
                variant="destructive"
            />
        </>
    );
}
