import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { documentService } from "../services/documentService";
import { getStoredTokens } from "../lib/api";
import { toast } from "sonner";
import { useBreadcrumb } from "../context/BreadcrumbContext";

export function useDocuments() {
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
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

  useEffect(() => {
    loadFolderContents();
  }, [loadFolderContents]);

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
      { label: "Trang chủ", to: "/" },
      { label: "Tài liệu", to: "/documents" },
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
  }, [currentPath, setCustomBreadcrumbs]);

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

  // Combine folders and files for sorting
  const allItems = useMemo(() => {
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
  }, [visibleFolders, visibleFiles]);

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
        return `Tên ${directionIcon}`;
      case "date":
        return `Ngày ${directionIcon}`;
      case "size":
        return `Dung lượng ${directionIcon}`;
      default:
        return directionIcon;
    }
  };

  const handleItemClick = (item) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
    } else {
      setSelectedItem(item);
      if (showMobileDetails !== undefined) {
        setShowMobileDetails(true);
      }
    }
  };

  const handleItemDoubleClick = (item) => {
    if (item.type === "folder") {
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
      toast.success("Thư mục đã được tạo thành công");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(error?.message || "Lỗi khi tạo thư mục");
    }
  }

  async function onUploadFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    try {
      for (const file of fileList) {
        await documentService.uploadFile(currentFolderId, file);
      }
      loadFolderContents();
      toast.success(`Đã tải lên ${fileList.length} tệp thành công`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(error?.message || "Lỗi khi tải tệp lên");
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

      const action = result ? "thêm" : "xóa";
      const itemType = type === "folder" ? "thư mục" : "tệp";
      toast.success(
        `Đã ${action} ${itemType} '${item.name}' ${result ? "vào" : "khỏi"} mục yêu thích`
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(error?.message || "Lỗi khi cập nhật yêu thích");
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
      toast.success("Đã xóa thành công");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error?.message || "Lỗi khi xóa");
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
      toast.success("Chia sẻ thành công");
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error(error?.message || "Lỗi khi chia sẻ");
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
          `Đã xóa ${result.successCount}/${result.totalRequested} mục. ${result.failureCount} mục không thể xóa.`
        );
      } else {
        toast.success(`Đã xóa thành công ${result.successCount} mục`);
      }
    } catch (error) {
      console.error("Error batch deleting:", error);
      toast.error(error?.message || "Lỗi khi xóa các mục");
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
          `Đã di chuyển ${result.successCount}/${result.totalRequested} mục. ${result.failureCount} mục không thể di chuyển.`
        );
      } else {
        toast.success(`Đã di chuyển thành công ${result.successCount} mục`);
      }
    } catch (error) {
      console.error("Error batch moving:", error);
      toast.error(error?.message || "Lỗi khi di chuyển các mục");
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
  };
}





