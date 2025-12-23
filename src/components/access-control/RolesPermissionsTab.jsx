import React, { useEffect, useMemo, useState } from "react";
import { Shield, Key, Plus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/ui/StatsCard";
import { iamService } from "@/services/iamService";
import RolesTable from "./RolesTable";
import PermissionsTable from "./PermissionsTable";

import RoleFormDialog from "./RoleFormDialog";
import PermissionFormDialog from "./PermissionFormDialog";

const emptyRoleForm = { code: "", name: "", description: "" };
const emptyPermissionForm = { code: "", name: "" };

export default function RolesPermissionsTab() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [rolesError, setRolesError] = useState("");
    const [permissionsError, setPermissionsError] = useState("");

    const [roleSearch, setRoleSearch] = useState("");
    const [permissionSearch, setPermissionSearch] = useState("");
    const [assignmentFilter, setAssignmentFilter] = useState("");

    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [selectedRoleDetail, setSelectedRoleDetail] = useState(null);
    const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false);
    const [selectedPermissionCodes, setSelectedPermissionCodes] = useState(new Set());
    const [savingAssignments, setSavingAssignments] = useState(false);
    const [assignmentError, setAssignmentError] = useState("");
    const [assignmentSuccess, setAssignmentSuccess] = useState("");

    const [roleModal, setRoleModal] = useState({ open: false, mode: "create", role: null });
    const [roleForm, setRoleForm] = useState(emptyRoleForm);
    const [roleFormError, setRoleFormError] = useState("");
    const [roleFormSubmitting, setRoleFormSubmitting] = useState(false);
    const [roleFormLoading, setRoleFormLoading] = useState(false);

    const [permissionModal, setPermissionModal] = useState({ open: false, mode: "create", permission: null });
    const [permissionForm, setPermissionForm] = useState(emptyPermissionForm);
    const [permissionFormError, setPermissionFormError] = useState("");
    const [permissionFormSubmitting, setPermissionFormSubmitting] = useState(false);

    const [deletingRoleId, setDeletingRoleId] = useState(null);
    const [deletingPermissionId, setDeletingPermissionId] = useState(null);

    useEffect(() => {
        let active = true;
        const loadRoles = async () => {
            setRolesLoading(true);
            setRolesError("");
            try {
                const data = await iamService.getRoles();
                if (!active) return;
                setRoles(Array.isArray(data) ? data : []);
            } catch (error) {
                if (active) setRolesError(error?.message || t("admin.accessControl.common.errorLoadingData"));
            } finally {
                if (active) setRolesLoading(false);
            }
        };
        loadRoles();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadPermissions = async () => {
            setPermissionsLoading(true);
            setPermissionsError("");
            try {
                const data = await iamService.getPermissions();
                if (!active) return;
                setPermissions(Array.isArray(data) ? data : []);
            } catch (error) {
                if (active) setPermissionsError(error?.message || t("admin.accessControl.common.errorLoadingData"));
            } finally {
                if (active) setPermissionsLoading(false);
            }
        };
        loadPermissions();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedRoleId && roles.length > 0) {
            handleSelectRole(roles[0].id);
            return;
        }
        if (selectedRoleId && !roles.find((role) => role.id === selectedRoleId)) {
            setSelectedRoleId(null);
            setSelectedRoleDetail(null);
            setSelectedPermissionCodes(new Set());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roles, selectedRoleId]);

    const filteredRoles = useMemo(() => {
        if (!roleSearch.trim()) return roles;
        const q = roleSearch.toLowerCase();
        return roles.filter(
            (role) =>
                role?.name?.toLowerCase().includes(q) ||
                role?.code?.toLowerCase().includes(q)
        );
    }, [roles, roleSearch]);

    const filteredPermissions = useMemo(() => {
        if (!permissionSearch.trim()) return permissions;
        const q = permissionSearch.toLowerCase();
        return permissions.filter(
            (permission) =>
                permission?.name?.toLowerCase().includes(q) ||
                permission?.code?.toLowerCase().includes(q)
        );
    }, [permissions, permissionSearch]);

    const assignablePermissions = useMemo(() => {
        if (!assignmentFilter.trim()) return permissions;
        const q = assignmentFilter.toLowerCase();
        return permissions.filter(
            (permission) =>
                permission?.name?.toLowerCase().includes(q) ||
                permission?.code?.toLowerCase().includes(q)
        );
    }, [permissions, assignmentFilter]);

    const totalPermissionsAttached = useMemo(() => {
        if (!Array.isArray(roles) || roles.length === 0) return 0;
        return roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0);
    }, [roles]);

    const avgPermissionsPerRole = roles.length
        ? (totalPermissionsAttached / roles.length).toFixed(1)
        : "0.0";

    const handleSelectRole = (roleId) => {
        if (!roleId) return;
        setSelectedRoleId(roleId);
        setAssignmentError("");
        setAssignmentSuccess("");
        fetchRolePermissions(roleId);
    };

    const fetchRolePermissions = async (roleId) => {
        setRolePermissionsLoading(true);
        try {
            const detail = await iamService.getRolePermissions(roleId);
            setSelectedRoleDetail(detail);
            setSelectedPermissionCodes(new Set(detail?.permissions || []));
        } catch (error) {
            setAssignmentError(error?.message || t("admin.accessControl.common.errorLoadingData"));
            setSelectedRoleDetail(null);
            setSelectedPermissionCodes(new Set());
        } finally {
            setRolePermissionsLoading(false);
        }
    };

    const openRoleModal = (mode, role = null) => {
        setRoleFormLoading(false);
        setRoleFormError("");
        setRoleModal({ open: true, mode, role });
        if (mode === "create") {
            setRoleForm(emptyRoleForm);
            setSelectedPermissionCodes(new Set());
            return;
        }
        if (!role) return;
        const fillForm = async () => {
            setRoleFormLoading(true);
            try {
                if (selectedRoleDetail && selectedRoleDetail.roleId === role.id) {
                    setRoleForm({
                        code: selectedRoleDetail.roleCode || role.code,
                        name: selectedRoleDetail.roleName || role.name,
                        description: selectedRoleDetail.description || "",
                    });
                    setSelectedPermissionCodes(new Set(selectedRoleDetail.permissions || []));
                    return;
                }
                const detail = await iamService.getRolePermissions(role.id);
                setRoleForm({
                    code: detail?.roleCode || role.code,
                    name: detail?.roleName || role.name,
                    description: detail?.description || "",
                });
                setSelectedPermissionCodes(new Set(detail?.permissions || []));
            } catch {
                setRoleForm({
                    code: role.code,
                    name: role.name,
                    description: "",
                });
                setSelectedPermissionCodes(new Set(role.permissions || []));
            } finally {
                setRoleFormLoading(false);
            }
        };
        fillForm();
    };

    const closeRoleModal = () => {
        setRoleModal({ open: false, mode: "create", role: null });
        setRoleForm(emptyRoleForm);
        setRoleFormError("");
        setRoleFormLoading(false);
        if (!roleModal.role) {
            setSelectedPermissionCodes(new Set());
        }
    };

    const handleSubmitRole = async () => {
        setRoleFormError("");
        const trimmedName = roleForm.name.trim();
        const trimmedCode = roleForm.code.trim();
        if (!trimmedName || (roleModal.mode === "create" && !trimmedCode)) {
            setRoleFormError(t("admin.accessControl.roles.error"));
            return;
        }
        if (roleModal.mode === "create" && selectedPermissionCodes.size === 0) {
            setRoleFormError(t("admin.accessControl.roles.atLeastOnePermission"));
            return;
        }
        try {
            setRoleFormSubmitting(true);
            if (roleModal.mode === "create") {
                const created = await iamService.createRole({
                    code: trimmedCode,
                    name: trimmedName,
                    description: roleForm.description?.trim() || undefined,
                });
                // Assign permissions to the newly created role
                const updatedWithPermissions = await iamService.assignPermissions(
                    created.id,
                    Array.from(selectedPermissionCodes)
                );
                setRoles((prev) => [updatedWithPermissions, ...(Array.isArray(prev) ? prev : [])]);
                setRoleModal({ open: true, mode: "edit", role: updatedWithPermissions });
                setRoleFormError("");
            } else if (roleModal.role) {
                // Update role info only
                const updated = await iamService.updateRole(roleModal.role.id, {
                    name: trimmedName,
                    description: roleForm.description?.trim() || undefined,
                });
                setRoles((prev) =>
                    (Array.isArray(prev) ? prev : []).map((role) =>
                        role.id === updated.id
                            ? { ...role, name: updated.name, permissions: role.permissions }
                            : role
                    )
                );
                if (selectedRoleId === roleModal.role.id) {
                    setSelectedRoleDetail((detail) =>
                        detail
                            ? {
                                ...detail,
                                roleName: trimmedName,
                                description: roleForm.description?.trim() || "",
                            }
                            : detail
                    );
                }
                setRoleFormError("");
            }
        } catch (error) {
            setRoleFormError(error?.message || t("admin.accessControl.roles.error"));
        } finally {
            setRoleFormSubmitting(false);
        }
    };

    const handleSaveRolePermissions = async () => {
        if (!roleModal.role) return;
        if (selectedPermissionCodes.size === 0) {
            setRoleFormError(t("admin.accessControl.roles.atLeastOnePermission"));
            return;
        }
        try {
            setPermissionFormSubmitting(true);
            setRoleFormError("");
            const updatedWithPermissions = await iamService.assignPermissions(
                roleModal.role.id,
                Array.from(selectedPermissionCodes)
            );
            setRoles((prev) =>
                (Array.isArray(prev) ? prev : []).map((role) =>
                    role.id === updatedWithPermissions.id
                        ? { ...role, permissions: updatedWithPermissions.permissions }
                        : role
                )
            );
            if (selectedRoleId === roleModal.role.id) {
                setSelectedRoleDetail((detail) =>
                    detail
                        ? {
                            ...detail,
                            permissions: updatedWithPermissions.permissions,
                        }
                        : detail
                );
            }
        } catch (error) {
            setRoleFormError(error?.message || t("admin.accessControl.roles.error"));
        } finally {
            setPermissionFormSubmitting(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (!role || !window.confirm(t("admin.accessControl.roles.deleteConfirm", { name: role.name }))) return;
        try {
            setDeletingRoleId(role.id);
            await iamService.deleteRole(role.id);
            setRoles((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== role.id) : []));
            if (selectedRoleId === role.id) {
                setSelectedRoleId(null);
                setSelectedRoleDetail(null);
                setSelectedPermissionCodes(new Set());
            }
        } catch (error) {
            setRolesError(error?.message || t("admin.accessControl.roles.error"));
        } finally {
            setDeletingRoleId(null);
        }
    };

    const openPermissionModal = (mode, permission = null) => {
        setPermissionFormError("");
        setPermissionModal({ open: true, mode, permission });
        if (mode === "create" || !permission) {
            setPermissionForm(emptyPermissionForm);
            return;
        }
        setPermissionForm({
            code: permission.code,
            name: permission.name,
        });
    };

    const closePermissionModal = () => {
        setPermissionModal({ open: false, mode: "create", permission: null });
        setPermissionForm(emptyPermissionForm);
        setPermissionFormError("");
    };

    const handleSubmitPermission = async () => {
        setPermissionFormError("");
        const trimmedName = permissionForm.name.trim();
        const trimmedCode = permissionForm.code.trim();
        if (!trimmedName || (permissionModal.mode === "create" && !trimmedCode)) {
            setPermissionFormError(t("admin.accessControl.permissions.error"));
            return;
        }
        try {
            setPermissionFormSubmitting(true);
            if (permissionModal.mode === "create") {
                const created = await iamService.createPermission({
                    code: trimmedCode,
                    name: trimmedName,
                });
                setPermissions((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
            } else if (permissionModal.permission) {
                const updated = await iamService.updatePermission(permissionModal.permission.id, {
                    name: trimmedName,
                });
                setPermissions((prev) =>
                    (Array.isArray(prev) ? prev : []).map((p) =>
                        p.id === updated.id ? { ...p, name: updated.name } : p
                    )
                );
            }
            closePermissionModal();
        } catch (error) {
            setPermissionFormError(error?.message || t("admin.accessControl.permissions.error"));
        } finally {
            setPermissionFormSubmitting(false);
        }
    };

    const handleDeletePermission = async (permission) => {
        if (!permission || !window.confirm(t("admin.accessControl.permissions.deleteConfirm", { name: permission.name }))) return;
        try {
            setDeletingPermissionId(permission.id);
            await iamService.deletePermission(permission.id);
            setPermissions((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== permission.id) : []));
            setSelectedPermissionCodes((prev) => {
                const next = new Set(prev);
                next.delete(permission.code);
                return next;
            });
            setRoles((prev) =>
                (Array.isArray(prev) ? prev : []).map((role) =>
                    role.permissions?.includes(permission.code)
                        ? {
                            ...role,
                            permissions: role.permissions.filter((code) => code !== permission.code),
                        }
                        : role
                )
            );
            if (selectedRoleDetail?.permissions?.includes(permission.code)) {
                setSelectedRoleDetail((detail) =>
                    detail
                        ? {
                            ...detail,
                            permissions: detail.permissions.filter((code) => code !== permission.code),
                        }
                        : detail
                );
            }
        } catch (error) {
            setPermissionsError(error?.message || t("admin.accessControl.permissions.error"));
        } finally {
            setDeletingPermissionId(null);
        }
    };

    const togglePermissionSelection = (code) => {
        setSelectedPermissionCodes((prev) => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
        setAssignmentSuccess("");
    };

    const handleSaveAssignments = async () => {
        if (!selectedRoleId) return;
        if (selectedPermissionCodes.size === 0) {
            setAssignmentError(t("admin.accessControl.roles.atLeastOnePermission"));
            return;
        }
        try {
            setSavingAssignments(true);
            setAssignmentError("");
            const updated = await iamService.assignPermissions(
                selectedRoleId,
                Array.from(selectedPermissionCodes)
            );
            setRoles((prev) =>
                (Array.isArray(prev) ? prev : []).map((role) =>
                    role.id === updated.id ? { ...role, permissions: updated.permissions } : role
                )
            );
            setSelectedRoleDetail((detail) =>
                detail
                    ? {
                        ...detail,
                        permissions: updated.permissions,
                    }
                    : detail
            );
            setAssignmentSuccess(t("admin.accessControl.roles.permissionsUpdated"));
        } catch (error) {
            setAssignmentError(error?.message || t("admin.accessControl.roles.error"));
        } finally {
            setSavingAssignments(false);
        }
    };

    const selectAllPermissions = () => {
        setSelectedPermissionCodes(new Set(permissions.map((p) => p.code)));
        setAssignmentSuccess("");
    };

    const clearAllPermissions = () => {
        setSelectedPermissionCodes(new Set());
        setAssignmentSuccess("");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatsCard
                    title={t("admin.accessControl.roles.totalRoles")}
                    value={roles.length}
                    icon={<Shield className="h-5 w-5" />}
                    accent="indigo"
                />
                <StatsCard
                    title={t("admin.accessControl.permissions.totalPermissions")}
                    value={permissions.length}
                    icon={<Key className="h-5 w-5" />}
                    accent="purple"
                />
                <StatsCard
                    title={t("admin.accessControl.roles.avgPermissionsPerRole")}
                    value={avgPermissionsPerRole}
                    icon={<Key className="h-5 w-5" />}
                    accent="blue"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("admin.accessControl.roles.rolesList")}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t("admin.accessControl.roles.rolesListDescription")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => fetchRolePermissions(selectedRoleId)} disabled={!selectedRoleId || rolePermissionsLoading}>
                                <RefreshCw className={`h-4 w-4 ${rolePermissionsLoading ? "animate-spin" : ""}`} />
                            </Button>
                            <Button onClick={() => openRoleModal("create")} size="sm">
                                <Plus className="h-4 w-4" />
                                {t("admin.accessControl.roles.createRole")}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <RolesTable
                            roles={filteredRoles}
                            loading={rolesLoading}
                            error={rolesError}
                            searchValue={roleSearch}
                            onSearchChange={setRoleSearch}
                            onEditRole={(role) => openRoleModal("edit", role)}
                            onDeleteRole={handleDeleteRole}
                            onSelectRole={handleSelectRole}
                            selectedRoleId={selectedRoleId}
                            deletingRoleId={deletingRoleId}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("admin.accessControl.permissions.permissionsList")}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t("admin.accessControl.permissions.permissionsListDescription")}
                            </p>
                        </div>
                        <Button onClick={() => openPermissionModal("create")} size="sm">
                            <Plus className="h-4 w-4" />
                            {t("admin.accessControl.permissions.createPermission")}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <PermissionsTable
                            permissions={filteredPermissions}
                            loading={permissionsLoading}
                            error={permissionsError}
                            searchValue={permissionSearch}
                            onSearchChange={setPermissionSearch}
                            onEditPermission={(permission) => openPermissionModal("edit", permission)}
                            onDeletePermission={handleDeletePermission}
                            deletingPermissionId={deletingPermissionId}
                        />
                    </CardContent>
                </Card>
            </div>



            <RoleFormDialog
                open={roleModal.open}
                onOpenChange={(open) => !open && closeRoleModal()}
                mode={roleModal.mode}
                form={roleForm}
                onFormChange={setRoleForm}
                onSubmit={handleSubmitRole}
                loading={roleFormLoading}
                submitting={roleFormSubmitting}
                error={roleFormError}
                permissions={permissions}
                selectedPermissionCodes={selectedPermissionCodes}
                onTogglePermission={togglePermissionSelection}
                permissionsLoading={permissionsLoading}
                onSavePermissions={handleSaveRolePermissions}
                savingPermissions={permissionFormSubmitting}
            />

            <PermissionFormDialog
                open={permissionModal.open}
                onOpenChange={(open) => !open && closePermissionModal()}
                mode={permissionModal.mode}
                form={permissionForm}
                onFormChange={setPermissionForm}
                onSubmit={handleSubmitPermission}
                submitting={permissionFormSubmitting}
                error={permissionFormError}
            />
        </div>
    );
}
