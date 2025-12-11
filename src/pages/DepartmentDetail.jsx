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
import Skeleton from "../components/ui/Skeleton";
import { departmentService } from "../services/departmentService";
import { userService } from "../services/userService";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { MembersDataTable } from "../components/departments/members-data-table";
import { createMemberColumns } from "../components/departments/members-columns";
import ManagerSelector from "../components/departments/ManagerSelector";
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
    Users,
    UserCheck,
    UserCog,
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

    // Prepare members data for DataTable
    const membersData = useMemo(() => {
        if (!department || !department.users) return [];
        return department.users;
    }, [department]);

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

    // Create columns with action handlers - must be after handler definitions
    const memberColumns = useMemo(() => {
        return createMemberColumns(
            handleViewMember,
            handleEditMember,
            handleDeleteMember
        );
    }, []);

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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">{t("departments.totalMembers")}</p>
                                    <p className="text-2xl font-semibold text-foreground">{department.totalUsers || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">{t("departments.activeMembers")}</p>
                                    <p className="text-2xl font-semibold text-foreground">{department.activeUsers || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <UserCog className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-muted-foreground">{t("departments.manager")}</p>
                                        <p className="text-lg font-semibold text-foreground">{department.managerName || t("departments.notAssigned")}</p>
                                    </div>
                                </div>
                                <ManagerSelector
                                    value={department.managerId}
                                    users={allBasicUsers}
                                    onChange={async (newId) => {
                                        try {
                                            const updated = await departmentService.updateDepartmentManager(department.id, newId);
                                            setDepartment({ 
                                                ...department, 
                                                managerId: updated?.managerId || null, 
                                                managerName: updated?.managerName || null 
                                            });
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {t("departments.memberList")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MembersDataTable
                            columns={memberColumns}
                            data={membersData}
                            loading={loading}
                            onAddMember={() => setShowAddExistingModal(true)}
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
