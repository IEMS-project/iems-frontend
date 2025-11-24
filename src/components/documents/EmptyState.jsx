import React from "react";
import { FolderPlus } from "lucide-react";
import { FileUploadDialog } from "./FileUploadDialog";

export default function EmptyState({ search, onUpload }) {
  if (search) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-8 text-center">
        No files or folders found matching "{search}"
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <FolderPlus className="mx-auto size-14 opacity-50" />
        <h2 className="text-muted-foreground">This folder is empty.</h2>
        <div>
          <FileUploadDialog onUpload={onUpload} />
        </div>
      </div>
    </div>
  );
}





