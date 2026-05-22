import React, { useEffect, useState } from "react";
import { UserCircle2, Lock, Unlock, KeyRound, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "@/components/ui/Select";
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
    accountRoleDraft,
    accountEnabledDraft,
    onRoleChange,
    onSaveRoles,
    onToggleLock,
    onResetPassword,
    passwordForm,
    onPasswordFormChange,
    passwordError,
    passwordSuccess,
    passwordSaving,
    accountRolesSaving,
    saveMessage,
    saveError,
    hasRolesChanges,
    onUpgradePremium,
    onDowngradePremium,
    // User profile props
    userProfile,
    userProfileDraft,
    onUserProfileChange,
    onSaveUserProfile,
    userProfileSaving,
    userProfileError,
    userProfileSuccess,
    hasUserProfileChanges,
}) {
    const { t } = useTranslation();
    const [selectedDays, setSelectedDays] = useState(30);
    const [customDays, setCustomDays] = useState("");
    const [premiumLoading, setPremiumLoading] = useState(false);
    const [premiumMsg, setPremiumMsg] = useState(null);
    const isPremium = account?.subscriptionType === "PREMIUM";
    const expiryText = account?.premiumUntil
        ? new Date(account.premiumUntil).toLocaleDateString("vi-VN")
        : "";

    const DURATION_PRESETS = [
        { label: "7 ngày", days: 7 },
        { label: "30 ngày", days: 30 },
        { label: "90 ngày", days: 90 },
        { label: "365 ngày", days: 365 },
    ];

    useEffect(() => {
        setPremiumMsg(null);
        setPremiumLoading(false);
        setSelectedDays(30);
        setCustomDays("");
    }, [account?.userId, account?.id]);

    const handlePremiumUpgrade = async () => {
        if (!account || !onUpgradePremium) return;
        const days = Number(customDays || selectedDays);
        if (!days || days < 1) {
            setPremiumMsg({ type: "error", text: "Số ngày không hợp lệ" });
            return;
        }
        setPremiumLoading(true);
        setPremiumMsg(null);
        try {
            await onUpgradePremium(account, days);
            setPremiumMsg({ type: "success", text: `✓ Đã nâng cấp Premium ${days} ngày` });
        } catch (error) {
            setPremiumMsg({ type: "error", text: error?.message || "Lỗi nâng cấp" });
        } finally {
            setPremiumLoading(false);
        }
    };

    const handlePremiumDowngrade = async () => {
        if (!account || !onDowngradePremium) return;
        if (!window.confirm(`Hủy Premium của ${account.username}?`)) return;
        setPremiumLoading(true);
        setPremiumMsg(null);
        try {
            await onDowngradePremium(account);
            setPremiumMsg({ type: "success", text: "✓ Đã hạ xuống FREE" });
        } catch (error) {
            setPremiumMsg({ type: "error", text: error?.message || "Lỗi hạ cấp" });
        } finally {
            setPremiumLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {account ? `${t("admin.accessControl.accounts.details")}: ${account.username}` : t("admin.accessControl.accounts.details")}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-100px)]">
                <div className="space-y-6 pr-4">{/* Added padding for scrollbar */}
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
                                        <span
                                            className={`text-xs font-semibold ${
                                                isPremium ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground"
                                            }`}
                                        >
                                            {isPremium ? "PREMIUM" : "FREE"}
                                            {isPremium && expiryText ? ` · hết ${expiryText}` : ""}
                                        </span>
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

                            <div className="grid gap-4 md:grid-cols-1">
                                <div className="space-y-2">
                                    <Label>{t("admin.accessControl.accounts.roles")}</Label>
                                    <Select
                                        value={accountRoleDraft}
                                        onChange={(e) => onRoleChange(e.target.value)}
                                    >
                                        <option value="">{t("admin.accessControl.accounts.selectRole")}</option>
                                        {roles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </Select>
                                    <div className="mt-2 flex justify-end gap-2">
                                        {saveMessage && (
                                            <p className="text-xs text-green-600 self-center">{saveMessage}</p>
                                        )}
                                        {saveError && (
                                            <p className="text-xs text-red-600 self-center">{saveError}</p>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={onSaveRoles}
                                            disabled={loading || accountRolesSaving || !hasRolesChanges}
                                        >
                                            {accountRolesSaving ? t("admin.accessControl.accounts.saving") : t("admin.accessControl.accounts.save")}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Premium Management Section */}
                            <div className="space-y-3 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-amber-500" />
                                        <h3 className="font-medium text-sm">Quản lý Premium</h3>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold ${
                                            isPremium ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground"
                                        }`}
                                    >
                                        {isPremium ? "PREMIUM" : "FREE"}
                                        {isPremium && expiryText ? ` · hết ${expiryText}` : ""}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">
                                        Nâng cấp Premium / Gia hạn
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DURATION_PRESETS.map((p) => (
                                            <button
                                                key={p.days}
                                                onClick={() => {
                                                    setSelectedDays(p.days);
                                                    setCustomDays("");
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                                    selectedDays === p.days && !customDays
                                                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                                                        : "bg-background border-border text-muted-foreground hover:border-amber-400 hover:text-foreground"
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="3650"
                                            placeholder="Số ngày tùy chỉnh..."
                                            value={customDays}
                                            onChange={(e) => {
                                                setCustomDays(e.target.value);
                                                setSelectedDays(null);
                                            }}
                                            className="flex-1 h-8 text-sm bg-background"
                                        />
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shrink-0"
                                            onClick={handlePremiumUpgrade}
                                            disabled={premiumLoading || !(customDays || selectedDays)}
                                        >
                                            <Crown size={13} className="mr-1" />
                                            {account.subscriptionType === "PREMIUM" ? "Gia hạn" : "Nâng cấp"}
                                        </Button>
                                    </div>
                                </div>

                                {account.subscriptionType === "PREMIUM" && (
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs text-muted-foreground border-border hover:border-red-400 hover:text-red-600"
                                            onClick={handlePremiumDowngrade}
                                            disabled={premiumLoading}
                                        >
                                            Hạ xuống FREE
                                        </Button>
                                    </div>
                                )}

                                {premiumMsg && (
                                    <p
                                        className={`text-xs font-medium ${
                                            premiumMsg.type === "success" ? "text-green-600" : "text-red-500"
                                        }`}
                                    >
                                        {premiumMsg.text}
                                    </p>
                                )}
                            </div>
                            {/* User Profile Section */}
                            <div className="space-y-3 rounded-md border p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-sm">{t("admin.accessControl.accounts.userProfile") || "User Profile"}</h3>
                                </div>
                                {!userProfile ? (
                                    <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded">
                                        {t("admin.accessControl.accounts.noUserProfile") || "No user profile found for this account"}
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label>{t("admin.accessControl.accounts.firstName") || "First Name"}</Label>
                                                <Input
                                                    value={userProfileDraft?.firstName || ""}
                                                    onChange={(e) => onUserProfileChange({ ...userProfileDraft, firstName: e.target.value })}
                                                    placeholder={t("admin.accessControl.accounts.firstName")}
                                                />
                                            </div>
                                            <div>
                                                <Label>{t("admin.accessControl.accounts.lastName") || "Last Name"}</Label>
                                                <Input
                                                    value={userProfileDraft?.lastName || ""}
                                                    onChange={(e) => onUserProfileChange({ ...userProfileDraft, lastName: e.target.value })}
                                                    placeholder={t("admin.accessControl.accounts.lastName")}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label>{t("admin.accessControl.accounts.phone") || "Phone"}</Label>
                                                <Input
                                                    value={userProfileDraft?.phone || ""}
                                                    onChange={(e) => onUserProfileChange({ ...userProfileDraft, phone: e.target.value })}
                                                    placeholder={t("admin.accessControl.accounts.phone")}
                                                />
                                            </div>
                                            <div>
                                                <Label>{t("admin.accessControl.accounts.gender") || "Gender"}</Label>
                                                <Select
                                                    value={userProfileDraft?.gender || ""}
                                                    onChange={(e) => onUserProfileChange({ ...userProfileDraft, gender: e.target.value })}
                                                >
                                                    <option value="">{t("admin.accessControl.accounts.selectGender") || "Select Gender"}</option>
                                                    <option value="MALE">{t("admin.accessControl.accounts.male")}</option>
                                                    <option value="FEMALE">{t("admin.accessControl.accounts.female")}</option>
                                                    <option value="OTHER">{t("admin.accessControl.accounts.other")}</option>
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>{t("admin.accessControl.accounts.address") || "Address"}</Label>
                                            <Input
                                                value={userProfileDraft?.address || ""}
                                                onChange={(e) => onUserProfileChange({ ...userProfileDraft, address: e.target.value })}
                                                placeholder={t("admin.accessControl.accounts.address")}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {userProfileError && (
                                                <p className="text-xs text-red-600 self-center">{userProfileError}</p>
                                            )}
                                            {userProfileSuccess && (
                                                <p className="text-xs text-green-600 self-center">{userProfileSuccess}</p>
                                            )}
                                            <Button
                                                size="sm"
                                                onClick={onSaveUserProfile}
                                                disabled={loading || userProfileSaving || !hasUserProfileChanges}
                                            >
                                                {userProfileSaving ? t("admin.accessControl.accounts.saving") : t("admin.accessControl.accounts.saveProfile")}
                                            </Button>
                                        </div>
                                    </>
                                )}
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
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
