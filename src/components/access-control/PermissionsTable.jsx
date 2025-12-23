import React from "react";
import { Plus, PencilLine, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function PermissionsTable({
    permissions,
    loading,
    error,
    searchValue,
    onSearchChange,
    onEditPermission,
    onDeletePermission,
    deletingPermissionId,
}) {
    const { t } = useTranslation();

    return (
        <>
            <div className="mb-4">
                <Input
                    placeholder={t("admin.accessControl.permissions.searchPlaceholder")}
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
                ) : permissions.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                        {t("admin.accessControl.permissions.noPermissions")}
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("admin.accessControl.permissions.title")}</TableHead>
                                    <TableHead className="text-right">{t("admin.accessControl.common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissions.map((permission) => (
                                    <TableRow key={permission.id}>
                                        <TableCell>
                                            <div className="font-medium">{permission.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {permission.code}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <IconActionButton
                                                    icon={PencilLine}
                                                    label={t("admin.accessControl.permissions.edit")}
                                                    variant="edit"
                                                    className="text-black dark:text-white"
                                                    onClick={() => onEditPermission(permission)}
                                                />
                                                <IconActionButton
                                                    icon={Trash2}
                                                    label={t("admin.accessControl.permissions.delete")}
                                                    variant="danger"
                                                    disabled={deletingPermissionId === permission.id}
                                                    onClick={() => onDeletePermission(permission)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </div>
        </>
    );
}
