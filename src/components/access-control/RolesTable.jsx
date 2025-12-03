import React from "react";
import { Plus, RefreshCw, PencilLine, Trash2 } from "lucide-react";
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
    return (
        <>
            <div className="mb-4 flex items-center justify-between gap-3">
                <Input
                    placeholder="Tìm theo tên hoặc code..."
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
                    <div className="p-4 text-sm text-muted-foreground">Không có role nào</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Số permission</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => {
                                const isActive = selectedRoleId === role.id;
                                return (
                                    <TableRow
                                        key={role.id}
                                        onClick={() => onSelectRole(role.id)}
                                        className={`cursor-pointer ${isActive ? "bg-blue-50 dark:bg-blue-500/10" : ""
                                            }`}
                                    >
                                        <TableCell>
                                            <div className="font-medium">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {role.code}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="blue">
                                                {role.permissions?.length || 0} quyền
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <IconActionButton
                                                    icon={PencilLine}
                                                    label="Chỉnh sửa role"
                                                    variant="edit"
                                                    className="text-black dark:text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditRole(role);
                                                    }}
                                                />
                                                <IconActionButton
                                                    icon={Trash2}
                                                    label="Xóa role"
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
