import React, { useState } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import AccountManagementTab from "@/features/admin/components/AccountManagementTab";
import RolesPermissionsTab from "@/features/admin/components/RolesPermissionsTab";
import { borderColors, bgColors } from "@/theme/colors";

export default function AdminAccessControl() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState("accounts");

  const tabs = [
    { id: "accounts", label: t("admin.accessControl.tabs.accounts") },
    { id: "roles-permissions", label: t("admin.accessControl.tabs.roles") },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Tab Navigation - Fixed */}
      <div className={`shrink-0 ${borderColors.default} border-b bg-background z-10`}>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          {/* Page Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold truncate">{t("admin.accessControl.title")}</h1>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`
                    whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors
                    ${isActive
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {currentTab === "accounts" && <AccountManagementTab />}
          {currentTab === "roles-permissions" && <RolesPermissionsTab />}
        </div>
      </div>
    </div>
  );
}


