import React from "react";
import { Download, ExternalLink, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "json", "xml", "log", "rtf"]);
const OFFICE_EXTENSIONS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"]);

function getExtension(name = "") {
  const cleanName = String(name).split("?")[0].split("#")[0];
  if (!cleanName.includes(".")) return "";
  return cleanName.split(".").pop().toLowerCase();
}

function getPreviewKind(item) {
  const extension = getExtension(item?.name);
  const mimeType = String(item?.type || item?.mimeType || "").toLowerCase();

  if (mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(extension)) return "image";
  if (mimeType.startsWith("video/") || VIDEO_EXTENSIONS.has(extension)) return "video";
  if (mimeType.startsWith("audio/") || AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (mimeType === "application/pdf" || extension === "pdf") return "iframe";
  if (mimeType.startsWith("text/") || TEXT_EXTENSIONS.has(extension)) return "iframe";
  if (OFFICE_EXTENSIONS.has(extension)) return "office";
  return "unsupported";
}

function getOfficeViewerUrl(url) {
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
}

export default function DocumentPreviewModal({ item, previewUrl, loading, onClose }) {
  const open = Boolean(item);
  const kind = getPreviewKind(item);
  const title = item?.name || "Document preview";

  const handleOpenNewTab = () => {
    if (previewUrl) window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogContent className="flex h-[88vh] max-w-[min(1120px,94vw)] flex-col gap-3 overflow-hidden p-4">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="truncate text-base">{title}</DialogTitle>
          <DialogDescription>
            Preview
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/20">
          {loading || !previewUrl ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading preview...
            </div>
          ) : kind === "image" ? (
            <div className="flex h-full items-center justify-center overflow-auto bg-background">
              <img src={previewUrl} alt={title} className="max-h-full max-w-full object-contain" />
            </div>
          ) : kind === "video" ? (
            <video src={previewUrl} controls className="h-full w-full bg-black" />
          ) : kind === "audio" ? (
            <div className="flex h-full items-center justify-center p-6">
              <audio src={previewUrl} controls className="w-full max-w-xl" />
            </div>
          ) : kind === "iframe" || kind === "office" ? (
            <iframe
              src={kind === "office" ? getOfficeViewerUrl(previewUrl) : previewUrl}
              title={title}
              className="h-full w-full bg-background"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <FileQuestion className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Preview is not available for this file type.</p>
                <p className="mt-1 text-xs text-muted-foreground">Open it in a new tab or download it instead.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:justify-between sm:space-x-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenNewTab} disabled={!previewUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button asChild disabled={!previewUrl}>
              <a href={previewUrl || "#"} download={title}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
