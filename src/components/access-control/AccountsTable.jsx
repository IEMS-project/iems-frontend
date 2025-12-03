import React from "react";
import { RefreshCw, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AccountsTable({
    accounts,
    loading,
    error,
    searchValue,
    onSearchChange,
    onRefresh,
    onSelectAccount,
    selectedAccountId,
}) {
    if (loading) {
        return (
            <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                Không có tài khoản nào
            </div>
        );
    }

    return (
        <>
            <div className="mb-3 flex items-center justify-between gap-2">
                <Input
                    placeholder="Tìm theo email, username hoặc role..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <Button variant="outline" size="icon" onClick={onRefresh}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <div className="rounded-md border">
                <ScrollArea className="h-[360px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tài khoản</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Roles</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((acc) => {
                                const isActiveRow = selectedAccountId === acc.userId;
                                return (
                                    <TableRow
                                        key={acc.userId}
                                        className={`cursor-pointer ${isActiveRow ? "bg-blue-50 dark:bg-blue-500/10" : ""
                                            }`}
                                        onClick={() => onSelectAccount(acc)}
                                    >
                                        <TableCell>
                                            <div className="font-medium flex items-center gap-2">
                                                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                                                {acc.username}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {acc.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={acc.enabled ? "green" : "red"}>
                                                {acc.enabled ? "Đang hoạt động" : "Đã khóa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(acc.roles || []).map((r) => (
                                                    <Badge key={r} variant="blue">
                                                        {r}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </>
    );
}
