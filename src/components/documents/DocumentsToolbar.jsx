import React from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { FileUploadDialog } from "./FileUploadDialog";

export default function DocumentsToolbar({ onUpload, onCreateFolder }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
      </div>
      <div className="flex items-center justify-between gap-2">
        <FileUploadDialog onUpload={onUpload} />
        <Button onClick={onCreateFolder} variant="outline">
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
      </div>
    </div>
  );
}

