import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Component ConfirmDialog có thể tái sử dụng cho các hành động cần xác nhận
 * @param {boolean} open - Trạng thái mở/đóng dialog
 * @param {function} onOpenChange - Callback khi trạng thái mở/đóng thay đổi
 * @param {function} onConfirm - Callback khi người dùng xác nhận
 * @param {string} title - Tiêu đề dialog
 * @param {string} description - Mô tả chi tiết
 * @param {string} confirmText - Text của nút xác nhận
 * @param {string} cancelText - Text của nút hủy
 * @param {string} variant - Variant của nút xác nhận ("default" | "destructive")
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default",
}) {
  const { t } = useTranslation();
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || t("ui.confirmDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>{description || t("ui.confirmDialog.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText || t("ui.confirmDialog.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText || t("ui.confirmDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}














