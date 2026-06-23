import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock3, FolderTree, Globe, X, Folder as FolderIcon, File as FileIcon } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { documentService } from "@/features/projects/api/documentService";
import { userService } from "@/features/profile/api/userService";
import { formatBytes, formatDate } from "@/lib/utils";

// Helper for project document folder icons
const getProjectFolderIcon = () => (
  <FolderIcon className="h-5 w-5 text-blue-400 fill-blue-100 dark:fill-blue-900" />
);

const getProjectFileIcon = () => (
  <FileIcon className="h-5 w-5 text-gray-400" />
);

const getFriendlyFileType = (mimeType, isFolder, t) => {
    if (isFolder) return t("projectDocuments.folder", "Folder");
    if (!mimeType) return t("projectDocuments.file", "File");
    
    const type = mimeType.toLowerCase();
    if (type.includes("pdf")) return "PDF Document";
    if (type.includes("word") || type.includes("officedocument.wordprocessingml") || type.includes("msword")) return "Word Document";
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("officedocument.spreadsheetml")) return "Excel Spreadsheet";
    if (type.includes("presentation") || type.includes("powerpoint") || type.includes("officedocument.presentationml")) return "PowerPoint Presentation";
    if (type.includes("image")) return "Image";
    if (type.includes("text/plain")) return "Text Document";
    if (type.includes("zip") || type.includes("rar") || type.includes("compressed")) return "Archive";
    if (type.includes("video")) return "Video";
    if (type.includes("audio")) return "Audio";
    
    const parts = type.split("/");
    const sub = parts[parts.length - 1];
    return sub.charAt(0).toUpperCase() + sub.slice(1);
};

const panelClassName = "relative hidden h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm xl:col-span-4 xl:flex 2xl:col-span-3";

export default function ProjectDocumentDetailPanel({
  selectedItem,
  projectId,
  onClose,
  documents = [],
}) {
  const { t } = useTranslation();
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [backendActivities, setBackendActivities] = useState([]);

  useEffect(() => {
    if (!selectedItem || !projectId) return;

    const loadOwnerInfo = async () => {
      try {
        const accountId = selectedItem.uploadedBy;
        if (accountId) {
          const response = await userService.getUserByAccountId(accountId).catch(() => null);
          const rawUser = response?.data || response;
          if (rawUser && (rawUser.firstName || rawUser.lastName)) {
            rawUser.fullName = `${rawUser.firstName || ""} ${rawUser.lastName || ""}`.trim();
          }
          setOwnerInfo(rawUser || { fullName: t("ui.common.unknown", "Unknown"), email: "N/A" });
        } else {
          setOwnerInfo({ fullName: t("ui.common.unknown", "Unknown"), email: "N/A" });
        }
      } catch (err) {
        console.error("Error loading owner info:", err);
        setOwnerInfo({ fullName: t("ui.common.unknown", "Unknown"), email: "N/A" });
      }
    };

    const loadActivities = async () => {
      try {
        const data = await documentService.getItemActivities(
          projectId, 
          selectedItem.id, 
          selectedItem.isFolder ? "FOLDER" : "FILE"
        );
        setBackendActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading activity history:", error);
        setBackendActivities([]);
      }
    };

    loadOwnerInfo();
    loadActivities();
  }, [selectedItem, projectId, t]);

  const locationText = useMemo(() => {
    if (!selectedItem || !documents.length) return t("projectDocuments.title", "Project Documents");
    
    const path = [];
    let curr = selectedItem.parentId;
    while (curr) {
        const folder = documents.find(d => d.id === curr);
        if (folder) {
            path.unshift(folder.fileName);
            curr = folder.parentId;
        } else { break; }
    }
    return (path.length > 0 ? (path.join("/") === "" ? t("projectDocuments.title") : t("projectDocuments.title") + "/" + path.join("/")) : t("projectDocuments.title"));
  }, [selectedItem, documents, t]);

  if (!selectedItem) return null;

  const activityItems = (backendActivities || []).map((entry) => {
    const payload = entry?.payload && typeof entry.payload === "object" ? entry.payload : {};
    const label = entry?.actionKey
      ? t(entry.actionKey, {
          ...payload,
          defaultValue: entry.message || t("projectDocuments.activityUpdated", "Document updated"),
        })
      : (entry.message || t("projectDocuments.activityUpdated"));

    return {
      key: entry.id,
      label,
      value: formatDate(entry.timestamp, "PP"),
      actorName: entry.actorName,
      actorEmail: entry.actorEmail,
      timestamp: entry.timestamp ? new Date(entry.timestamp).getTime() : 0,
    };
  });

  const ownerDisplayName = ownerInfo?.fullName || ownerInfo?.firstName || ownerInfo?.lastName || t("ui.common.unknown", "Unknown");

  return (
    <aside className={`${panelClassName} animate-in slide-in-from-right duration-300`}>
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              {selectedItem.isFolder ? getProjectFolderIcon() : getProjectFileIcon()}
              <Badge variant={selectedItem.isFolder ? "blue" : "gray"}>
                {selectedItem.isFolder ? t("projectDocuments.folder", "Folder") : t("projectDocuments.file", "File")}
              </Badge>
            </div>
            <h2 className="line-clamp-2 text-sm font-semibold text-foreground">
              {selectedItem.fileName}
            </h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="-mt-1 h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden px-4 pb-4 pt-3 no-scrollbar">
        <TabsList className="grid h-9 w-full grid-cols-2 bg-muted mb-4 shadow-sm border border-border p-1">
          <TabsTrigger value="details" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">{t("ui.common.details", "Details")}</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">{t("ui.common.activity", "Activity")}</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <TabsContent value="details" className="mt-0 space-y-4 outline-none">
            {/* Owner Section Styled exactly like Drive's PEOPLE WITH ACCESS */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center justify-between">
                {t("projectDocuments.owner", "Owner").toUpperCase()}
              </h3>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border">
                <Avatar name={ownerDisplayName} size="sm" className="shrink-0 ring-2 ring-background" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold truncate text-foreground">{ownerDisplayName}</p>
                    <span className="text-[10px] text-muted-foreground/60 font-medium">Owner</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{ownerInfo?.email || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Overview Section Styled exactly like Drive */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                {t("projectDocuments.overview", "Overview").toUpperCase()}
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground/80 font-medium">{t("projectDocuments.type", "Type")}</span>
                  <span className="text-right text-foreground font-semibold">{getFriendlyFileType(selectedItem.fileType, selectedItem.isFolder, t)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground/80 font-medium">{t("projectDocuments.owner", "Owner")}</span>
                  <span className="text-right text-foreground font-semibold">{ownerDisplayName}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground/80 font-medium">{t("documents.fileDetail.location", "Location")}</span>
                  <span className="max-w-[180px] break-words text-right text-foreground font-semibold">{locationText}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground/80 font-medium">{t("documents.fileDetail.modified", "Modified")}</span>
                  <span className="text-right text-foreground font-semibold">{formatDate(selectedItem.updatedAt || selectedItem.createdAt, 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground/80 font-medium">{t("documents.fileDetail.created", "Created")}</span>
                  <span className="text-right text-foreground font-semibold">{formatDate(selectedItem.createdAt, 'dd/MM/yyyy')}</span>
                </div>
                {!selectedItem.isFolder && (
                  <div className="flex items-start justify-between gap-3 pt-1 border-t border-border">
                    <span className="text-muted-foreground/80 font-medium">{t("projectDocuments.columns.size", "Size")}</span>
                    <span className="text-right text-foreground font-semibold">{formatBytes(selectedItem.fileSize)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Status Integrated cleanly */}
            {!selectedItem.isFolder && (
              <div className="rounded-xl border border-border bg-card p-3 shadow-sm border-l-4 border-l-blue-400">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        {t("projectDocuments.aiStatus", "AI Status").toUpperCase()}
                    </h3>
                    <Globe className="h-3 w-3 text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedItem.allowEmbedded ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
                  <span className="text-xs font-bold text-foreground">
                    {selectedItem.allowEmbedded 
                      ? (selectedItem.aiIndexed ? t("projectDocuments.indexed", "Indexed for AI") : t("projectDocuments.embedEnabled", "AI Embedding Enabled")) 
                      : t("projectDocuments.embedDisabled", "AI Embedding Disabled")}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-0 space-y-3 outline-none">
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <div key={item.key} className="rounded-xl border border-border bg-card p-3 shadow-sm hover:ring-1 hover:ring-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-bold leading-relaxed">{item.label}</p>
                      {(item.actorName || item.actorEmail) && (
                        <p className="truncate text-[10px] text-muted-foreground mt-1 font-medium bg-muted px-1.5 py-0.5 rounded inline-block">
                          {item.actorName || item.actorEmail}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] whitespace-nowrap text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded uppercase font-bold tabular-nums border border-transparent">
                        {item.value}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground/60 shadow-sm">
                <Clock3 className="w-8 h-8 mx-auto mb-2 opacity-10" />
                <p className="text-xs font-medium tracking-tight">{t("projectDocuments.noActivity", "No activity yet")}</p>
              </div>
            )}

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-[11px] text-muted-foreground shadow-inner">
              <div className="mb-2 flex items-center gap-2 font-bold text-foreground/70">
                <FolderTree className="h-4 w-4 text-blue-400" />
                {t("documents.fileDetail.location", "Location").toUpperCase()}
              </div>
              <p className="break-words text-foreground font-medium transition-colors hover:text-blue-600 cursor-default">{locationText}</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
