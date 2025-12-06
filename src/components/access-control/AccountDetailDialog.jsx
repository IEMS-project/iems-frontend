import React from "react";
import { UserCircle2, Lock, Unlock, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AccountDetailDialog({
    open,
    onOpenChange,
    account,
    loading,
    roles,
    permissions,
    accountRolesDraft,
    accountPermissionsDraft,
    accountEnabledDraft,
    onToggleRole,
    onTogglePermission,
    onSaveRoles,
    onSavePermissions,
    onToggleLock,
    onResetPassword,
    passwordForm,
    onPasswordFormChange,
    passwordError,
    passwordSuccess,
    passwordSaving,
    accountRolesSaving,
    accountPermissionsSaving,
    saveMessage,
    saveError,
    hasRolesChanges,
    hasPermissionsChanges,
}) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {account ? `${t("admin.accessControl.accounts.details")}: ${account.username}` : t("admin.accessControl.accounts.details")}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {!account ? (
                        <p className="text-sm text-muted-foreground">
                            {t("admin.accessControl.accounts.selectAccount")}
                        </p>
                    ) : loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{account.username}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {account.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Badge variant={accountEnabledDraft ? "green" : "red"}>
                                            {accountEnabledDraft ? t("admin.accessControl.accounts.active") : t("admin.accessControl.accounts.locked")}
                                        </Badge>
                                        <Badge variant="outline">ID: {account.userId}</Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Label className="text-xs text-muted-foreground mb-1">
                                        {t("admin.accessControl.accounts.status")}
                                    </Label>
                                    <Button
                                        variant={accountEnabledDraft ? "destructive" : "outline"}
                                        size="sm"
                                        onClick={onToggleLock}
                                    >
                                        {accountEnabledDraft ? (
                                            <>
                                                <Lock className="mr-1 h-4 w-4" />
                                                {t("admin.accessControl.accounts.lockAccount")}
                                            </>
                                        ) : (
                                            <>
                                                <Unlock className="mr-1 h-4 w-4" />
                                                {t("admin.accessControl.accounts.unlockAccount")}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{t("admin.accessControl.accounts.roles")}</Label>
                                        <span className="text-xs text-muted-foreground">
                                            {t("admin.accessControl.accounts.selectRole")}
                                        </span>
                                    </div>
                                    <div className="rounded-md border">
                                        {roles.length === 0 ? (
                                            <div className="p-3 text-xs text-muted-foreground">
                                                {t("admin.accessControl.roles.noRoles")}
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-[180px]">
                                                <div className="divide-y">
                                                    {roles.map((role) => {
                                                        const checked = accountRolesDraft.has(role.code);
                                                        return (
                                                            <label
                                                                key={role.id}
                                                                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
                                                            >
                                                                <Checkbox
                                                                    checked={checked}
                                                                    onCheckedChange={() => onToggleRole(role.code)}
                                                                />
                                                                <div>
                                                                    <div className="font-medium">{role.name}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {role.code}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </div>
                                    <div className="mt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={onSaveRoles}
                                            disabled={loading || accountRolesSaving || !hasRolesChanges}
                                        >
                                            {accountRolesSaving ? t("admin.accessControl.accounts.saving") : t("admin.accessControl.accounts.save")}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{t("admin.accessControl.accounts.directPermissions")}</Label>
                                        <span className="text-xs text-muted-foreground">
                                            {t("admin.accessControl.accounts.selectPermission")}
                                        </span>
                                    </div>
                                    <div className="rounded-md border">
                                        {permissions.length === 0 ? (
                                            <div className="p-3 text-xs text-muted-foreground">
                                                {t("admin.accessControl.permissions.noPermissions")}
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-[180px]">
                                                <div className="divide-y">
                                                    {permissions.map((permission) => {
                                                        const checked = accountPermissionsDraft.has(permission.code);
                                                        return (
                                                            <label
                                                                key={permission.id}
                                                                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
                                                            >
                                                                <Checkbox
                                                                    checked={checked}
                                                                    onCheckedChange={() => onTogglePermission(permission.code)}
                                                                />
                                                                <div>
                                                                    <div className="font-medium">{permission.name}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {permission.code}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </div>
                                    <div className="mt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={onSavePermissions}
                                            disabled={loading || accountPermissionsSaving || !hasPermissionsChanges}
                                        >
                                            {accountPermissionsSaving ? t("admin.accessControl.accounts.saving") : t("admin.accessControl.accounts.save")}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                                        <Label>{t("admin.accessControl.accounts.resetPassword")}</Label>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {t("admin.accessControl.accounts.resetPasswordDescription")}
                                    </span>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <Input
                                        type="password"
                                        placeholder={t("admin.accessControl.accounts.newPassword")}
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            onPasswordFormChange({
                                                ...passwordForm,
                                                newPassword: e.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        type="password"
                                        placeholder={t("admin.accessControl.accounts.confirmPassword")}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            onPasswordFormChange({
                                                ...passwordForm,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                {passwordError && (
                                    <p className="text-xs text-red-600">{passwordError}</p>
                                )}
                                {passwordSuccess && (
                                    <p className="text-xs text-green-600">{passwordSuccess}</p>
                                )}
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onResetPassword}
                                        disabled={passwordSaving}
                                    >
                                        {passwordSaving ? t("admin.accessControl.accounts.saving") : t("admin.accessControl.accounts.resetPassword")}
                                    </Button>
                                </div>
                            </div>

                            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                            {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                >
                                    {t("admin.accessControl.common.close")}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
