import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function PermissionFormDialog({
    open,
    onOpenChange,
    mode,
    form,
    onFormChange,
    onSubmit,
    submitting,
    error,
}) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" 
                            ? t("admin.accessControl.permissions.createPermission")
                            : t("admin.accessControl.permissions.updatePermission")}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t("admin.accessControl.permissions.code")}</Label>
                        <Input
                            value={form.code}
                            disabled={mode === "edit"}
                            onChange={(e) =>
                                onFormChange({ ...form, code: e.target.value })
                            }
                            placeholder={t("admin.accessControl.permissions.codePlaceholder")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t("admin.accessControl.permissions.name")}</Label>
                        <Input
                            value={form.name}
                            onChange={(e) =>
                                onFormChange({ ...form, name: e.target.value })
                            }
                            placeholder={t("admin.accessControl.permissions.namePlaceholder")}
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("admin.accessControl.permissions.cancel")}
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting}>
                        {submitting ? t("admin.accessControl.permissions.saving") : t("admin.accessControl.permissions.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
