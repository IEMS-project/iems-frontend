import React from "react";
import { Folder, File, FileTextIcon } from "lucide-react";

export function getFileIcon(fileName, size = "h-5 w-5") {
  if (!fileName) return <File className={`${size} text-gray-500`} />;

  const ext = fileName.split(".").pop()?.toLowerCase();

  // PDF
  if (ext === "pdf") {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-red-600 text-xs font-bold text-white`}
      >
        <FileTextIcon className="size-3" />
      </div>
    );
  }

  // Word
  if (["doc", "docx"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-blue-600 text-xs font-bold text-white`}
      >
        W
      </div>
    );
  }

  // Excel
  if (["xls", "xlsx"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-green-600 text-xs font-bold text-white`}
      >
        X
      </div>
    );
  }

  // PowerPoint
  if (["ppt", "pptx"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-orange-600 text-xs font-bold text-white`}
      >
        P
      </div>
    );
  }

  // Images
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-blue-500 text-xs font-bold text-white`}
      >
        Img
      </div>
    );
  }

  // Videos
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-purple-600 text-xs font-bold text-white`}
      >
        Vid
      </div>
    );
  }

  // Audio
  if (["mp3", "wav", "flac", "aac", "ogg", "m4a"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-green-600 text-xs font-bold text-white`}
      >
        ♪
      </div>
    );
  }

  // Archives
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-yellow-600 text-xs font-bold text-white`}
      >
        Zip
      </div>
    );
  }

  // Code files
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "json",
      "xml",
      "py",
      "java",
      "cpp",
      "c",
      "php",
      "rb",
      "go",
      "rs",
    ].includes(ext)
  ) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-emerald-600 text-xs font-bold text-white`}
      >
        Code
      </div>
    );
  }

  // Text files
  if (["txt", "md", "rtf"].includes(ext)) {
    return (
      <div
        className={`flex ${size} items-center justify-center rounded bg-gray-600 text-xs font-bold text-white`}
      >
        Txt
      </div>
    );
  }

  // Default file icon
  return <File className={`${size} text-gray-500`} />;
}

export function getFolderIcon(size = "h-5 w-5") {
  return <Folder className={`${size} text-yellow-600`} />;
}






