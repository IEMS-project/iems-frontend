import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RolePermissionsManager({
    selectedRole,
    loading,
    permissions,
    selectedPermissionCodes,
    onTogglePermission,
    error,
    success,
    filterValue,
    onFilterChange,
}) {
    if (!selectedRole) {
        return (
            <p className="text-sm text-muted-foreground">
                Chọn một role ở bảng bên trái để cấu hình permission
            </p>
        );
    }

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
            </div>
        );
    }

    return (
        <>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            {success && <p className="mb-3 text-sm text-green-600">{success}</p>}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-3 rounded-md border p-4">
                    <h4 className="text-sm font-medium">Thông tin role</h4>
                    <p className="text-sm">
                        <span className="text-muted-foreground">Tên: </span>
                        {selectedRole?.roleName || "—"}
                    </p>
                    <p className="text-sm">
                        <span className="text-muted-foreground">Mã: </span>
                        {selectedRole?.roleCode || "—"}
                    </p>
                    <p className="text-sm">
                        <span className="text-muted-foreground">Mô tả: </span>
                        {selectedRole?.description || "Chưa cập nhật"}
                    </p>
                    <p className="text-sm">
                        <span className="text-muted-foreground">Tạo lúc: </span>
                        {selectedRole?.createdAt
                            ? new Date(selectedRole.createdAt).toLocaleString()
                            : "—"}
                    </p>
                    <Badge variant="green">
                        {selectedPermissionCodes.size} / {permissions.length} quyền
                    </Badge>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <Input
                        placeholder="Lọc permission theo tên hoặc code..."
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                    <div className="rounded-md border">
                        {permissions.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">
                                Không có permission phù hợp.
                            </div>
                        ) : (
                            <ScrollArea className="h-[360px]">
                                <div className="divide-y">
                                    {permissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                checked={selectedPermissionCodes.has(permission.code)}
                                                onCheckedChange={() => onTogglePermission(permission.code)}
                                            />
                                            <div>
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
                </div>
            </div>
        </>
    );
}
