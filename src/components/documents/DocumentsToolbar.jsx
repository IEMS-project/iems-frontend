import React from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus, Trash2, FolderInput } from "lucide-react";
import { FileUploadDialog } from "./FileUploadDialog";

export default function DocumentsToolbar({
  onUpload,
  onCreateFolder,
  selectedCount = 0,
  onBatchDelete,
  onBatchMove,
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Tài liệu</h1>
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedCount} mục đã chọn
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {selectedCount > 0 ? (
          <>
            <Button onClick={onBatchMove} variant="outline" size="sm">
              <FolderInput className="h-4 w-4" />
              Di chuyển
            </Button>
            <Button onClick={onBatchDelete} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              Xóa ({selectedCount})
            </Button>
          </>
        ) : (
          <>
            <FileUploadDialog onUpload={onUpload} />
            <Button onClick={onCreateFolder} variant="outline">
              <FolderPlus className="h-4 w-4" />
              Thư mục mới
            </Button>
          </>
        )}
      </div>
    </div>
  );
}






