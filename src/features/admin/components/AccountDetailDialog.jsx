import React, { useEffect, useState } from "react";
import { Crown, Lock, Mail, Save, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/ui/UserAvatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const DURATION_PRESETS = [
    { label: "7 days", days: 7 },
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
    { label: "365 days", days: 365 },
];

function InfoItem({ label, value }) {
    return (
        <div className="min-w-0 rounded-md bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-sm font-medium">{value || "-"}</p>
        </div>
    );
}

function Section({ title, icon: Icon, children, action }) {
    return (
        <section className="rounded-md border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                    <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

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
    accountRolesSaving,
    saveMessage,
    saveError,
    hasRolesChanges,
    onUpgradePremium,
    onDowngradePremium,
    userProfileDraft,
}) {
    const { t } = useTranslation();
    const [selectedDays, setSelectedDays] = useState(30);
    const [customDays, setCustomDays] = useState("");
    const [premiumLoading, setPremiumLoading] = useState(false);
    const [premiumMsg, setPremiumMsg] = useState(null);

    const isPremium = account?.subscriptionType === "PREMIUM";
    const avatarSrc = userProfileDraft?.image || account?.image || account?.userProfile?.image;
    const displayName = userProfileDraft?.displayName || account?.displayName || account?.username || "";
    const expiryText = account?.premiumUntil
        ? new Date(account.premiumUntil).toLocaleDateString("vi-VN")
        : "";

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
            setPremiumMsg({ type: "error", text: "Invalid duration" });
            return;
        }
        setPremiumLoading(true);
        setPremiumMsg(null);
        try {
            await onUpgradePremium(account, days);
            setPremiumMsg({ type: "success", text: `Premium updated for ${days} days` });
        } catch (error) {
            setPremiumMsg({ type: "error", text: error?.message || "Premium update failed" });
        } finally {
            setPremiumLoading(false);
        }
    };

    const handlePremiumDowngrade = async () => {
        if (!account || !onDowngradePremium) return;
        if (!window.confirm(`Downgrade ${account.username} to FREE?`)) return;
        setPremiumLoading(true);
        setPremiumMsg(null);
        try {
            await onDowngradePremium(account);
            setPremiumMsg({ type: "success", text: "Account downgraded to FREE" });
        } catch (error) {
            setPremiumMsg({ type: "error", text: error?.message || "Downgrade failed" });
        } finally {
            setPremiumLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] p-0 sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="px-6 pt-6">
                        {t("admin.accessControl.accounts.details")}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(92vh-76px)] px-6 pb-6">
                    {!account ? (
                        <p className="text-sm text-muted-foreground">
                            {t("admin.accessControl.accounts.selectAccount")}
                        </p>
                    ) : loading ? (
                        <div className="space-y-3 pr-3">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4 pr-3">
                            <div className="rounded-md border bg-muted/20 p-4">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                                    <div className="flex min-w-0 items-center gap-4">
                                        <UserAvatar
                                            src={avatarSrc}
                                            name={displayName || account.email}
                                            premium={isPremium}
                                            size="lg"
                                            className="h-16 w-16 text-lg"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-lg font-semibold">{displayName}</p>
                                            <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{account.email}</span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">@{account.username}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-md border bg-background/80 p-3">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <span className="text-xs font-medium uppercase text-muted-foreground">Account access</span>
                                            <Badge variant={accountEnabledDraft ? "green" : "red"}>
                                                {accountEnabledDraft ? t("admin.accessControl.accounts.active") : t("admin.accessControl.accounts.locked")}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">
                                                {t("admin.accessControl.accounts.roles")}
                                            </Label>
                                            <Select
                                                value={accountRoleDraft}
                                                onChange={(e) => onRoleChange(e.target.value)}
                                                className="h-9"
                                            >
                                                <option value="">{t("admin.accessControl.accounts.selectRole")}</option>
                                                {roles.map((role) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-h-5">
                                        {(saveMessage || saveError) && (
                                            <p className={`text-xs ${saveError ? "text-red-600" : "text-green-600"}`}>
                                                {saveError || saveMessage}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
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
                                        <Button
                                            size="sm"
                                            onClick={onSaveRoles}
                                            disabled={loading || accountRolesSaving || !hasRolesChanges}
                                        >
                                            <Save className="mr-1 h-4 w-4" />
                                            {accountRolesSaving ? t("admin.accessControl.accounts.saving") : t("admin.accessControl.accounts.save")}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Section
                                title="Subscription"
                                icon={Crown}
                                action={account.subscriptionType === "PREMIUM" ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handlePremiumDowngrade}
                                        disabled={premiumLoading}
                                    >
                                        Downgrade
                                    </Button>
                                ) : null}
                            >
                                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                                        <InfoItem label="Plan" value={account.subscriptionType || "FREE"} />
                                        <InfoItem label="Expires" value={expiryText || "-"} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {DURATION_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.days}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDays(preset.days);
                                                        setCustomDays("");
                                                    }}
                                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                                        selectedDays === preset.days && !customDays
                                                            ? "border-amber-500 bg-amber-500 text-white"
                                                            : "border-border bg-background text-muted-foreground hover:border-amber-400 hover:text-foreground"
                                                    }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="3650"
                                                placeholder="Custom days"
                                                value={customDays}
                                                onChange={(e) => {
                                                    setCustomDays(e.target.value);
                                                    setSelectedDays(null);
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handlePremiumUpgrade}
                                                disabled={premiumLoading || !(customDays || selectedDays)}
                                            >
                                                <Crown className="mr-1 h-4 w-4" />
                                                {account.subscriptionType === "PREMIUM" ? "Extend" : "Upgrade"}
                                            </Button>
                                        </div>
                                        {premiumMsg && (
                                            <p className={`text-xs ${premiumMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                                {premiumMsg.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Section>

                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                                    {t("admin.accessControl.common.close")}
                                </Button>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
