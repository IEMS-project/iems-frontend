import React from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  Share2,
  Trash2,
  Edit,
  Lock,
  Globe,
  Move,
  Info,
  MoreHorizontalIcon,
  RotateCcw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function DocumentsList({
  sortedItems,
  selectedItems,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
  onShowDetails,
  onPreview,
  onToggleSelectAll,
  onToggleItemSelection,
  onToggleFavorite,
  onRename,
  onShare,
  onMove,
  onDelete,
  isOwner,
  filterMode,
  onRestore,
  onPermanentDelete,
}) {
  const { t } = useTranslation();
  const isTrashMode = filterMode === "trash";

  return (
    <>
      {/* Table Header */}
      <div className="flex items-center border-b border-[#dde3ea] dark:border-border bg-[#f8fafd] dark:bg-muted/35 p-2 text-sm font-medium text-muted-foreground lg:p-4">
        <div className="flex min-w-0 items-center space-x-4 flex-1">
          <Checkbox
            checked={selectedItems.size === sortedItems.length && sortedItems.length > 0}
            onCheckedChange={onToggleSelectAll}
          />
          <div className="w-5 shrink-0"></div>
          <div className="min-w-0 flex-1">{t('documents.list.name')}</div>
        </div>
        <div className="text-muted-foreground flex items-center space-x-4 text-sm">
          <span className="hidden w-24 text-right lg:inline">{t('documents.list.dateCreated')}</span>
          <span className="hidden w-20 text-right lg:inline">{t('documents.list.size')}</span>
          <div className="w-9"></div>
          <div className="w-9"></div>
        </div>
      </div>
      {sortedItems.map((item) => {
        const itemIsOwner = isOwner(item);
        return (
          <div
            key={item.id}
            className={cn(
              "flex cursor-pointer items-center justify-between border-b border-[#eef2f7] dark:border-border p-2 transition-colors hover:bg-[#f8fafd] dark:hover:bg-muted/30 lg:p-4",
              selectedItem?.id === item.id && "bg-[#edf3fe] dark:bg-primary/20",
              selectedItems.has(item.id) && "border-[#8ab4f8] dark:border-primary bg-[#edf3fe] dark:bg-primary/20"
            )}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                // Ctrl+Click: toggle selection
                onToggleItemSelection(item.id, e);
              } else {
                onItemClick(item);
              }
            }}
            onDoubleClick={() => onItemDoubleClick(item)}
          >
            <div className="flex min-w-0 items-center space-x-4 flex-1">
              <Checkbox
                checked={selectedItems.has(item.id)}
                onClick={(e) => onToggleItemSelection(item.id, e)}
              />
              <div className="w-5 shrink-0">
                {item.type === "folder" ? getFolderIcon() : getFileIcon(item.name)}
              </div>
              <div className="min-w-0 flex-1 truncate flex items-center gap-2">
                <span>{item.name}</span>
                {item.type === "folder" && (
                  <div className="shrink-0">
                    {item.permission === "PUBLIC" ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-muted-foreground flex items-center space-x-4 text-sm">
              <span className="hidden w-24 text-right lg:inline">
                {formatDate(item.date)}
              </span>
              <span className="hidden w-20 text-right lg:inline">
                {item.type === "file" ? humanSize(item.size) : "-"}
              </span>
              <div className="w-9">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item, item.type);
                  }}
                  disabled={isTrashMode}
                >
                  {item.favorite ? (
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="w-9">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isTrashMode && item.type === "file" && (
                      <DropdownMenuItem onClick={() => onPreview(item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("ui.common.view", "View")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onShowDetails(item)}>
                      <Info className="mr-2 h-4 w-4" />
                      {t("documents.contextMenu.details")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isTrashMode ? (
                      <>
                        <DropdownMenuItem onClick={() => onRestore(item)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {t('documents.contextMenu.restore')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onPermanentDelete(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('documents.contextMenu.permanentDelete')}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {itemIsOwner && (
                          <>
                            <DropdownMenuItem onClick={() => onRename(item, item.type)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('documents.contextMenu.rename')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onShare(item, item.type)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              {t('documents.contextMenu.share')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onMove(item, item.type)}>
                              <Move className="mr-2 h-4 w-4" />
                              {t('documents.contextMenu.move')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(item, item.type)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('documents.contextMenu.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                        {!itemIsOwner && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {t('documents.contextMenu.noPermission')}
                          </div>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

