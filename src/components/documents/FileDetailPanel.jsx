import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { getFileIcon, getFolderIcon } from "./fileIconUtils";

function humanSize(bytes) {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function FileDetailPanel({ selectedItem, currentPath, onClose }) {
  const { t } = useTranslation();

  if (!selectedItem) return null;

  return (
    <div className="relative w-80 flex-shrink-0 border-s py-6">
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-0"
      >
        <X />
      </Button>
      <div className="space-y-6 px-4">
        <div className="flex flex-col items-center space-y-8 py-4">
          <div className="flex items-center">
            <div className="scale-[3]">
              {selectedItem.type === "folder"
                ? getFolderIcon()
                : getFileIcon(selectedItem.name)}
            </div>
          </div>
          <h2 className="text-foreground text-center break-words w-full px-2">{selectedItem.name}</h2>
        </div>
        <div>
          <h3 className="text-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
            {t('documents.fileDetail.details')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('documents.fileDetail.type')}</span>
              <span className="text-foreground text-sm capitalize">
                {selectedItem.type === "folder" ? t('documents.fileDetail.folder') : selectedItem.type || t('documents.fileDetail.file')}
              </span>
            </div>
            {selectedItem.type === "file" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">{t('documents.fileDetail.size')}</span>
                <span className="text-foreground text-sm">
                  {humanSize(selectedItem.size)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('documents.fileDetail.owner')}</span>
              <span className="text-foreground text-sm">
                {selectedItem.ownerName || t('documents.fileDetail.unknown')}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">{t('documents.fileDetail.location')}</span>
              <span className="text-sm text-foreground break-words">
                {currentPath.length > 0
                  ? `${t('documents.fileDetail.myFiles')}/${currentPath.map((f) => f.name).join("/")}`
                  : t('documents.fileDetail.myFiles')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('documents.fileDetail.modified')}</span>
              <span className="text-foreground text-sm">
                {formatDate(selectedItem.updatedAt || selectedItem.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('documents.fileDetail.created')}</span>
              <span className="text-foreground text-sm">
                {formatDate(selectedItem.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
            {t('documents.fileDetail.settings')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">{t('documents.fileDetail.shareFile')}</span>
              <Switch checked={selectedItem.permission === "PUBLIC"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">{t('documents.fileDetail.favorite')}</span>
              <Switch checked={!!selectedItem.favorite} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









