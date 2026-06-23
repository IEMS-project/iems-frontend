import React from "react";
import { useTranslation } from "react-i18next";
import { Bell, Languages, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SectionHeader from "@/components/ui/SectionHeader";
import { Switch } from "@/components/ui/switch";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import NotificationPreferences from "@/features/profile/components/NotificationPreferences";
import { useTheme } from "@/theme/ThemeProvider";

export default function SettingsPage() {
	const { t } = useTranslation();
	const { theme, setTheme } = useTheme();
	const isDark = theme === "dark";

	return (
		<div className="w-full space-y-6">
			<h1 className="text-2xl font-semibold text-foreground">
				{t("settingsPage.title")}
			</h1>

			<Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
				<CardHeader className="pb-3">
					<SectionHeader
						icon={isDark ? Moon : Sun}
						title={t("settingsPage.appearance")}
						description={t("settingsPage.appearanceDescription")}
						action={
							<Switch
								checked={isDark}
								onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
								aria-label={t("sidebar.darkMode")}
							/>
						}
					/>
				</CardHeader>
			</Card>

			<Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
				<CardHeader className="pb-3">
					<SectionHeader
						icon={Languages}
						title={t("settingsPage.language")}
						description={t("settingsPage.languageDescription")}
						action={<LanguageSwitcher showLabel />}
					/>
				</CardHeader>
			</Card>

			<Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
				<CardHeader className="pb-3">
					<SectionHeader
						icon={Bell}
						title={t("profile.notificationSettings.title")}
						description={t("profile.notificationSettings.emailDesc")}
					/>
				</CardHeader>
				<CardContent className="pt-0">
					<NotificationPreferences showHeader={false} />
				</CardContent>
			</Card>
		</div>
	);
}
