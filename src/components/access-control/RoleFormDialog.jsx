import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Skeleton from "@/components/ui/skeleton";
import Badge from "@/components/ui/Badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function RoleFormDialog({
    open,
    onOpenChange,
    mode,
    form,
    onFormChange,
    onSubmit,
    loading,
    submitting,
    error,
    // Permissions props
    permissions = [],
    selectedPermissionCodes = new Set(),
    onTogglePermission,
    permissionsLoading = false,
    onSavePermissions,
    savingPermissions = false,
}) {
    const { t } = useTranslation();
    const [permissionFilter, setPermissionFilter] = useState("");

    const filteredPermissions = permissions.filter((p) => {
        if (!permissionFilter.trim()) return true;
        const q = permissionFilter.toLowerCase();
        return (
            p?.name?.toLowerCase().includes(q) ||
            p?.code?.toLowerCase().includes(q)
        );
    });

    const handleOpenChange = (isOpen) => {
        if (!isOpen) {
            setPermissionFilter("");
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? t("admin.accessControl.roles.createRole") : t("admin.accessControl.roles.editRole")}
                    </DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Left side - Role Info */}
                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-4">{t("admin.accessControl.roles.roleInfo")}</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>{t("admin.accessControl.roles.roleCode")}</Label>
                                        <Input
                                            value={form.code}
                                            disabled={mode === "edit"}
                                            onChange={(e) =>
                                                onFormChange({ ...form, code: e.target.value })
                                            }
                                            placeholder={t("admin.accessControl.roles.roleCodePlaceholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("admin.accessControl.roles.roleName")}</Label>
                                        <Input
                                            value={form.name}
                                            onChange={(e) =>
                                                onFormChange({ ...form, name: e.target.value })
                                            }
                                            placeholder={t("admin.accessControl.roles.roleNamePlaceholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("admin.accessControl.roles.description")}</Label>
                                        <Textarea
                                            value={form.description}
                                            rows={6}
                                            onChange={(e) =>
                                                onFormChange({ ...form, description: e.target.value })
                                            }
                                            placeholder={t("admin.accessControl.roles.descriptionPlaceholder")}
                                        />
                                    </div>
                                    {error && <p className="text-sm text-red-600">{error}</p>}
                                    <Button
                                        onClick={onSubmit}
                                        disabled={submitting || loading}
                                        className="w-full"
                                    >
                                        {submitting ? t("admin.accessControl.roles.saving") : t("admin.accessControl.roles.save")}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Permissions */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">{t("admin.accessControl.roles.assignPermissions")}</h3>
                                <Badge variant="green">
                                    {selectedPermissionCodes.size} / {permissions.length}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder={t("admin.accessControl.permissions.searchPlaceholder")}
                                    value={permissionFilter}
                                    onChange={(e) => setPermissionFilter(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        permissions.forEach((p) => {
                                            if (!selectedPermissionCodes.has(p.code)) {
                                                onTogglePermission?.(p.code);
                                            }
                                        });
                                    }}
                                >
                                    {t("admin.accessControl.roles.selectAll")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const codesToRemove = Array.from(selectedPermissionCodes);
                                        codesToRemove.forEach((code) => {
                                            onTogglePermission?.(code);
                                        });
                                    }}
                                >
                                    {t("admin.accessControl.roles.clearAll")}
                                </Button>
                            </div>
                            {permissionsLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    {filteredPermissions.length === 0 ? (
                                        <div className="p-4 text-sm text-muted-foreground text-center">
                                            {t("admin.accessControl.permissions.noPermissions")}
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[380px]">
                                            <div className="divide-y">
                                                {filteredPermissions.map((permission) => (
                                                    <label
                                                        key={permission.id}
                                                        className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                                                    >
                                                        <Checkbox
                                                            checked={selectedPermissionCodes.has(permission.code)}
                                                            onCheckedChange={() => onTogglePermission?.(permission.code)}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{permission.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {permission.code}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                            <Button
                                onClick={onSavePermissions}
                                disabled={savingPermissions || permissionsLoading || mode === "create"}
                                className="w-full"
                            >
                                {savingPermissions ? t("admin.accessControl.roles.saving") : t("admin.accessControl.roles.savePermissions")}
                            </Button>
                            {mode === "create" && (
                                <p className="text-xs text-muted-foreground text-center">
                                    {t("admin.accessControl.roles.saveBeforeAssign")}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        {t("admin.accessControl.common.close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
