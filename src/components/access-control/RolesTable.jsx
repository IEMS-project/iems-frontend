import React from "react";
import { Plus, RefreshCw, PencilLine, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Badge from "@/components/ui/Badge";
import IconActionButton from "@/components/ui/IconActionButton";
import Skeleton from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function RolesTable({
    roles,
    loading,
    error,
    searchValue,
    onSearchChange,
    onEditRole,
    onDeleteRole,
    onSelectRole,
    selectedRoleId,
    deletingRoleId,
}) {
    const { t } = useTranslation();

    return (
        <>
            <div className="mb-4 flex items-center justify-between gap-3">
                <Input
                    placeholder={t("admin.accessControl.roles.searchPlaceholder")}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="rounded-md border">
                {loading ? (
                    <div className="space-y-3 p-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                ) : roles.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">{t("admin.accessControl.roles.noRoles")}</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("admin.accessControl.roles.title")}</TableHead>
                                <TableHead>{t("admin.accessControl.roles.permissions")}</TableHead>
                                <TableHead className="text-right">{t("admin.accessControl.common.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => {
                                const isActive = selectedRoleId === role.id;
                                return (
                                    <TableRow
                                        key={role.id}
                                        onClick={() => onSelectRole(role.id)}
                                        className="cursor-pointer"
                                        data-state={isActive ? "selected" : undefined}
                                    >
                                        <TableCell>
                                            <div className="font-medium">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {role.code}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="blue">
                                                {t("admin.accessControl.roles.permissionCount", { count: role.permissions?.length || 0 })}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <IconActionButton
                                                    icon={PencilLine}
                                                    label={t("admin.accessControl.roles.editRole")}
                                                    variant="edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditRole(role);
                                                    }}
                                                />
                                                <IconActionButton
                                                    icon={Trash2}
                                                    label={t("admin.accessControl.roles.deleteRole")}
                                                    variant="danger"
                                                    disabled={deletingRoleId === role.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteRole(role);
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
}
