import React from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import AccountManagementTab from "@/features/admin/components/AccountManagementTab";
import { borderColors } from "@/theme/colors";

export default function AdminAccessControl() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className={`shrink-0 ${borderColors.default} border-b bg-background z-10`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold">{t("admin.accessControl.title")}</h1>
        </div>
      </div>

      {/* Page Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <AccountManagementTab />
        </div>
      </div>
    </div>
  );
}


