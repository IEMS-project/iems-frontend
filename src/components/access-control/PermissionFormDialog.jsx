import React from "react";
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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Tạo permission mới" : "Cập nhật permission"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Code</Label>
                        <Input
                            value={form.code}
                            disabled={mode === "edit"}
                            onChange={(e) =>
                                onFormChange({ ...form, code: e.target.value })
                            }
                            placeholder="VD: PROJECT_VIEW"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tên permission</Label>
                        <Input
                            value={form.name}
                            onChange={(e) =>
                                onFormChange({ ...form, name: e.target.value })
                            }
                            placeholder="Tên hiển thị"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
