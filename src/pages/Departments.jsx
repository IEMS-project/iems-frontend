import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import DepartmentCard from "../components/departments/DepartmentCard";
import DepartmentForm from "../components/departments/DepartmentForm";
import PageHeader from "../components/common/PageHeader";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { departmentService } from "../services/departmentService";

export default function Teams() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                            const list = await departmentService.getDepartments();
                if (!mounted) return;

                            // For each department, fetch enriched user details
                            const enrichedDepartments = await Promise.all(
                                list.map(async (dept) => {
                                    if (dept.users && dept.users.length > 0) {
                                        try {
                                            // Use new API to get department with enriched users
                                            const enrichedDept = await departmentService.getDepartmentWithUsers(dept.id);
                                            if (enrichedDept && enrichedDept.users) {
                                                const enrichedUsers = enrichedDept.users.map(deptUser => ({
                                                    id: deptUser.id,
                                                    departmentId: deptUser.departmentId,
                                                    userId: deptUser.userId,
                                                    role: deptUser.role,
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
                                                    contractType: deptUser.userDetails?.contractType,
                                                    startDate: deptUser.userDetails?.startDate,
                                                    avatar: deptUser.userDetails?.firstName?.charAt(0) || 'U'
                                                }));
                                                return { ...dept, members: enrichedUsers };
                                            }
                                        } catch (err) {
                                            console.warn(`Failed to fetch enriched users for department ${dept.id}:`, err);
                                        }
                                    }
                                    return dept;
                                })
                            );

                            setDepartments(enrichedDepartments);
            } catch (e) {
                if (!mounted) return;
                setError(e?.message || "Không tải được phòng ban");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [deletingDepartment, setDeletingDepartment] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "bg-blue-500"
    });

    const totalMembers = useMemo(() => {
        if (!Array.isArray(departments)) return 0;
        return departments.reduce((sum, d) => sum + (d.totalUsers || 0), 0);
    }, [departments]);
    const totalDepartments = Array.isArray(departments) ? departments.length : 0;

    // Reset form data
    const resetFormData = () => {
        setFormData({
            name: "",
            description: "",
            color: "bg-blue-500"
        });
    };

    // Handle add department
    const handleAddDepartment = async () => {
        if (!formData.name.trim()) return;
        try {
            const created = await departmentService.createDepartment({
                departmentName: formData.name,
            description: formData.description,
                managerId: null,
            });
            setDepartments(prev => Array.isArray(prev) ? [created, ...prev] : [created]);
        setIsAddModalOpen(false);
        resetFormData();
        } catch (e) {
            setError(e?.message || "Không tạo được phòng ban");
        }
    };

    // Handle edit department
    const handleEditDepartment = async () => {
        if (!formData.name.trim() || !editingDepartment) return;
        try {
            const updated = await departmentService.updateDepartment(editingDepartment.id, {
                departmentName: formData.name,
                description: formData.description,
                managerId: editingDepartment.managerId || null,
            });
            setDepartments(prev => Array.isArray(prev)
                ? prev.map(d => d.id === updated.id ? updated : d)
                : prev);
            setIsEditModalOpen(false);
            setEditingDepartment(null);
            resetFormData();
        } catch (e) {
            setError(e?.message || "Không cập nhật được phòng ban");
        }
    };

    // Handle delete department
    const handleDeleteDepartment = async () => {
        if (!deletingDepartment) return;
        try {
            await departmentService.deleteDepartment(deletingDepartment.id);
            setDepartments(prev => Array.isArray(prev)
                ? prev.filter(d => d.id !== deletingDepartment.id)
                : prev);
            setIsDeleteModalOpen(false);
            setDeletingDepartment(null);
        } catch (e) {
            setError(e?.message || "Không xóa được phòng ban");
        }
    };

    // Open edit modal
    const openEditModal = (department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.departmentName || department.name,
            description: department.description,
            color: department.color || "bg-blue-500"
        });
        setIsEditModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (department) => {
        setDeletingDepartment(department);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader title="Phòng ban" breadcrumbs={[{ label: "Phòng ban", to: "/teams" }]} />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-50">Tổng thành viên</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{totalMembers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-50">Phòng ban</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{totalDepartments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Department Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Tổng quan phòng ban
                        </CardTitle>
                        <Button
                            onClick={() => {
                                resetFormData();
                                setIsAddModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Thêm phòng ban
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
                        {error && <div className="text-sm text-red-600">{error}</div>}
                        {!loading && !error && Array.isArray(departments) && departments.map((dept) => (
                            <DepartmentCard
                                key={dept.id}
                                department={{
                                    id: dept.id,
                                    name: dept.departmentName || dept.name,
                                    description: dept.description,
                                    memberCount: dept.totalUsers || 0,
                                    color: "bg-blue-500",
                                    members: dept.users || [],
                                }}
                                onEdit={openEditModal}
                                onDelete={openDeleteModal}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Add Department Modal */}
            <Modal
                open={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    resetFormData();
                }}
                title="Thêm phòng ban mới"
            >
                <DepartmentForm formData={formData} setFormData={setFormData} />
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsAddModalOpen(false);
                            resetFormData();
                        }}
                    >
                        Hủy
                    </Button>
                    <Button onClick={handleAddDepartment}>
                        Thêm phòng ban
                    </Button>
                </div>
            </Modal>

            {/* Edit Department Modal */}
            <Modal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingDepartment(null);
                    resetFormData();
                }}
                title="Sửa phòng ban"
            >
                <DepartmentForm formData={formData} setFormData={setFormData} isEdit={true} />
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsEditModalOpen(false);
                            setEditingDepartment(null);
                            resetFormData();
                        }}
                    >
                        Hủy
                    </Button>
                    <Button onClick={handleEditDepartment}>
                        Cập nhật
                    </Button>
                </div>
            </Modal>

            {/* Delete Department Modal */}
            <Modal
                open={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingDepartment(null);
                }}
                title="Xác nhận xóa phòng ban"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Bạn có chắc chắn muốn xóa phòng ban <strong>{deletingDepartment?.departmentName || deletingDepartment?.name}</strong>?
                    </p>
                    {(deletingDepartment?.totalUsers || deletingDepartment?.memberCount) > 0 && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ Phòng ban này có {deletingDepartment.totalUsers || deletingDepartment.memberCount} thành viên. 
                                Tất cả thành viên sẽ bị xóa khỏi phòng ban này.
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsDeleteModalOpen(false);
                            setDeletingDepartment(null);
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDeleteDepartment}
                        className="text-red-600 hover:text-red-700"
                    >
                        Xóa phòng ban
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
