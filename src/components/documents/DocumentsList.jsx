import React from "react";
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

export default function DocumentsList({
  sortedItems,
  selectedItems,
  selectedItem,
  onItemClick,
  onToggleSelectAll,
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

  return (
    <>
      {/* Table Header */}
      <div className="border-b bg-muted/50 flex items-center p-2 lg:p-4 text-sm font-medium text-muted-foreground">
        <div className="flex min-w-0 items-center space-x-4 flex-1">
          <Checkbox
            checked={selectedItems.size === sortedItems.length && sortedItems.length > 0}
            onCheckedChange={onToggleSelectAll}
          />
          <div className="w-5 shrink-0"></div>
          <div className="min-w-0 flex-1">Tên</div>
        </div>
        <div className="text-muted-foreground flex items-center space-x-4 text-sm">
          <span className="hidden w-24 text-right lg:inline">Ngày tạo</span>
          <span className="hidden w-20 text-right lg:inline">Kích thước</span>
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
              "hover:bg-muted flex cursor-pointer items-center justify-between border-b p-2 lg:p-4",
              selectedItem?.id === item.id && "bg-muted"
            )}
            onClick={() => onItemClick(item)}
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
                    {itemIsOwner && (
                      <>
                        <DropdownMenuItem onClick={() => onRename(item, item.type)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPermission(item, item.type)}>
                          <Lock className="mr-2 h-4 w-4" />
                          Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onShare(item, item.type)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSharedUsers(item, item.type)}>
                          <Users className="mr-2 h-4 w-4" />
                          Shared Users
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onMove(item, item.type)}>
                          <Move className="mr-2 h-4 w-4" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(item, item.type)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    {!itemIsOwner && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No edit permissions
                      </div>
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

