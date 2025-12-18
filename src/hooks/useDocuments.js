import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { documentService } from "../services/documentService";
import { getStoredTokens } from "../lib/api";
import { toast } from "sonner";
import { useBreadcrumb } from "../context/BreadcrumbContext";

export function useDocuments() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // "all" | "favorites"
  const [favorites, setFavorites] = useState([]);
  const [shareItem, setShareItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [permissionItem, setPermissionItem] = useState(null);
  const [sharedItem, setSharedItem] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const { setCustomBreadcrumbs } = useBreadcrumb();

  // Get currentFolderId from URL params
  const currentFolderId = searchParams.get("folderId") || null;

  // Function to navigate to a folder (updates URL)
  const setCurrentFolderId = useCallback((folderId) => {
    if (folderId) {
      setSearchParams({ folderId });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  // Load folder contents
  const loadFolderContents = useCallback(async () => {
    try {
      setLoading(true);
      if (currentFolderId) {
        const [contentsResp, allFoldersResp] = await Promise.all([
          documentService.getFolderContents(currentFolderId),
          documentService.getAllFolders(),
        ]);
        setFolders(contentsResp.folders || []);
        setFiles(contentsResp.files || []);
        setAllFolders(allFoldersResp || []);
      } else {
        const [foldersResponse, filesResponse] = await Promise.all([
          documentService.getAllFolders(),
          documentService.getAllFiles(),
        ]);
        setAllFolders(foldersResponse || []);
        setFolders(foldersResponse || []);
        setFiles(filesResponse || []);
      }
    } catch (error) {
      console.error("Error loading folder contents:", error);
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const favoritesData = await documentService.getFavorites();
      setFavorites(favoritesData || []);
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trash items
  const [trashItems, setTrashItems] = useState([]);
  
  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      const trashData = await documentService.getTrash();
      setTrashItems(trashData || []);
    } catch (error) {
      console.error("Error loading trash:", error);
      setTrashItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filterMode === "favorites") {
      loadFavorites();
    } else if (filterMode === "trash") {
      loadTrash();
    } else {
      loadFolderContents();
    }
  }, [filterMode, loadFavorites, loadTrash, loadFolderContents]);

  useEffect(() => {
    setSelectedItem(null);
    setShowMobileDetails(false);
    setSelectedItems(new Set());
  }, [currentFolderId]);

  // Build breadcrumb path
  const currentPath = useMemo(() => {
    if (!allFolders.length) return [];

    const idToFolder = new Map(allFolders.map((f) => [f.id, f]));
    const path = [];

    if (currentFolderId) {
      let cursor = idToFolder.get(currentFolderId);
      while (cursor) {
        path.unshift(cursor);
        cursor = cursor.parentId ? idToFolder.get(cursor.parentId) : null;
      }
    }

    return path;
  }, [allFolders, currentFolderId]);

  // Update breadcrumb
  useEffect(() => {
    const breadcrumbs = [
      { label: t('breadcrumb.home'), to: "/" },
      { 
        label: t('documents.title'), 
        onClick: currentFolderId ? () => {
          setCurrentFolderId(null);
          setFilterMode("all");
        } : undefined 
      },
    ];

    if (currentPath.length > 0) {
      currentPath.forEach((folder, index) => {
        const isLast = index === currentPath.length - 1;
        breadcrumbs.push({
          label: folder.name,
          onClick: isLast ? undefined : () => {
            setCurrentFolderId(folder.id);
          },
        });
      });
    }

    setCustomBreadcrumbs(breadcrumbs);

    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [currentPath, setCustomBreadcrumbs, t]);

  const idToFolder = useMemo(
    () => new Map(allFolders.map((f) => [f.id, f])),
    [allFolders]
  );

  function goUpOneLevel() {
    if (!currentFolderId) return;
    const current = idToFolder.get(currentFolderId);
    setCurrentFolderId(current?.parentId ?? null);
  }

  const visibleFolders = useMemo(
    () =>
      (allFolders.length ? allFolders : folders).filter(
        (f) =>
          f.parentId === currentFolderId &&
          f.name.toLowerCase().includes(search.toLowerCase())
      ),
    [allFolders, folders, currentFolderId, search]
  );

  const visibleFiles = useMemo(
    () =>
      files.filter(
        (f) =>
          f.folderId === currentFolderId &&
          f.name.toLowerCase().includes(search.toLowerCase())
      ),
    [files, currentFolderId, search]
  );

  // Combine folders and files for sorting (or show favorites)
  const allItems = useMemo(() => {
    // If showing favorites, display favorite items
    if (filterMode === "favorites") {
      return favorites
        .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
        .map((f) => ({
          ...f,
          type: f.targetType === "FOLDER" ? "folder" : "file",
          id: f.targetId,
          size: f.size || 0,
          date: f.createdAt || f.updatedAt,
          favorite: true,
        }));
    }

    // If showing trash, display deleted items
    if (filterMode === "trash") {
      return trashItems
        .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
        .map((f) => ({
          ...f,
          type: f.itemType === "FOLDER" ? "folder" : "file",
          size: f.size || 0,
          date: f.deletedAt,
          isTrash: true,
        }));
    }

    // Normal view - show folders and files
    const folderItems = visibleFolders.map((f) => ({
      ...f,
      type: "folder",
      size: 0,
      date: f.createdAt || f.updatedAt,
    }));
    const fileItems = visibleFiles.map((f) => ({
      ...f,
      type: "file",
      date: f.createdAt || f.updatedAt,
    }));
    return [...folderItems, ...fileItems];
  }, [visibleFolders, visibleFiles, filterMode, favorites, trashItems, search]);

  // Sorting logic
  const parseFileSize = (sizeStr) => {
    if (typeof sizeStr === "number") return sizeStr;
    if (!sizeStr) return 0;
    const size = parseFloat(sizeStr);
    if (sizeStr.includes("GB")) return size * 1024 * 1024 * 1024;
    if (sizeStr.includes("MB")) return size * 1024 * 1024;
    if (sizeStr.includes("KB")) return size * 1024;
    return size;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    return new Date(dateStr).getTime();
  };

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = parseDate(a.date) - parseDate(b.date);
          break;
        case "size":
          comparison = parseFileSize(a.size) - parseFileSize(b.size);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const sortedItems = sortItems(allItems);

  const handleSortChange = (option) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("asc");
    }
  };

  const getSortLabel = () => {
    const directionIcon = sortDirection === "asc" ? "↑" : "↓";
    switch (sortBy) {
      case "name":
        return `${t('documents.header.sortByName')} ${directionIcon}`;
      case "date":
        return `${t('documents.header.sortByDate')} ${directionIcon}`;
      case "size":
        return `${t('documents.header.sortBySize')} ${directionIcon}`;
      default:
        return directionIcon;
    }
  };

  const handleItemClick = (item) => {
    // Don't allow navigation in trash mode
    if (filterMode === "trash") {
      setSelectedItem(item);
      if (showMobileDetails !== undefined) {
        setShowMobileDetails(true);
      }
      return;
    }
    
    if (item.type === "folder") {
      // If in favorites mode, switch back to all mode first
      if (filterMode === "favorites") {
        setFilterMode("all");
      }
      setCurrentFolderId(item.id);
    } else {
      setSelectedItem(item);
      if (showMobileDetails !== undefined) {
        setShowMobileDetails(true);
      }
    }
  };

  const handleItemDoubleClick = (item) => {
    // Don't allow navigation/opening in trash mode
    if (filterMode === "trash") {
      return;
    }
    
    if (item.type === "folder") {
      // If in favorites mode, switch back to all mode first
      if (filterMode === "favorites") {
        setFilterMode("all");
      }
      setCurrentFolderId(item.id);
    } else if (item.path) {
      // Open file in new tab
      const fileUrl = `http://localhost:9000/iems-storage/${item.path}`;
      window.open(fileUrl, '_blank');
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === sortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sortedItems.map((item) => item.id)));
    }
  };

  const toggleItemSelection = (itemId, event) => {
    event.stopPropagation();
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.add(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  // Event handlers
  async function onCreateFolderConfirmed() {
    const name = newFolderName.trim();
    if (!name) return;

    try {
      await documentService.createFolder(name, currentFolderId);
      setNewFolderName("");
      setIsCreateOpen(false);
      loadFolderContents();
      toast.success(t('documents.createFolder.success'));
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(error?.message || t('documents.createFolder.error'));
    }
  }

  async function onUploadFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    try {
      for (const file of fileList) {
        await documentService.uploadFile(currentFolderId, file);
      }
      loadFolderContents();
      toast.success(t('documents.upload.successMultiple', { count: fileList.length }));
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(error?.message || t('documents.upload.error'));
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    onUploadFiles(e.dataTransfer.files);
  }

  async function toggleFavorite(item, type) {
    try {
      const result = await documentService.toggleFavorite(
        item.id,
        type.toUpperCase()
      );

      const updateItem = (items) =>
        items.map((i) => (i.id === item.id ? { ...i, favorite: result } : i));

      setFolders((prev) => updateItem(prev));
      setFiles((prev) => updateItem(prev));

      // If in favorites mode and item was unfavorited, refresh the list
      if (filterMode === "favorites" && !result) {
        loadFavorites();
      }

      const action = result ? t('documents.favorite.added') : t('documents.favorite.removed');
      const itemType = type === "folder" ? t('documents.types.folder') : t('documents.types.file');
      toast.success(
        `${action} ${itemType} '${item.name}'`
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(error?.message || t('documents.favorite.error'));
    }
  }

  function openShare(item, type) {
    setSelectedRecipients([]);
    setShareItem({ type, data: item });
  }

  function confirmDelete(item, type) {
    setDeleteItem({ type, data: item });
  }

  async function onConfirmDelete() {
    if (!deleteItem) return;

    try {
      if (deleteItem.type === "folder") {
        await documentService.deleteFolder(deleteItem.data.id);
        if (currentFolderId === deleteItem.data.id) {
          setCurrentFolderId(deleteItem.data.parentId ?? null);
        }
      } else {
        await documentService.deleteFile(deleteItem.data.id);
      }
      loadFolderContents();
      setDeleteItem(null);
      toast.success(t('documents.delete.success'));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error?.message || t('documents.delete.error'));
    }
  }

  // Trash handlers
  async function handleRestore(item) {
    try {
      if (item.type === "folder") {
        await documentService.restoreFolder(item.id);
      } else {
        await documentService.restoreFile(item.id);
      }
      loadTrash();
      toast.success(t('documents.trash.restoreSuccess'));
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error(error?.message || t('documents.trash.restoreError'));
    }
  }

  async function handlePermanentDelete(item) {
    try {
      if (item.type === "folder") {
        await documentService.permanentDeleteFolder(item.id);
      } else {
        await documentService.permanentDeleteFile(item.id);
      }
      loadTrash();
      toast.success(t('documents.trash.permanentDeleteSuccess'));
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      toast.error(error?.message || t('documents.trash.permanentDeleteError'));
    }
  }

  async function handleEmptyTrash() {
    try {
      await documentService.emptyTrash();
      loadTrash();
      toast.success(t('documents.trash.emptySuccess'));
    } catch (error) {
      console.error("Error emptying trash:", error);
      toast.error(error?.message || t('documents.trash.emptyError'));
    }
  }

  async function handleShare(permission) {
    try {
      await documentService.shareItem(
        shareItem.data.id,
        shareItem.type.toUpperCase(),
        selectedRecipients,
        permission
      );
      setShareItem(null);
      toast.success(t('documents.share.success'));
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error(error?.message || t('documents.share.error'));
    }
  }

  function handleRename(item, type) {
    setRenameItem({ id: item.id, type, data: item });
  }

  function handlePermission(item, type) {
    setPermissionItem({ id: item.id, type, data: item });
  }

  function handleSharedUsers(item, type) {
    setSharedItem({ id: item.id, type, data: item });
  }

  function handleMove(item, type) {
    setMoveItem({ id: item.id, type, data: item });
  }

  async function handleRenameConfirm(newName) {
    if (!renameItem) return;
    try {
      if (renameItem.type === "folder") {
        await documentService.renameFolder(renameItem.data.id, newName);
      } else {
        await documentService.renameFile(renameItem.data.id, newName);
      }
      loadFolderContents();
    } catch (error) {
      console.error("Error renaming:", error);
      throw error;
    }
  }

  async function handlePermissionConfirm(permission) {
    if (!permissionItem) return;
    try {
      if (permissionItem.type === "folder") {
        await documentService.updateFolderPermission(
          permissionItem.data.id,
          permission
        );
      } else {
        await documentService.updateFilePermission(
          permissionItem.data.id,
          permission
        );
      }
      loadFolderContents();
    } catch (error) {
      console.error("Error updating permission:", error);
      throw error;
    }
  }

  function handleMoveCompleted() {
    loadFolderContents();
  }

  const getCurrentUserId = () => {
    const tokens = getStoredTokens();
    return tokens?.userInfo?.userId;
  };

  const isOwner = (item) => {
    const currentUserId = getCurrentUserId();
    return currentUserId && String(currentUserId) === String(item.ownerId);
  };

  async function handleBatchDelete() {
    if (selectedItems.size === 0) return;

    const fileIds = [];
    const folderIds = [];

    selectedItems.forEach((itemId) => {
      const item = sortedItems.find((i) => i.id === itemId);
      if (item) {
        if (item.type === "folder") {
          folderIds.push(item.id);
        } else {
          fileIds.push(item.id);
        }
      }
    });

    try {
      const result = await documentService.batchDelete(fileIds, folderIds);
      setSelectedItems(new Set());
      loadFolderContents();

      if (result.failureCount > 0) {
        toast.warning(
          t('documents.batchDelete.partial', {
            success: result.successCount,
            total: result.totalRequested,
            failed: result.failureCount
          })
        );
      } else {
        toast.success(t('documents.batchDelete.success', { count: result.successCount }));
      }
    } catch (error) {
      console.error("Error batch deleting:", error);
      toast.error(error?.message || t('documents.batchDelete.error'));
    }
  }

  async function handleBatchMove(destinationFolderId) {
    if (selectedItems.size === 0) return;

    const fileIds = [];
    const folderIds = [];

    selectedItems.forEach((itemId) => {
      const item = sortedItems.find((i) => i.id === itemId);
      if (item) {
        if (item.type === "folder") {
          folderIds.push(item.id);
        } else {
          fileIds.push(item.id);
        }
      }
    });

    try {
      const result = await documentService.batchMove(
        fileIds,
        folderIds,
        destinationFolderId
      );
      setSelectedItems(new Set());
      loadFolderContents();

      if (result.failureCount > 0) {
        toast.warning(
          t('documents.batchMove.partial', {
            success: result.successCount,
            total: result.totalRequested,
            failed: result.failureCount
          })
        );
      } else {
        toast.success(t('documents.batchMove.success', { count: result.successCount }));
      }
    } catch (error) {
      console.error("Error batch moving:", error);
      toast.error(error?.message || t('documents.batchMove.error'));
    }
  }

  return {
    // State
    folders,
    allFolders,
    files,
    currentFolderId,
    setCurrentFolderId,
    search,
    setSearch,
    isDragging,
    setIsDragging,
    filterMode,
    setFilterMode,
    shareItem,
    setShareItem,
    deleteItem,
    setDeleteItem,
    selectedItem,
    setSelectedItem,
    showMobileDetails,
    setShowMobileDetails,
    sortBy,
    sortDirection,
    selectedItems,
    setSelectedItems,
    isCreateOpen,
    setIsCreateOpen,
    newFolderName,
    setNewFolderName,
    selectedRecipients,
    setSelectedRecipients,
    loading,
    renameItem,
    setRenameItem,
    permissionItem,
    setPermissionItem,
    sharedItem,
    setSharedItem,
    moveItem,
    setMoveItem,
    viewMode,
    setViewMode,
    sortedItems,
    currentPath,

    // Handlers
    handleSortChange,
    getSortLabel,
    handleItemClick,
    handleItemDoubleClick,
    toggleSelectAll,
    toggleItemSelection,
    onCreateFolderConfirmed,
    onUploadFiles,
    onDrop,
    toggleFavorite,
    openShare,
    confirmDelete,
    onConfirmDelete,
    handleShare,
    handleRename,
    handlePermission,
    handleSharedUsers,
    handleMove,
    handleRenameConfirm,
    handlePermissionConfirm,
    handleMoveCompleted,
    isOwner,
    goUpOneLevel,
    handleBatchDelete,
    handleBatchMove,
    // Trash handlers
    handleRestore,
    handlePermanentDelete,
    handleEmptyTrash,
  };
}





