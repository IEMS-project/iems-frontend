"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { documentService } from "../services/documentService";
import { getStoredTokens } from "../lib/api";
import {
  Folder,
  File,
  UploadIcon,
  FolderPlus,
  ChevronDownIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  X,
  Star,
  Share2,
  Trash2,
  Edit,
  Lock,
  Users,
  Globe,
  Move,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileUploadDialog } from "../components/documents/FileUploadDialog";
import ShareModal from "../components/documents/ShareModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import CreateFolderModal from "../components/documents/CreateFolderModal";
import RenameModal from "../components/documents/RenameModal";
import PermissionModal from "../components/documents/PermissionModal";
import SharedUsersModal from "../components/documents/SharedUsersModal";
import MoveModal from "../components/documents/MoveModal";
import Skeleton from "../components/ui/Skeleton";
import { toast } from "sonner";
import { getFileIcon, getFolderIcon } from "../components/documents/fileIconUtils";
import { useBreadcrumb } from "../context/BreadcrumbContext";

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

export default function Documents() {
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
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const isMobile = useIsMobile();
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

  // Build breadcrumb path - includes all folders from root to current folder
	const currentPath = useMemo(() => {
    if (!allFolders.length) return [];
    
    const idToFolder = new Map(allFolders.map((f) => [f.id, f]));
		const path = [];
		
		// If we're in a folder, build path from root to that folder
		if (currentFolderId) {
			let cursor = idToFolder.get(currentFolderId);
			// Build path from current folder up to root
		while (cursor) {
			path.unshift(cursor);
			cursor = cursor.parentId ? idToFolder.get(cursor.parentId) : null;
		}
		}
		
		return path;
	}, [allFolders, currentFolderId]);

  // Update breadcrumb in layout whenever currentPath changes
  useEffect(() => {
    const breadcrumbs = [
      { label: "Trang chủ", to: "/" },
      { label: "Tài liệu", to: "/documents" },
    ];

    // Add folder path to breadcrumb
    if (currentPath.length > 0) {
      currentPath.forEach((folder, index) => {
        const isLast = index === currentPath.length - 1;
        breadcrumbs.push({
          label: folder.name,
          // Last item (current location) should not be clickable and will be bold
          onClick: isLast ? undefined : () => {
            // Navigate to the clicked folder
            setCurrentFolderId(folder.id);
          },
        });
      });
    }

    setCustomBreadcrumbs(breadcrumbs);

    // Cleanup: reset breadcrumb when component unmounts
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
      // Always put folders first
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      
      // If both are same type, sort by selected criteria
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
        return `Name ${directionIcon}`;
      case "date":
        return `Date ${directionIcon}`;
      case "size":
        return `Size ${directionIcon}`;
    }
  };

  const handleItemClick = (item) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
    } else {
      setSelectedItem(item);
      if (isMobile) {
        setShowMobileDetails(true);
      }
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

  const FileDetailContent = ({ selectedItem }) => {
    if (!selectedItem) return null;

	return (
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
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Size</span>
                  <span className="text-foreground text-sm">
                    {humanSize(selectedItem.size)}
                  </span>
                </div>
              </>
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
    );
  };

  return (
    <div className="flex p-4">
      <div className="border-border min-w-0 flex-1 space-y-4">
        {/* Header */}
        <div className="flex justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          </div>
          <div className="border-border flex items-center justify-between gap-2">
            <FileUploadDialog onUpload={onUploadFiles} />
            <Button
              onClick={() => setIsCreateOpen(true)}
              variant="outline"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search files and folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {getSortLabel()} <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortChange("name")}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("date")}>
                Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("size")}>
                Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-input">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 rounded-l-none border-l"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className="flex border-t"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
							onDragLeave={() => setIsDragging(false)}
							onDrop={onDrop}
        >
          {/* File List */}
          <div
            className={cn(
              "min-w-0 grow",
              isDragging && "ring-2 ring-blue-400 ring-offset-2"
            )}
          >
            {loading ? (
              viewMode === "list" ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b p-4"
                    >
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="rounded border border-dashed p-3">
                      <Skeleton className="mb-3 h-12 w-16" />
                      <Skeleton className="mb-2 h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              )
            ) : viewMode === "grid" ? (
              <>
                {/* Grid View */}
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {sortedItems.map((item) => {
                    const itemIsOwner = isOwner(item);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative flex flex-col rounded-lg border p-3 hover:border-primary hover:bg-muted/50 transition-colors",
                          selectedItem?.id === item.id && "border-primary bg-muted"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItemSelection(item.id, e);
                            }}
                            className="absolute left-2 top-2 z-10"
                          />
                          <div className="mx-auto">
                            {item.type === "folder"
                              ? getFolderIcon("h-12 w-12")
                              : getFileIcon(item.name, "h-12 w-12")}
                          </div>
                          <div className="absolute right-2 top-2 z-10 flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item, item.type);
                              }}
                            >
                              {item.favorite ? (
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              ) : (
                                <Star className="h-3 w-3" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontalIcon className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {itemIsOwner && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleRename(item, item.type)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePermission(item, item.type)
                                      }
                                    >
                                      <Lock className="mr-2 h-4 w-4" />
                                      Permissions
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => openShare(item, item.type)}
                                    >
                                      <Share2 className="mr-2 h-4 w-4" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleSharedUsers(item, item.type)
                                      }
                                    >
                                      <Users className="mr-2 h-4 w-4" />
                                      Shared Users
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleMove(item, item.type)}
                                    >
                                      <Move className="mr-2 h-4 w-4" />
                                      Move
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => confirmDelete(item, item.type)}
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
                        <div
                          className="cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="truncate text-sm font-medium flex items-center gap-1">
                            <span>{item.name}</span>
                            {item.type === "folder" && (
                              <>
                                {item.permission === "PUBLIC" ? (
                                  <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                                ) : (
                                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.type === "folder"
                              ? "Folder"
                              : humanSize(item.size)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(item.date)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {sortedItems.length === 0 && search && (
                  <div className="text-muted-foreground flex items-center justify-center p-8 text-center">
                    No files or folders found matching "{search}"
                  </div>
                )}
                {sortedItems.length === 0 && !search && (
                  <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col items-center justify-center">
                    <div className="mx-auto max-w-md space-y-4 text-center">
                      <FolderPlus className="mx-auto size-14 opacity-50" />
                      <h2 className="text-muted-foreground">
                        This folder is empty.
                      </h2>
                      <div>
                        <FileUploadDialog onUpload={onUploadFiles} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* List View */}
                {/* Table Header */}
                {sortedItems.length > 0 && (
                  <div className="border-b bg-muted/50 flex items-center p-2 lg:p-4 text-sm font-medium text-muted-foreground">
                    <div className="flex min-w-0 items-center space-x-4 flex-1">
                      <Checkbox
                        checked={
                          selectedItems.size === sortedItems.length &&
                          sortedItems.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
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
                )}
                {sortedItems.map((item) => {
                  const itemIsOwner = isOwner(item);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "hover:bg-muted flex cursor-pointer items-center justify-between border-b p-2 lg:p-4",
                        selectedItem?.id === item.id && "bg-muted"
                      )}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex min-w-0 items-center space-x-4 flex-1">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onClick={(e) => toggleItemSelection(item.id, e)}
                        />
                        <div className="w-5 shrink-0">
                          {item.type === "folder"
                            ? getFolderIcon()
                            : getFileIcon(item.name)}
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
                              toggleFavorite(item, item.type);
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
                                <DropdownMenuItem
                                  onClick={() => handleRename(item, item.type)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handlePermission(item, item.type)
                                  }
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openShare(item, item.type)}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSharedUsers(item, item.type)
                                  }
                                >
                                  <Users className="mr-2 h-4 w-4" />
                                  Shared Users
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleMove(item, item.type)}
                                >
                                  <Move className="mr-2 h-4 w-4" />
                                  Move
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => confirmDelete(item, item.type)}
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
                {sortedItems.length === 0 && search && (
                  <div className="text-muted-foreground flex items-center justify-center p-8 text-center">
                    No files or folders found matching "{search}"
                  </div>
                )}
                {sortedItems.length === 0 && !search && (
                  <div className="flex h-[calc(100vh-var(--header-height)-3rem)] flex-col items-center justify-center">
                    <div className="mx-auto max-w-md space-y-4 text-center">
                      <FolderPlus className="mx-auto size-14 opacity-50" />
                      <h2 className="text-muted-foreground">
                        This folder is empty.
                      </h2>
                      <div>
                        <FileUploadDialog onUpload={onUploadFiles} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop Right Panel - Details */}
          {selectedItem && !isMobile && (
            <div className="relative w-80 border-s py-6">
              <Button
                onClick={() => setSelectedItem(null)}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-0"
              >
                <X />
              </Button>
              <FileDetailContent selectedItem={selectedItem} />
            </div>
							)}
						</div>
      </div>

      {/* Mobile Sheet - Details */}
      {selectedItem && isMobile && (
        <Sheet open={showMobileDetails} onOpenChange={setShowMobileDetails}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>File Details</SheetTitle>
            </SheetHeader>
            <FileDetailContent selectedItem={selectedItem} />
          </SheetContent>
        </Sheet>
					)}

					{/* Modals */}
					<ShareModal
						isOpen={!!shareItem}
						onClose={() => setShareItem(null)}
						shareItem={shareItem}
						selectedRecipients={selectedRecipients}
						setSelectedRecipients={setSelectedRecipients}
						onShare={handleShare}
					/>

					<ConfirmDialog
						open={!!deleteItem}
						onOpenChange={(open) => {
							if (!open) setDeleteItem(null);
						}}
						onConfirm={onConfirmDelete}
						title="Xác nhận xóa"
						description={
							deleteItem
								? `Bạn có chắc muốn xóa ${deleteItem.type === "folder" ? "thư mục" : "tệp"} "${deleteItem.data.name}"${deleteItem.type === "folder" ? " và tất cả nội dung bên trong" : ""}?`
								: ""
						}
						confirmText="Xóa"
						cancelText="Hủy"
						variant="destructive"
					/>

					<CreateFolderModal
						isOpen={isCreateOpen}
						onClose={() => setIsCreateOpen(false)}
						newFolderName={newFolderName}
						setNewFolderName={setNewFolderName}
						onConfirm={onCreateFolderConfirmed}
					/>

					<RenameModal
						isOpen={!!renameItem}
						onClose={() => setRenameItem(null)}
						item={renameItem}
						onConfirm={handleRenameConfirm}
					/>

					<PermissionModal
						isOpen={!!permissionItem}
						onClose={() => setPermissionItem(null)}
						item={permissionItem}
						onConfirm={handlePermissionConfirm}
					/>

					<SharedUsersModal
						isOpen={!!sharedItem}
						onClose={() => setSharedItem(null)}
						item={sharedItem}
					/>

					<MoveModal
						isOpen={!!moveItem}
						onClose={() => setMoveItem(null)}
						moveItem={moveItem}
						onMoveCompleted={handleMoveCompleted}
					/>
		</div>
	);
}
