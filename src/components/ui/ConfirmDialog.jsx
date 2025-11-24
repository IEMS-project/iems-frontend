import React from "react";
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
 * @param {string} confirmText - Text của nút xác nhận (mặc định: "Xác nhận")
 * @param {string} cancelText - Text của nút hủy (mặc định: "Hủy")
 * @param {string} variant - Variant của nút xác nhận ("default" | "destructive")
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Xác nhận",
  description = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "default",
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}












