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
  Users,
  Globe,
  Move,
  MoreHorizontalIcon,
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
  onToggleItemSelection,
  onToggleFavorite,
  onRename,
  onPermission,
  onShare,
  onSharedUsers,
  onMove,
  onDelete,
  isOwner,
}) {
  const { t } = useTranslation();

  if (sortedItems.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {sortedItems.map((item) => {
        const itemIsOwner = isOwner(item);
        return (
          <div
            key={item.id}
            className={cn(
              "group relative flex flex-col rounded-lg border p-3 hover:border-primary hover:bg-muted/50 transition-colors",
              selectedItem?.id === item.id && "border-primary bg-muted",
              selectedItems.has(item.id) && " border-blue-300"
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
                    {itemIsOwner && (
                      <>
                        <DropdownMenuItem onClick={() => onRename(item, item.type)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('documents.contextMenu.rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPermission(item, item.type)}>
                          <Lock className="mr-2 h-4 w-4" />
                          {t('documents.contextMenu.permission')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onShare(item, item.type)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          {t('documents.contextMenu.share')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSharedUsers(item, item.type)}>
                          <Users className="mr-2 h-4 w-4" />
                          {t('documents.contextMenu.sharedUsers')}
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div
              className="cursor-pointer"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  // Ctrl+Click: toggle selection
                  e.stopPropagation();
                  onToggleItemSelection(item.id, e);
                } else {
                  onItemClick(item);
                }
              }}
              onDoubleClick={() => onItemDoubleClick(item)}
            >
              <div className="truncate text-sm font-medium flex items-center gap-1">
                <span>{item.name}</span>
                {item.type === "folder" && (
                  <>
                    {item.permission === "PUBLIC" ? (
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {item.type === "folder" ? "Thư mục" : humanSize(item.size)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(item.date)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

