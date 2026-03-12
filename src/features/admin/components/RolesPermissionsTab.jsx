import React, { useEffect, useMemo, useState } from "react";
import { Shield, Plus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/ui/StatsCard";
import { iamService } from "@/features/admin/api/iamService";
import RolesTable from "./RolesTable";
import RoleFormDialog from "./RoleFormDialog";

const emptyRoleForm = { code: "", name: "", description: "" };

export default function RolesPermissionsTab() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [rolesError, setRolesError] = useState("");
    const [roleSearch, setRoleSearch] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState(null);

    const [roleModal, setRoleModal] = useState({ open: false, mode: "create", role: null });
    const [roleForm, setRoleForm] = useState(emptyRoleForm);
    const [roleFormError, setRoleFormError] = useState("");
    const [roleFormSubmitting, setRoleFormSubmitting] = useState(false);
    const [deletingRoleId, setDeletingRoleId] = useState(null);

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

    const filteredRoles = useMemo(() => {
        if (!roleSearch.trim()) return roles;
        const q = roleSearch.toLowerCase();
        return roles.filter(
            (role) =>
                role?.name?.toLowerCase().includes(q) ||
                role?.code?.toLowerCase().includes(q)
        );
    }, [roles, roleSearch]);

    const openRoleModal = (mode, role = null) => {
        setRoleFormError("");
        setRoleModal({ open: true, mode, role });
        if (mode === "create" || !role) {
            setRoleForm(emptyRoleForm);
            return;
        }
        setRoleForm({
            code: role.code,
            name: role.name,
            description: role.description || "",
        });
    };

    const closeRoleModal = () => {
        setRoleModal({ open: false, mode: "create", role: null });
        setRoleForm(emptyRoleForm);
        setRoleFormError("");
    };

    const handleSubmitRole = async () => {
        setRoleFormError("");
        const trimmedName = roleForm.name.trim();
        const trimmedCode = roleForm.code.trim();
        if (!trimmedName || (roleModal.mode === "create" && !trimmedCode)) {
            setRoleFormError(t("admin.accessControl.roles.error"));
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
                setRoles((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
                closeRoleModal();
            } else if (roleModal.role) {
                const updated = await iamService.updateRole(roleModal.role.id, {
                    name: trimmedName,
                    description: roleForm.description?.trim() || undefined,
                });
                setRoles((prev) =>
                    (Array.isArray(prev) ? prev : []).map((role) =>
                        role.id === updated.id
                            ? { ...role, name: updated.name, description: updated.description }
                            : role
                    )
                );
                closeRoleModal();
            }
        } catch (error) {
            setRoleFormError(error?.message || t("admin.accessControl.roles.error"));
        } finally {
            setRoleFormSubmitting(false);
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
            }
        } catch (error) {
            setRolesError(error?.message || t("admin.accessControl.roles.error"));
        } finally {
            setDeletingRoleId(null);
        }
    };

    const handleRefresh = async () => {
        setRolesLoading(true);
        try {
            const data = await iamService.getRoles();
            setRoles(Array.isArray(data) ? data : []);
        } catch {
            // keep existing
        } finally {
            setRolesLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <StatsCard
                    title={t("admin.accessControl.roles.totalRoles")}
                    value={roles.length}
                    icon={<Shield className="h-5 w-5" />}
                    accent="indigo"
                />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t("admin.accessControl.roles.rolesList")}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {t("admin.accessControl.roles.rolesListDescription")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={rolesLoading}>
                            <RefreshCw className={`h-4 w-4 ${rolesLoading ? "animate-spin" : ""}`} />
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
                        onSelectRole={setSelectedRoleId}
                        selectedRoleId={selectedRoleId}
                        deletingRoleId={deletingRoleId}
                    />
                </CardContent>
            </Card>

            <RoleFormDialog
                open={roleModal.open}
                onOpenChange={(open) => !open && closeRoleModal()}
                mode={roleModal.mode}
                form={roleForm}
                onFormChange={setRoleForm}
                onSubmit={handleSubmitRole}
                loading={false}
                submitting={roleFormSubmitting}
                error={roleFormError}
            />
        </div>
    );
}

