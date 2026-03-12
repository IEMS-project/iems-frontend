import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Skeleton from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function RoleFormDialog({
    open,
    onOpenChange,
    mode,
    form,
    onFormChange,
    onSubmit,
    loading,
    submitting,
    error,
}) {
    const { t } = useTranslation();

    const handleOpenChange = (isOpen) => {
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? t("admin.accessControl.roles.createRole") : t("admin.accessControl.roles.editRole")}
                    </DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("admin.accessControl.roles.roleCode")}</Label>
                            <Input
                                value={form.code}
                                disabled={mode === "edit"}
                                onChange={(e) =>
                                    onFormChange({ ...form, code: e.target.value })
                                }
                                placeholder={t("admin.accessControl.roles.roleCodePlaceholder")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("admin.accessControl.roles.roleName")}</Label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    onFormChange({ ...form, name: e.target.value })
                                }
                                placeholder={t("admin.accessControl.roles.roleNamePlaceholder")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("admin.accessControl.roles.description")}</Label>
                            <Textarea
                                value={form.description}
                                rows={4}
                                onChange={(e) =>
                                    onFormChange({ ...form, description: e.target.value })
                                }
                                placeholder={t("admin.accessControl.roles.descriptionPlaceholder")}
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                )}
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        {t("admin.accessControl.common.close")}
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting || loading}>
                        {submitting ? t("admin.accessControl.roles.saving") : t("admin.accessControl.roles.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


