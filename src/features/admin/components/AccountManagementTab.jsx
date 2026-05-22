import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import StatsCard from "@/components/ui/StatsCard";
import { iamService } from "@/features/admin/api/iamService";
import AccountsTable from "./AccountsTable";
import AccountDetailDialog from "./AccountDetailDialog";

const emptyAccountPasswordForm = { newPassword: "", confirmPassword: "" };

// Available roles from UserRole enum in backend
const AVAILABLE_ROLES = ["ADMIN", "USER"];

export default function AccountManagementTab() {
    const { t } = useTranslation();
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState("");
    const [accountSearch, setAccountSearch] = useState("");

    // Account selection & editing
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountDetailLoading, setAccountDetailLoading] = useState(false);
    const [accountSaveMessage, setAccountSaveMessage] = useState("");
    const [accountSaveError, setAccountSaveError] = useState("");
    const [accountRoleDraft, setAccountRoleDraft] = useState("");
    const [accountEnabledDraft, setAccountEnabledDraft] = useState(true);
    const [accountRoleOriginal, setAccountRoleOriginal] = useState("");
    const [accountRolesSaving, setAccountRolesSaving] = useState(false);

    // Reset password
    const [passwordForm, setPasswordForm] = useState(emptyAccountPasswordForm);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // User profile
    const [userProfile, setUserProfile] = useState(null);
    const [userProfileDraft, setUserProfileDraft] = useState(null);
    const [userProfileOriginal, setUserProfileOriginal] = useState(null);
    const [userProfileSaving, setUserProfileSaving] = useState(false);
    const [userProfileError, setUserProfileError] = useState("");
    const [userProfileSuccess, setUserProfileSuccess] = useState("");

    // Account detail dialog
    const [accountDialogOpen, setAccountDialogOpen] = useState(false);

    const loadAccounts = useCallback(async () => {
        setAccountsLoading(true);
        setAccountsError("");
        try {
            const data = await iamService.getAccounts();
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            setAccountsError(error?.message || t("admin.accessControl.common.errorLoadingData"));
        } finally {
            setAccountsLoading(false);
        }
    }, [t]);

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

    const resolveAccountId = (account) => account?.id ?? account?.userId;

    const handleSelectAccount = async (account) => {
        if (!account) return;
        setSelectedAccount(account);
        setAccountDialogOpen(true);
        setAccountDetailLoading(true);
        setAccountSaveMessage("");
        setAccountSaveError("");
        setPasswordError("");
        setPasswordSuccess("");
        setUserProfileError("");
        setUserProfileSuccess("");
        try {
            const accountId = resolveAccountId(account);
            const detail = accountId
                ? await iamService.getAccountById(accountId).catch(() => account)
                : account;
            const effective = detail || account;
            setSelectedAccount(effective);
            setAccountEnabledDraft(!!effective.enabled);
            const role = (effective.roles && effective.roles[0]) || "USER";
            setAccountRoleDraft(role);
            setAccountRoleOriginal(role);
            setPasswordForm(emptyAccountPasswordForm);

            // Fetch user profile
            try {
                const userProfileData = await iamService.getUserByAccountId(account.userId);
                setUserProfile(userProfileData);
                setUserProfileDraft(userProfileData ? { ...userProfileData } : null);
                setUserProfileOriginal(userProfileData ? { ...userProfileData } : null);
            } catch (err) {
                setUserProfile(null);
                setUserProfileDraft(null);
                setUserProfileOriginal(null);
            }
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

    const handleSaveUserProfile = async () => {
        if (!selectedAccount || !userProfileDraft) return;
        setUserProfileError("");
        setUserProfileSuccess("");
        try {
            setUserProfileSaving(true);
            if (userProfile?.id) {
                // Update existing profile
                await iamService.updateUser(userProfile.id, userProfileDraft);
            } else {
                // Create new profile
                const newProfile = {
                    ...userProfileDraft,
                    accountId: selectedAccount.userId,
                    email: selectedAccount.email
                };
                const created = await iamService.createUser(newProfile);
                setUserProfile(created);
                setUserProfileDraft({ ...created });
                setUserProfileOriginal({ ...created });
                setUserProfileSuccess(t("admin.accessControl.accounts.userProfileSaveSuccess"));
                return;
            }
            setUserProfile({ ...userProfileDraft });
            setUserProfileOriginal({ ...userProfileDraft });
            setUserProfileSuccess(t("admin.accessControl.accounts.userProfileSaveSuccess"));
        } catch (error) {
            setUserProfileError(error?.message || t("admin.accessControl.accounts.userProfileSaveError"));
        } finally {
            setUserProfileSaving(false);
        }
    };

    const hasRoleChanges = accountRoleDraft !== accountRoleOriginal;
    const hasUserProfileChanges = userProfileDraft && userProfileOriginal && 
        JSON.stringify(userProfileDraft) !== JSON.stringify(userProfileOriginal);

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
                            onRefresh={loadAccounts}
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
                roles={AVAILABLE_ROLES}
                accountRoleDraft={accountRoleDraft}
                accountEnabledDraft={accountEnabledDraft}
                onRoleChange={handleRoleChange}
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
                hasRolesChanges={hasRoleChanges}
                onUpgradePremium={handleUpgradePremium}
                onDowngradePremium={handleDowngradePremium}
                userProfile={userProfile}
                userProfileDraft={userProfileDraft}
                onUserProfileChange={setUserProfileDraft}
                onSaveUserProfile={handleSaveUserProfile}
                userProfileSaving={userProfileSaving}
                userProfileError={userProfileError}
                userProfileSuccess={userProfileSuccess}
                hasUserProfileChanges={hasUserProfileChanges}
            />
        </div>
    );
}
