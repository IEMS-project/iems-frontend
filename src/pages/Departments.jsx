import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import DepartmentCard from "../components/departments/DepartmentCard";
import DepartmentListItem from "../components/departments/DepartmentListItem";
import DepartmentForm from "../components/departments/DepartmentForm";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { departmentService } from "../services/departmentService";
import { userService } from "../services/userService";
import Skeleton from "../components/ui/Skeleton";
import { textColors, statusColors, bgColors, borderColors } from "../theme/colors";

export default function Teams() {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [departmentColors, setDepartmentColors] = useState(() => {
        try {
            const raw = localStorage.getItem("iems.departmentColors");
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await departmentService.getDepartments();
                if (!mounted) return;

                // IMPORTANT: to avoid making one /departments/{id}/users request per department
                // (which creates many user-service calls), we only use the /departments response
                // and rely on `totalUsers` for counts. Detailed members are loaded on demand
                // (e.g., in DepartmentDetail) to reduce network traffic.
                setDepartments(Array.isArray(list) ? list : []);
            } catch (e) {
                if (!mounted) return;
                setError(e?.message || t("departments.noDepartments"));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const users = await userService.getAllUserBasicInfos();
                const normalized = (users || []).map(u => ({
                    id: u.id || u.userId,
                    fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email
                }));
                setUserOptions(normalized);
            } catch (_e) { }
        })();
    }, []);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [deletingDepartment, setDeletingDepartment] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "bg-blue-500",
        managerId: null
    });
    const [userOptions, setUserOptions] = useState([]);
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

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
            color: "bg-blue-500",
            managerId: null
        });
    };

    const saveDepartmentColor = (deptId, color) => {
        setDepartmentColors(prev => {
            const next = { ...(prev || {}), [deptId]: color };
            try { localStorage.setItem("iems.departmentColors", JSON.stringify(next)); } catch { }
            return next;
        });
    };

    // Handle add department
    const handleAddDepartment = async () => {
        if (!formData.name.trim()) return;
        try {
            const created = await departmentService.createDepartment({
                departmentName: formData.name,
                description: formData.description,
                managerId: formData.managerId || null,
            });
            setDepartments(prev => Array.isArray(prev) ? [created, ...prev] : [created]);
            if (created?.id) saveDepartmentColor(created.id, formData.color);
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
            if (editingDepartment?.id) saveDepartmentColor(editingDepartment.id, formData.color);
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
            color: department.color || "bg-blue-500",
            managerId: department.managerId || null
        });
        setIsEditModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (department) => {
        setDeletingDepartment(department);
        setIsDeleteModalOpen(true);
    };

    const skeletonCards = Array.from({ length: 4 });

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className={`p-2 ${statusColors.infoBg} rounded-lg flex items-center justify-center`}>
                                {loading ? (
                                    <Skeleton className="h-6 w-6 bg-blue-200/80" />
                                ) : (
                                    <svg className={`w-6 h-6 ${statusColors.infoText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${textColors.secondary}`}>{t("departments.totalMembers")}</p>
                                {loading ? (
                                    <Skeleton className="mt-2 h-6 w-24" />
                                ) : (
                                    <p className={`text-2xl font-semibold ${textColors.primary}`}>{totalMembers}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className={`p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center`}>
                                {loading ? (
                                    <Skeleton className="h-6 w-6 bg-purple-200/80" />
                                ) : (
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-4">
                                <p className={`text-sm font-medium ${textColors.secondary}`}>{t("departments.title")}</p>
                                {loading ? (
                                    <Skeleton className="mt-2 h-6 w-16" />
                                ) : (
                                    <p className={`text-2xl font-semibold ${textColors.primary}`}>{totalDepartments}</p>
                                )}
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
                            {t("departments.overview")}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            {/* view toggle */}
                            <div className="inline-flex items-center rounded-md border bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 shadow-sm">
                                <button
                                    aria-pressed={viewMode === 'grid'}
                                    title="Grid view"
                                    onClick={() => setViewMode('grid')}
                                    className={`px-2 py-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-slate-900' : ''}`}
                                >
                                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                                    </svg>
                                </button>

                                <button
                                    aria-pressed={viewMode === 'list'}
                                    title="List view"
                                    onClick={() => setViewMode('list')}
                                    className={`px-2 py-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-slate-900' : ''}`}
                                >
                                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>

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
                                {t("departments.addDepartment")}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
                    {loading ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {skeletonCards.map((_, idx) => (
                                    <div key={idx} className="rounded-xl border border-dashed border-gray-200 p-5 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-8 w-24" />
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                        </div>
                                        <Skeleton className="mt-4 h-3 w-full" />
                                        <Skeleton className="mt-2 h-3 w-4/5" />
                                        <div className="mt-5 flex items-center justify-between">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {skeletonCards.map((_, idx) => (
                                    <div key={idx} className="rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-800">
                                        <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                                        <div className="h-3 w-60 bg-gray-200 rounded" />
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {!error && Array.isArray(departments) && departments.map((dept) => (
                                    <DepartmentCard
                                        key={dept.id}
                                        department={{
                                            id: dept.id,
                                            name: dept.departmentName || dept.name,
                                            description: dept.description,
                                            memberCount: dept.totalUsers || 0,
                                            color: departmentColors?.[dept.id] || "bg-blue-500",
                                            members: dept.users || [],
                                        }}
                                        onEdit={openEditModal}
                                        onDelete={openDeleteModal}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                {/* header row */}
                                <div className={`hidden sm:flex items-center px-4 py-3 ${bgColors.secondary} text-xs font-semibold ${textColors.secondary}`}>
                                    <div className="flex-1">{t("departments.title")}</div>
                                    <div className="w-28 text-right">{t("departments.members")}</div>
                                    <div className="w-36 text-right">{t("departments.columns.actions")}</div>
                                </div>

                                {/* rows */}
                                <div className={`divide-y ${borderColors.light}`}>
                                    {!error && Array.isArray(departments) && departments.map((dept) => (
                                        <DepartmentListItem
                                            key={dept.id}
                                            department={{
                                                id: dept.id,
                                                name: dept.departmentName || dept.name,
                                                description: dept.description,
                                                memberCount: dept.totalUsers || 0,
                                                color: departmentColors?.[dept.id] || "bg-blue-500",
                                                members: dept.users || [],
                                            }}
                                            onEdit={openEditModal}
                                            onDelete={openDeleteModal}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Add Department Modal */}
            <Modal
                open={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    resetFormData();
                }}
                title={t("departments.addNewDepartment")}
            >
                <DepartmentForm formData={formData} setFormData={setFormData} userOptions={userOptions} />
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsAddModalOpen(false);
                            resetFormData();
                        }}
                    >
                        {t("departments.actions.cancel")}
                    </Button>
                    <Button onClick={handleAddDepartment}>
                        {t("departments.addDepartment")}
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
                title={t("departments.editDepartment")}
            >
                <DepartmentForm formData={formData} setFormData={setFormData} isEdit={true} userOptions={userOptions} />
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsEditModalOpen(false);
                            setEditingDepartment(null);
                            resetFormData();
                        }}
                    >
                        {t("departments.actions.cancel")}
                    </Button>
                    <Button onClick={handleEditDepartment}>
                        {t("departments.actions.update")}
                    </Button>
                </div>
            </Modal>

            {/* Delete Department Confirmation Dialog */}
            <ConfirmDialog
                open={isDeleteModalOpen}
                onOpenChange={(open) => {
                    setIsDeleteModalOpen(open);
                    if (!open) setDeletingDepartment(null);
                }}
                onConfirm={handleDeleteDepartment}
                title={t("departments.confirmDelete")}
                description={
                    deletingDepartment
                        ? `${t("departments.deleteDescription", { name: deletingDepartment?.departmentName || deletingDepartment?.name })}${(deletingDepartment?.totalUsers || deletingDepartment?.memberCount) > 0
                            ? `\n\n${t("departments.deleteWarning", { count: deletingDepartment.totalUsers || deletingDepartment.memberCount })}`
                            : ""
                        }`
                        : ""
                }
                confirmText={t("departments.deleteDepartment")}
                cancelText={t("departments.actions.cancel")}
                variant="destructive"
            />
        </div>
    );
}
