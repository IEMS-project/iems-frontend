import React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/UserAvatar";
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
    page = 0,
    totalPages = 0,
    totalElements = 0,
    hasPrevious = false,
    hasNext = false,
    onPreviousPage,
    onNextPage,
}) {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </div>
        );
    }

    return (
        <>
            <div className="mb-3 flex items-center justify-between gap-2">
                <Input
                    placeholder={t("admin.accessControl.accounts.searchPlaceholder")}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <Button variant="outline" size="icon" onClick={onRefresh}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            {accounts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground rounded-md border">
                    {t("admin.accessControl.accounts.noAccounts")}
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border bg-background/80 dark:bg-slate-950/80">
                    <ScrollArea className="h-[420px]">
                        <Table>
                        <TableHeader className="bg-muted/30 dark:bg-slate-900/60">
                            <TableRow>
                                <TableHead className="text-foreground/80 dark:text-slate-200">
                                    {t("admin.accessControl.accounts.username")}
                                </TableHead>
                                <TableHead className="text-foreground/80 dark:text-slate-200">
                                    {t("admin.accessControl.accounts.status")}
                                </TableHead>
                                <TableHead className="text-foreground/80 dark:text-slate-200">
                                    Gói
                                </TableHead>
                                <TableHead className="text-foreground/80 dark:text-slate-200">
                                    {t("admin.accessControl.accounts.roles")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((acc) => {
                                const isActiveRow = selectedAccountId === acc.userId;
                                return (
                                    <TableRow
                                        key={acc.userId}
                                        className={cn(
                                            "cursor-pointer dark:bg-slate-950/40 hover:dark:bg-slate-900/60",
                                            isActiveRow && "bg-blue-50 dark:bg-slate-900/80 dark:text-slate-100"
                                        )}
                                        onClick={() => onSelectAccount(acc)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar
                                                    src={acc.image || acc.userProfile?.image}
                                                    name={acc.displayName || acc.username || acc.email}
                                                    size="md"
                                                />
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">{acc.displayName || acc.username}</div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {acc.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={acc.enabled ? "green" : "red"}>
                                                {acc.enabled ? t("admin.accessControl.accounts.active") : t("admin.accessControl.accounts.locked")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`text-xs font-semibold ${
                                                    acc.subscriptionType === "PREMIUM"
                                                        ? "text-amber-600 dark:text-amber-300"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                {acc.subscriptionType === "PREMIUM" ? "PREMIUM" : "FREE"}
                                            </span>
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
                <div className="flex flex-col gap-2 border-t px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {totalElements} accounts · page {totalPages === 0 ? 0 : page + 1}/{totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPreviousPage}
                            disabled={!hasPrevious}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNextPage}
                            disabled={!hasNext}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}
