import React, { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/ui/StatsCard";
import { iamService } from "@/features/admin/api/iamService";
import AccountsTable from "./AccountsTable";
import AccountDetailDialog from "./AccountDetailDialog";

// Available roles from UserRole enum in backend
const AVAILABLE_ROLES = ["ADMIN", "USER"];

export default function AccountManagementTab() {
    const { t } = useTranslation();
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState("");
    const [accountSearch, setAccountSearch] = useState("");
    const [accountPage, setAccountPage] = useState(0);
    const [accountPageSize] = useState(20);
    const [accountPageMeta, setAccountPageMeta] = useState({
        totalPages: 0,
        totalElements: 0,
        hasPrevious: false,
        hasNext: false,
    });

    // Account selection & editing
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountDetailLoading, setAccountDetailLoading] = useState(false);
    const [accountSaveMessage, setAccountSaveMessage] = useState("");
    const [accountSaveError, setAccountSaveError] = useState("");
    const [accountRoleDraft, setAccountRoleDraft] = useState("");
    const [accountEnabledDraft, setAccountEnabledDraft] = useState(true);
    const [accountRoleOriginal, setAccountRoleOriginal] = useState("");
    const [accountRolesSaving, setAccountRolesSaving] = useState(false);

    // Avatar/display data comes from the paginated admin account API.
    const [userProfileDraft, setUserProfileDraft] = useState(null);

    // Account detail dialog
    const [accountDialogOpen, setAccountDialogOpen] = useState(false);

    const loadAccounts = useCallback(async () => {
        setAccountsLoading(true);
        setAccountsError("");
        try {
            const data = await iamService.getAdminAccounts({
                page: accountPage,
                size: accountPageSize,
                q: accountSearch.trim(),
            });
            setAccounts(data.items);
            setAccountPageMeta({
                totalPages: data.totalPages,
                totalElements: data.totalElements,
                hasPrevious: data.hasPrevious,
                hasNext: data.hasNext,
            });
        } catch (error) {
            setAccountsError(error?.message || t("admin.accessControl.common.errorLoadingData"));
        } finally {
            setAccountsLoading(false);
        }
    }, [accountPage, accountPageSize, accountSearch, t]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!active) return;
            await loadAccounts();
        };
        load();
        return () => {
            active = false;
        };
    }, [loadAccounts]);

    const resolveAccountId = (account) => account?.id ?? account?.userId;

    const handleAccountSearchChange = (value) => {
        setAccountSearch(value);
        setAccountPage(0);
    };

    const handleSelectAccount = async (account) => {
        if (!account) return;
        setSelectedAccount(account);
        setAccountDialogOpen(true);
        setAccountDetailLoading(true);
        setAccountSaveMessage("");
        setAccountSaveError("");
        try {
            const accountId = resolveAccountId(account);
            const detail = accountId
                ? await iamService.getAccountById(accountId).catch(() => account)
                : account;
            const effective = { ...account, ...(detail || {}) };
            setSelectedAccount(effective);
            setAccountEnabledDraft(!!effective.enabled);
            const role = (effective.roles && effective.roles[0]) || "USER";
            setAccountRoleDraft(role);
            setAccountRoleOriginal(role);

            const profile = effective.profileId
                ? {
                    image: effective.image || "",
                    displayName: effective.displayName || effective.username || "",
                }
                : null;
            setUserProfileDraft(profile ? { ...profile } : null);
        } finally {
            setAccountDetailLoading(false);
        }
    };

    const refreshSelectedAccount = async (account) => {
        const accountId = resolveAccountId(account);
        if (!accountId) return;
        try {
            const detail = await iamService.getAccountById(accountId);
            if (detail) setSelectedAccount(detail);
        } catch (error) {
            // Keep existing data if refresh fails.
        }
    };

    const handleUpgradePremium = async (account, days) => {
        const accountId = resolveAccountId(account);
        if (!accountId) throw new Error("Missing account id");
        await iamService.upgradeAccountToPremium(accountId, days);
        await loadAccounts();
        await refreshSelectedAccount(account);
    };

    const handleDowngradePremium = async (account) => {
        const accountId = resolveAccountId(account);
        if (!accountId) throw new Error("Missing account id");
        await iamService.downgradeAccountToFree(accountId);
        await loadAccounts();
        await refreshSelectedAccount(account);
    };

    const handleRoleChange = (role) => {
        setAccountRoleDraft(role);
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
                [accountRoleDraft]
            );

            setSelectedAccount((prev) =>
                prev
                    ? {
                        ...prev,
                        roles: [accountRoleDraft],
                    }
                    : prev
            );
            setAccountRoleOriginal(accountRoleDraft);

            await loadAccounts();

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
            await loadAccounts();
        } catch (error) {
            setAccountSaveError(error?.message || t("admin.accessControl.accounts.error"));
        }
    };

    const hasRoleChanges = accountRoleDraft !== accountRoleOriginal;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatsCard
                    title={t("admin.accessControl.accounts.totalAccounts")}
                    value={accountPageMeta.totalElements}
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
                            accounts={accounts}
                            loading={accountsLoading}
                            error={accountsError}
                            searchValue={accountSearch}
                            onSearchChange={handleAccountSearchChange}
                            onRefresh={loadAccounts}
                            onSelectAccount={handleSelectAccount}
                            selectedAccountId={selectedAccount?.userId}
                            page={accountPage}
                            totalPages={accountPageMeta.totalPages}
                            totalElements={accountPageMeta.totalElements}
                            hasPrevious={accountPageMeta.hasPrevious}
                            hasNext={accountPageMeta.hasNext}
                            onPreviousPage={() => setAccountPage((page) => Math.max(page - 1, 0))}
                            onNextPage={() => setAccountPage((page) => page + 1)}
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
                roles={AVAILABLE_ROLES}
                accountRoleDraft={accountRoleDraft}
                accountEnabledDraft={accountEnabledDraft}
                onRoleChange={handleRoleChange}
                onSaveRoles={handleSaveAccountRoles}
                onToggleLock={handleToggleLock}
                accountRolesSaving={accountRolesSaving}
                saveMessage={accountSaveMessage}
                saveError={accountSaveError}
                hasRolesChanges={hasRoleChanges}
                onUpgradePremium={handleUpgradePremium}
                onDowngradePremium={handleDowngradePremium}
                userProfileDraft={userProfileDraft}
            />
        </div>
    );
}
