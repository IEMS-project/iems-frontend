import React, { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import StatsCard from "@/components/ui/StatsCard";
import { iamService } from "@/features/admin/api/iamService";
import AccountsTable from "./AccountsTable";
import AccountDetailDialog from "./AccountDetailDialog";

const emptyAccountPasswordForm = { newPassword: "", confirmPassword: "" };

export default function AccountManagementTab() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState("");
    const [accountSearch, setAccountSearch] = useState("");

    // Account selection & editing
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountDetailLoading, setAccountDetailLoading] = useState(false);
    const [accountSaveMessage, setAccountSaveMessage] = useState("");
    const [accountSaveError, setAccountSaveError] = useState("");
    const [accountRolesDraft, setAccountRolesDraft] = useState(new Set());
    const [accountEnabledDraft, setAccountEnabledDraft] = useState(true);
    const [accountRolesOriginal, setAccountRolesOriginal] = useState(new Set());
    const [accountRolesSaving, setAccountRolesSaving] = useState(false);

    // Reset password
    const [passwordForm, setPasswordForm] = useState(emptyAccountPasswordForm);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Account detail dialog
    const [accountDialogOpen, setAccountDialogOpen] = useState(false);

    useEffect(() => {
        let active = true;
        const loadRoles = async () => {
            try {
                const data = await iamService.getRoles();
                if (!active) return;
                setRoles(Array.isArray(data) ? data : []);
            } catch {
                // Silent fail for roles when loading accounts tab
            }
        };
        loadRoles();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadAccounts = async () => {
            setAccountsLoading(true);
            setAccountsError("");
            try {
                const data = await iamService.getAccounts();
                if (!active) return;
                setAccounts(Array.isArray(data) ? data : []);
            } catch (error) {
                if (active) setAccountsError(error?.message || t("admin.accessControl.common.errorLoadingData"));
            } finally {
                if (active) setAccountsLoading(false);
            }
        };
        loadAccounts();
        return () => {
            active = false;
        };
    }, []);

    const filteredAccounts = useMemo(() => {
        if (!accountSearch.trim()) return accounts;
        const q = accountSearch.toLowerCase();
        return accounts.filter(
            (acc) =>
                acc?.username?.toLowerCase().includes(q) ||
                acc?.email?.toLowerCase().includes(q) ||
                (Array.isArray(acc?.roles) ? acc.roles.join(" ").toLowerCase().includes(q) : false)
        );
    }, [accounts, accountSearch]);

    const handleSelectAccount = async (account) => {
        if (!account) return;
        setSelectedAccount(account);
        setAccountDialogOpen(true);
        setAccountDetailLoading(true);
        setAccountSaveMessage("");
        setAccountSaveError("");
        setPasswordError("");
        setPasswordSuccess("");
        try {
            const detail = await iamService.getAccountById(account.userId).catch(() => account);
            const effective = detail || account;
            setSelectedAccount(effective);
            setAccountEnabledDraft(!!effective.enabled);
            const rolesSet = new Set(effective.roles || []);
            setAccountRolesDraft(rolesSet);
            setAccountRolesOriginal(new Set(rolesSet));
            setPasswordForm(emptyAccountPasswordForm);
        } finally {
            setAccountDetailLoading(false);
        }
    };

    const toggleAccountRole = (code) => {
        setAccountRolesDraft((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
        setAccountSaveMessage("");
        setAccountSaveError("");
    };

    const handleSaveAccountRoles = async () => {
        if (!selectedAccount) return;
        setAccountRolesSaving(true);
        setAccountSaveMessage("");
        setAccountSaveError("");
        try {
            await iamService.updateAccountRoles(
                selectedAccount.userId,
                Array.from(accountRolesDraft)
            );

            setSelectedAccount((prev) =>
                prev
                    ? {
                        ...prev,
                        roles: Array.from(accountRolesDraft),
                    }
                    : prev
            );
            setAccountRolesOriginal(new Set(accountRolesDraft));

            const refreshed = await iamService.getAccounts();
            setAccounts(Array.isArray(refreshed) ? refreshed : []);

            setAccountSaveMessage(t("admin.accessControl.accounts.rolesUpdated"));
            setAccountSaveError("");
        } catch (error) {
            setAccountSaveError(error?.message || t("admin.accessControl.accounts.error"));
        } finally {
            setAccountRolesSaving(false);
        }
    };

    const handleToggleLock = async () => {
        if (!selectedAccount) return;
        try {
            const locked = !!selectedAccount.enabled;
            const updated = await iamService.lockAccount(
                selectedAccount.userId,
                locked,
                locked ? t("admin.accessControl.accounts.lockAccount") : t("admin.accessControl.accounts.unlockAccount")
            );
            setSelectedAccount((prev) => ({ ...(prev || {}), enabled: updated.enabled }));
            setAccountEnabledDraft(!!updated.enabled);
            const refreshed = await iamService.getAccounts();
            setAccounts(Array.isArray(refreshed) ? refreshed : []);
        } catch (error) {
            setAccountSaveError(error?.message || t("admin.accessControl.accounts.error"));
        }
    };

    const handleResetPassword = async () => {
        if (!selectedAccount) return;
        setPasswordError("");
        setPasswordSuccess("");
        const newPw = passwordForm.newPassword.trim();
        const confirmPw = passwordForm.confirmPassword.trim();
        if (!newPw || !confirmPw) {
            setPasswordError(t("admin.accessControl.accounts.passwordMismatch"));
            return;
        }
        if (newPw !== confirmPw) {
            setPasswordError(t("admin.accessControl.accounts.passwordMismatch"));
            return;
        }
        try {
            setPasswordSaving(true);
            await iamService.resetAccountPassword(selectedAccount.userId, newPw);
            setPasswordForm(emptyAccountPasswordForm);
            setPasswordSuccess(t("admin.accessControl.accounts.passwordResetSuccess"));
        } catch (error) {
            setPasswordError(error?.message || t("admin.accessControl.accounts.passwordResetError"));
        } finally {
            setPasswordSaving(false);
        }
    };

    const hasSetChanges = (draftSet, originalSet) => {
        if (draftSet.size !== originalSet.size) return true;
        for (const value of draftSet) {
            if (!originalSet.has(value)) return true;
        }
        return false;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatsCard
                    title={t("admin.accessControl.accounts.totalAccounts")}
                    value={accounts.length}
                    icon={<Users className="h-5 w-5" />}
                    accent="green"
                />
                <StatsCard
                    title={t("admin.accessControl.accounts.activeAccounts")}
                    value={accounts.filter((acc) => acc.enabled).length}
                    icon={<Users className="h-5 w-5" />}
                    accent="blue"
                />
                <StatsCard
                    title={t("admin.accessControl.accounts.lockedAccounts")}
                    value={accounts.filter((acc) => !acc.enabled).length}
                    icon={<Users className="h-5 w-5" />}
                    accent="red"
                />
            </div>

            {/* Accounts section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t("admin.accessControl.accounts.accountManagement")}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {t("admin.accessControl.accounts.accountManagementDescription")}
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 rounded-md border p-4">
                        <AccountsTable
                            accounts={filteredAccounts}
                            loading={accountsLoading}
                            error={accountsError}
                            searchValue={accountSearch}
                            onSearchChange={setAccountSearch}
                            onRefresh={async () => {
                                setAccountsLoading(true);
                                try {
                                    const data = await iamService.getAccounts();
                                    setAccounts(Array.isArray(data) ? data : []);
                                } finally {
                                    setAccountsLoading(false);
                                }
                            }}
                            onSelectAccount={handleSelectAccount}
                            selectedAccountId={selectedAccount?.userId}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Account detail dialog */}
            <AccountDetailDialog
                open={accountDialogOpen}
                onOpenChange={setAccountDialogOpen}
                account={selectedAccount}
                loading={accountDetailLoading}
                roles={roles}
                accountRolesDraft={accountRolesDraft}
                accountEnabledDraft={accountEnabledDraft}
                onToggleRole={toggleAccountRole}
                onSaveRoles={handleSaveAccountRoles}
                onToggleLock={handleToggleLock}
                onResetPassword={handleResetPassword}
                passwordForm={passwordForm}
                onPasswordFormChange={setPasswordForm}
                passwordError={passwordError}
                passwordSuccess={passwordSuccess}
                passwordSaving={passwordSaving}
                accountRolesSaving={accountRolesSaving}
                saveMessage={accountSaveMessage}
                saveError={accountSaveError}
                hasRolesChanges={hasSetChanges(accountRolesDraft, accountRolesOriginal)}
            />
        </div>
    );
}
