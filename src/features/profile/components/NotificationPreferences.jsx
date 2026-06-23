import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userService } from "@/features/profile/api/userService";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function NotificationPreferences({ showHeader = true }) {
    const { t } = useTranslation();
    const [prefs, setPrefs] = useState({
        emailAssigned: true,
        emailMemberAdded: true,
        emailDueSoon: true,
        inAppToast: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // key being saved

    const SETTINGS = [
        {
            key: "emailAssigned",
            icon: Mail,
            label: t('profile.notificationSettings.taskAssigned'),
            description: t('profile.notificationSettings.emailDesc'),
            color: "text-indigo-500",
        },
        {
            key: "emailMemberAdded",
            icon: Mail,
            label: t('profile.notificationSettings.projectJoined'),
            description: t('profile.notificationSettings.emailDesc'),
            color: "text-emerald-500",
        },
        {
            key: "emailDueSoon",
            icon: Mail,
            label: t('profile.notificationSettings.taskDueSoon'),
            description: t('profile.notificationSettings.emailDesc'),
            color: "text-amber-500",
        },
    ];

    useEffect(() => {
        userService.getNotificationPreferences()
            .then(data => setPrefs(prev => ({ ...prev, ...data })))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    async function handleToggle(key) {
        const newVal = !prefs[key];
        setPrefs(prev => ({ ...prev, [key]: newVal }));
        setSaving(key);
        try {
            await userService.updateNotificationPreferences({ ...prefs, [key]: newVal });
            toast.success(t('profile.notificationSettings.saveSuccess'));
        } catch (e) {
            setPrefs(prev => ({ ...prev, [key]: !newVal }));
            toast.error(t('profile.messages.updateFailed'));
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showHeader && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">{t('profile.notificationSettings.title')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('profile.notificationSettings.emailDesc')}
                    </p>
                </div>
            )}

            {/* Email section */}
            <div className="overflow-hidden rounded-none border-0 bg-card">
                <div className="border-b border-border bg-muted/50 px-0 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('profile.notificationSettings.emailTitle')}
                    </p>
                </div>
                <div className="divide-y divide-border">
                    {SETTINGS.map(({ key, icon: Icon, label, description, color }) => (
                        <div key={key} className="flex items-center gap-4 py-4 bg-card">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted ${color}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                            </div>
                            <Switch
                                checked={Boolean(prefs[key])}
                                disabled={saving === key}
                                onCheckedChange={() => handleToggle(key)}
                                aria-label={label}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
