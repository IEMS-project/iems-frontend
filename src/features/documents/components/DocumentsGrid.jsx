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

export default function DocumentsGrid({
  sortedItems,
  selectedItems,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
  onShowDetails,
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

  if (sortedItems.length === 0) {
    return null;
  }

  const folderItems = sortedItems.filter((item) => item.type === "folder");
  const fileItems = sortedItems.filter((item) => item.type === "file");
  const hasMixedTypes = folderItems.length > 0 && fileItems.length > 0;

  const renderGridSection = (items, sectionLabel) => {
    if (!items.length) return null;

    return (
      <div className="space-y-3">
        {hasMixedTypes && (
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {sectionLabel}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const itemIsOwner = isOwner(item);
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col rounded-xl border border-[#d8e2f0] bg-white p-3 transition-colors hover:border-[#8ab4f8] hover:bg-[#f8fafd]",
                  selectedItem?.id === item.id && "border-[#8ab4f8] bg-[#edf3fe]",
                  selectedItems.has(item.id) && "border-[#8ab4f8]"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleItemSelection(item.id, e);
                    }}
                    className="absolute left-2 top-2 z-10"
                  />
                  <div className="mx-auto">
                    {item.type === "folder"
                      ? getFolderIcon("h-12 w-12")
                      : getFileIcon(item.name, "h-12 w-12")}
                  </div>
                  <div className="absolute right-2 top-2 z-10 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item, item.type);
                      }}
                      disabled={isTrashMode}
                    >
                      {item.favorite ? (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <Star className="h-3 w-3" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontalIcon className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onShowDetails(item)}>
                          <Info className="mr-2 h-4 w-4" />
                          {t("documents.contextMenu.details")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isTrashMode ? (
                          <>
                            <DropdownMenuItem onClick={() => onRestore(item)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {t("documents.contextMenu.restore")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onPermanentDelete(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("documents.contextMenu.permanentDelete")}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            {itemIsOwner && (
                              <>
                                <DropdownMenuItem onClick={() => onRename(item, item.type)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t("documents.contextMenu.rename")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onShare(item, item.type)}>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  {t("documents.contextMenu.share")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onMove(item, item.type)}>
                                  <Move className="mr-2 h-4 w-4" />
                                  {t("documents.contextMenu.move")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(item, item.type)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("documents.contextMenu.delete")}
                                </DropdownMenuItem>
                              </>
                            )}
                            {!itemIsOwner && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t("documents.contextMenu.noPermission")}
                              </div>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      e.stopPropagation();
                      onToggleItemSelection(item.id, e);
                    } else {
                      onItemClick(item);
                    }
                  }}
                  onDoubleClick={() => onItemDoubleClick(item)}
                >
                  <div className="flex items-center gap-1 truncate text-sm font-medium">
                    <span>{item.name}</span>
                    {item.type === "folder" && (
                      <>
                        {item.permission === "PUBLIC" ? (
                          <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                        ) : (
                          <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.type === "folder" ? t("documents.fileDetail.folder") : humanSize(item.size)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(item.date)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4">
      {renderGridSection(folderItems, t("documents.grid.folders"))}
      {renderGridSection(fileItems, t("documents.grid.files"))}
    </div>
  );
}

