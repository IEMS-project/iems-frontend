import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock3, FolderTree, Globe, Lock, Star, X, Shield } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { getFileIcon, getFolderIcon } from "./fileIconUtils";
import { documentService } from "@/features/documents/api/documentService";
import { userService } from "@/features/profile/api/userService";
import { getStoredTokens } from "@/lib/api";

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

function getUserName(user, fallbackText = "Unknown") {
  if (!user) return fallbackText;
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return fullName || user?.fullName || user?.name || user?.username || user?.email || fallbackText;
}

export default function FileDetailPanel({ selectedItem, currentPath, onClose, onManageAccess }) {
  const { t } = useTranslation();
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [userDirectory, setUserDirectory] = useState([]);
  const [backendActivities, setBackendActivities] = useState([]);

  // Load owner and shared users info
  useEffect(() => {
    if (!selectedItem) return;

    const loadAccessInfo = async () => {
      try {
        // Load user directory and current user profile in parallel
        const [usersDir, myProfile] = await Promise.all([
          userService.getUsersForSharing().catch(() => []),
          userService.getMyProfile().catch(() => null),
        ]);
        
        setUserDirectory(usersDir || []);

        // Resolve owner info with the same priority as ShareModal:
        // user directory -> current profile -> token/item fallback.
        const tokens = getStoredTokens();
        const ownerUserId = selectedItem.ownerId;

        const ownerFromDir = usersDir?.find((u) => {
          const userId = u?.id || u?.userId || u?.uuid;
          return userId && String(userId) === String(ownerUserId);
        });

        if (ownerFromDir) {
          setOwnerInfo({
            firstName: ownerFromDir.firstName,
            lastName: ownerFromDir.lastName,
            fullName: ownerFromDir.fullName,
            name: ownerFromDir.name,
            username: ownerFromDir.username,
            email: ownerFromDir.email,
            image: ownerFromDir.image,
          });
        } else {
          const profileUserId = myProfile?.id || myProfile?.userId || myProfile?.uuid;
          if (profileUserId && String(profileUserId) === String(ownerUserId)) {
            setOwnerInfo({
              firstName: myProfile.firstName,
              lastName: myProfile.lastName,
              fullName: myProfile.fullName,
              name: myProfile.name,
              username: myProfile.username,
              email: myProfile.email,
              image: myProfile.image,
            });
          } else {
            setOwnerInfo({
              firstName: selectedItem.ownerFirstName,
              lastName: selectedItem.ownerLastName,
              fullName: selectedItem.ownerName,
              name: selectedItem.ownerName,
              username: tokens?.userInfo?.username,
              email: selectedItem.ownerEmail || tokens?.userInfo?.email,
              image: selectedItem.ownerImage || tokens?.userInfo?.image,
            });
          }
        }

        // Load shared users
        if (selectedItem.type && selectedItem.id) {
          try {
            const shared = await documentService.getSharedUsers(
              selectedItem.id,
              selectedItem.type.toUpperCase()
            );
            setSharedUsers(shared || []);
          } catch (err) {
            console.error("Error loading shared users:", err);
          }
        }
      } catch (err) {
        console.error("Error loading access info:", err);
      }
    };

    loadAccessInfo();
  }, [selectedItem, t]);

  useEffect(() => {
    if (!selectedItem?.id || !selectedItem?.type) {
      setBackendActivities([]);
      return;
    }

    let active = true;

    const loadActivities = async () => {
      try {
        const data = await documentService.getItemActivities(selectedItem.id, selectedItem.type.toUpperCase());
        if (!active) return;
        setBackendActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!active) return;
        console.error("Error loading activity history:", error);
        setBackendActivities([]);
      }
    };

    loadActivities();

    return () => {
      active = false;
    };
  }, [selectedItem?.id, selectedItem?.type]);

  // Create user directory map for quick lookup
  const userDirectoryMap = useMemo(() => {
    const map = new Map();
    userDirectory.forEach((u) => {
      const userId = u?.id || u?.userId;
      if (userId) {
        map.set(String(userId), u);
      }
    });
    return map;
  }, [userDirectory]);

  // Merge shared users with user directory for complete names
  const mergedSharedUsers = useMemo(() => {
    return (sharedUsers || []).map((entry) => {
      const entryUserId = entry.userId || entry.sharedWithUserId || entry.id;
      const fallbackUser = entryUserId ? userDirectoryMap.get(String(entryUserId)) : null;
      
      const merged = {
        id: entryUserId,
        firstName: entry.firstName ?? fallbackUser?.firstName,
        lastName: entry.lastName ?? fallbackUser?.lastName,
        fullName: entry.fullName ?? fallbackUser?.fullName,
        name: entry.name ?? fallbackUser?.name,
        username: entry.username ?? fallbackUser?.username,
        email: entry.email ?? fallbackUser?.email,
        image: entry.image ?? fallbackUser?.image,
      };
      
      return {
        shareId: entry.shareId || entry.id,
        userId: entryUserId,
        displayName: getUserName(merged),
        email: merged.email || "",
        image: merged.image,
        permission: entry.permission || "VIEWER",
      };
    });
  }, [sharedUsers, userDirectoryMap]);

  if (!selectedItem) return null;

  const itemPermissionPublic = selectedItem.permission === "PUBLIC";
  const locationText =
    currentPath.length > 0
      ? `${t("documents.fileDetail.myFiles")}/${currentPath.map((f) => f.name).join("/")}`
      : t("documents.fileDetail.myFiles");

  const fallbackActivityItems = [
    selectedItem.updatedAt && {
      key: "updated",
      label: t("documents.fileDetail.activityUpdated"),
      value: formatDate(selectedItem.updatedAt),
      timestamp: new Date(selectedItem.updatedAt).getTime(),
    },
    selectedItem.createdAt && {
      key: "created",
      label: t("documents.fileDetail.activityCreated"),
      value: formatDate(selectedItem.createdAt),
      timestamp: new Date(selectedItem.createdAt).getTime(),
    },
    selectedItem.deletedAt && {
      key: "deleted",
      label: t("documents.fileDetail.activityDeleted"),
      value: formatDate(selectedItem.deletedAt),
      timestamp: new Date(selectedItem.deletedAt).getTime(),
    },
  ].filter(Boolean);

  const persistedActivityItems = (backendActivities || []).map((entry) => {
    const payload = entry?.payload && typeof entry.payload === "object" ? entry.payload : {};
    const label = entry?.actionKey
      ? t(entry.actionKey, {
          ...payload,
          permissionLabel:
            payload.permission === "PUBLIC"
              ? t("documents.fileDetail.public")
              : payload.permission === "PRIVATE"
                ? t("documents.fileDetail.private")
                : payload.permission || "",
          defaultValue: entry.message || t("documents.fileDetail.activityUpdated"),
        })
      : (entry.message || t("documents.fileDetail.activityUpdated"));

    return {
      key: entry.id,
      label,
      value: formatDate(entry.timestamp),
      actorName: entry.actorName,
      actorEmail: entry.actorEmail,
      timestamp: entry.timestamp ? new Date(entry.timestamp).getTime() : 0,
    };
  });

  const activityItems = persistedActivityItems.length > 0
    ? persistedActivityItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    : fallbackActivityItems;

  return (
    <div className="relative w-[360px] flex-shrink-0 border-s border-[#e1e7ef] bg-[#f8fafd]">
      <div className="sticky top-0 z-10 border-b border-[#e1e7ef] bg-[#f8fafd] px-4 py-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              {selectedItem.type === "folder" ? getFolderIcon() : getFileIcon(selectedItem.name)}
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {selectedItem.type === "folder" ? t("documents.fileDetail.folder") : t("documents.fileDetail.file")}
              </p>
            </div>
            <h2 className="line-clamp-2 text-sm font-semibold text-foreground">
              {selectedItem.name}
            </h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="-mt-1 h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="px-4 pb-4 pt-3">
        <TabsList className="grid h-9 w-full grid-cols-2 bg-white">
          <TabsTrigger value="details" className="text-xs">
            {t("documents.fileDetail.details")}
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            {t("documents.fileDetail.activity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* People with access - Moved to top */}
          <div className="rounded-xl border border-[#dde3ea] bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("documents.fileDetail.peopleWithAccess")}
              </h3>
              <Button
                onClick={() => onManageAccess?.(selectedItem)}
                variant="ghost"
                size="sm"
                className="h-6 gap-1 rounded-md text-xs"
              >
                <Shield className="h-3 w-3" />
                {t("documents.fileDetail.manageAccess")}
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              {/* Owner */}
              {ownerInfo && (
                <div className="flex items-center justify-between rounded-lg bg-[#f8fafd] p-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar
                      user={ownerInfo}
                      src={ownerInfo.image}
                      name={getUserName(ownerInfo)}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {getUserName(ownerInfo)}
                      </p>
                        {ownerInfo.email && ownerInfo.email !== getUserName(ownerInfo) && (
                          <p className="text-xs text-muted-foreground truncate">{ownerInfo.email}</p>
                        )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {t("documents.permission.owner")}
                  </span>
                </div>
              )}
              
              {/* Shared users */}
              {mergedSharedUsers.length > 0 ? (
                mergedSharedUsers.map((user) => (
                  <div key={user.shareId} className="flex items-center justify-between rounded-lg p-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar
                        user={user}
                        src={user.image}
                        name={user.displayName}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{user.displayName}</p>
                        {user.email && user.email !== user.displayName && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {user.permission === "EDITOR" ? t("documents.permission.editor") : t("documents.permission.viewer")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("documents.fileDetail.notShared")}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#dde3ea] bg-white p-3">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("documents.fileDetail.overview")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{t("documents.fileDetail.type")}</span>
                <span className="text-right text-foreground">
                  {selectedItem.type === "folder" ? t("documents.fileDetail.folder") : t("documents.fileDetail.file")}
                </span>
              </div>
              {selectedItem.type === "file" && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">{t("documents.fileDetail.size")}</span>
                  <span className="text-right text-foreground">{humanSize(selectedItem.size)}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{t("documents.fileDetail.owner")}</span>
                <span className="text-right text-foreground">
                  {ownerInfo ? getUserName(ownerInfo) : t("documents.fileDetail.unknown")}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{t("documents.fileDetail.location")}</span>
                <span className="max-w-[210px] break-words text-right text-foreground">{locationText}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{t("documents.fileDetail.modified")}</span>
                <span className="text-right text-foreground">
                  {formatDate(selectedItem.updatedAt || selectedItem.createdAt)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{t("documents.fileDetail.created")}</span>
                <span className="text-right text-foreground">{formatDate(selectedItem.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#dde3ea] bg-white p-3">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("documents.fileDetail.access")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground">
                  {itemPermissionPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {itemPermissionPublic ? t("documents.fileDetail.public") : t("documents.fileDetail.private")}
                </span>
                <span className="text-muted-foreground">
                  {itemPermissionPublic
                    ? t("documents.fileDetail.publicDescription")
                    : t("documents.fileDetail.privateDescription")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground">
                  <Star className="h-4 w-4" />
                  {t("documents.fileDetail.favorite")}
                </span>
                <span className="text-muted-foreground">
                  {selectedItem.favorite ? t("documents.fileDetail.enabled") : t("documents.fileDetail.disabled")}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          {activityItems.length > 0 ? (
            activityItems.map((entry) => (
              <div key={entry.key} className="rounded-xl border border-[#dde3ea] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm text-foreground">{entry.label}</span>
                    {(entry.actorName || entry.actorEmail) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.actorName || entry.actorEmail}
                        {entry.actorName && entry.actorEmail ? ` (${entry.actorEmail})` : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.value}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-[#dde3ea] bg-white p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {t("documents.fileDetail.noActivity")}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-dashed border-[#c9d4e4] bg-white p-3 text-xs text-muted-foreground">
            <div className="mb-2 flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              {t("documents.fileDetail.location")}
            </div>
            <p className="break-words text-foreground">{locationText}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}









