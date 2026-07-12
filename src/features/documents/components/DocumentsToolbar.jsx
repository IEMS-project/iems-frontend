import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e4e8ee] dark:border-border bg-[#f8fafd] dark:bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1f1f1f] dark:text-foreground">{t('documents.title')}</h1>
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {t('documents.toolbar.selected', { count: selectedCount })}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {selectedCount > 0 ? (
          <>
            <Button onClick={onBatchMove} variant="outline" size="sm" className="gap-2 rounded-full border-[#d0d7e2] dark:border-border bg-white dark:bg-secondary/40">
              <FolderInput className="h-4 w-4" />
              {t('documents.toolbar.move')}
            </Button>
            <Button onClick={onBatchDelete} variant="destructive" size="sm" className="gap-2 rounded-full">
              <Trash2 className="h-4 w-4" />
              {t('documents.toolbar.delete')} ({selectedCount})
            </Button>
          </>
        ) : (
          <>
            <FileUploadDialog onUpload={onUpload} />
            <Button onClick={onCreateFolder} variant="outline" className="gap-2 rounded-full border-[#d0d7e2] dark:border-border bg-white dark:bg-secondary/40">
              <FolderPlus className="h-4 w-4" />
              {t('documents.toolbar.newFolder')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}









