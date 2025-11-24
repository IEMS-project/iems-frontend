import React from "react";
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
  if (!selectedItem) return null;

  return (
    <div className="relative w-80 border-s py-6">
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
          <h2 className="text-foreground text-center">{selectedItem.name}</h2>
        </div>
        <div>
          <h3 className="text-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
            Info
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Type</span>
              <span className="text-foreground text-sm capitalize">
                {selectedItem.type === "folder" ? "Folder" : selectedItem.type || "File"}
              </span>
            </div>
            {selectedItem.type === "file" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Size</span>
                <span className="text-foreground text-sm">
                  {humanSize(selectedItem.size)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Owner</span>
              <span className="text-foreground text-sm">
                {selectedItem.ownerName || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Location</span>
              <span className="text-sm">
                {currentPath.length > 0
                  ? `My Files/${currentPath.map((f) => f.name).join("/")}`
                  : "My Files"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Modified</span>
              <span className="text-foreground text-sm">
                {formatDate(selectedItem.updatedAt || selectedItem.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Created</span>
              <span className="text-foreground text-sm">
                {formatDate(selectedItem.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
            Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">File Sharing</span>
              <Switch checked={selectedItem.permission === "PUBLIC"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm">Favorite</span>
              <Switch checked={!!selectedItem.favorite} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





