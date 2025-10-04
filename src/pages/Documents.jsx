import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import PageHeader from "../components/common/PageHeader";
import { documentService } from "../services/documentService";
import DocumentGrid from "../components/documents/DocumentGrid";
import DocumentList from "../components/documents/DocumentList";
import DocumentToolbar from "../components/documents/DocumentToolbar";
import ShareModal from "../components/documents/ShareModal";
import DeleteModal from "../components/documents/DeleteModal";
import UploadModal from "../components/documents/UploadModal";
import CreateFolderModal from "../components/documents/CreateFolderModal";
import RenameModal from "../components/documents/RenameModal";
import PermissionModal from "../components/documents/PermissionModal";
import SharedUsersModal from "../components/documents/SharedUsersModal";

export default function Documents() {
	// `folders` is the current visible folder list (children of current folder)
	// `allFolders` keeps the full list fetched for parent lookups and breadcrumb building
	const [folders, setFolders] = useState([]);
	const [allFolders, setAllFolders] = useState([]);
	const [files, setFiles] = useState([]);
	const [currentFolderId, setCurrentFolderId] = useState(null);
	const [search, setSearch] = useState("");
	const [viewMode, setViewMode] = useState("grid");
	const [isDragging, setIsDragging] = useState(false);
	const [shareItem, setShareItem] = useState(null);
	const [deleteItem, setDeleteItem] = useState(null);
	const [openMenu, setOpenMenu] = useState({ id: null, type: null, anchorRect: null });
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [uploadDrag, setUploadDrag] = useState(false);
	const [uploadFiles, setUploadFiles] = useState([]);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState("");
	const [selectedRecipients, setSelectedRecipients] = useState([]);
	const [loading, setLoading] = useState(false);
	const [renameItem, setRenameItem] = useState(null);
	const [permissionItem, setPermissionItem] = useState(null);
	const [sharedItem, setSharedItem] = useState(null);
	const fileInputRef = useRef(null);

	// Load data when component mounts or currentFolderId changes

	// Close dropdown when clicking outside or pressing Escape
	useEffect(() => {
		function onDocClick(e) {
			if (!openMenu.anchorRect) return;
			let node = e.target;
			while (node) {
				if (node.getAttribute) {
					if (node.getAttribute('data-dropdown-portal') === 'true') return;
					if (node.getAttribute('data-dropdown-trigger') === 'true') return;
				}
				node = node.parentNode;
			}
			setOpenMenu({ id: null, type: null, anchorRect: null });
		}

		function onKey(e) {
			if (e.key === 'Escape') setOpenMenu({ id: null, type: null, anchorRect: null });
		}

		document.addEventListener('click', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	}, [openMenu.anchorRect]);

	// Load folder contents
	const loadFolderContents = React.useCallback(async () => {
		try {
			setLoading(true);
			if (currentFolderId) {
				// When viewing a child folder, also fetch all folders so we can resolve parents for breadcrumb/up-navigation
				const [contentsResp, allFoldersResp] = await Promise.all([
					documentService.getFolderContents(currentFolderId),
					documentService.getAllFolders()
				]);
				setFolders(contentsResp.folders || []);
				setFiles(contentsResp.files || []);
				setAllFolders(allFoldersResp || []);
			} else {
				const [foldersResponse, filesResponse] = await Promise.all([
					documentService.getAllFolders(),
					documentService.getAllFiles()
				]);
				setAllFolders(foldersResponse || []);
				setFolders(foldersResponse || []);
				setFiles(filesResponse || []);
			}
		} catch (error) {
			console.error('Error loading folder contents:', error);
			// Show empty state instead of mock data
			setFolders([]);
			setFiles([]);
		} finally {
			setLoading(false);
		}
	}, [currentFolderId]);

	// Load data when component mounts or currentFolderId changes
	useEffect(() => {
		loadFolderContents();
	}, [loadFolderContents]);

	// Build breadcrumb path from the full folder list so parents are resolvable
	const currentPath = useMemo(() => {
		const idToFolder = new Map(allFolders.map(f => [f.id, f]));
		const path = [];
		let cursor = currentFolderId ? idToFolder.get(currentFolderId) : null;
		while (cursor) {
			path.unshift(cursor);
			cursor = cursor.parentId ? idToFolder.get(cursor.parentId) : null;
		}
		return path;
	}, [allFolders, currentFolderId]);

	const idToFolder = useMemo(() => new Map(allFolders.map(f => [f.id, f])), [allFolders]);

	function goUpOneLevel() {
		if (!currentFolderId) return;
		const current = idToFolder.get(currentFolderId);
		setCurrentFolderId(current?.parentId ?? null);
	}

	const visibleFolders = useMemo(() => 
		(allFolders.length ? allFolders : folders).filter(f => f.parentId === currentFolderId && f.name.toLowerCase().includes(search.toLowerCase())), 
		[allFolders, folders, currentFolderId, search]
	);
    
	const visibleFiles = useMemo(() => 
		files.filter(f => f.folderId === currentFolderId && f.name.toLowerCase().includes(search.toLowerCase())), 
		[files, currentFolderId, search]
	);

	// Event handlers
	async function onCreateFolderConfirmed() {
		const name = newFolderName.trim();
		if (!name) return;
        
		try {
			await documentService.createFolder(name, currentFolderId);
			setNewFolderName("");
			setIsCreateOpen(false);
			loadFolderContents();
		} catch (error) {
			console.error('Error creating folder:', error);
			alert('Lỗi khi tạo thư mục');
		}
	}

	async function onUploadFiles(fileList) {
		if (!fileList || fileList.length === 0) return;
        
		try {
			for (const file of fileList) {
				await documentService.uploadFile(currentFolderId, file);
			}
			loadFolderContents();
		} catch (error) {
			console.error('Error uploading files:', error);
			alert('Lỗi khi tải tệp lên');
		}
	}

	// file input handling is done via fileInputRef and UploadModal; remove unused handler

	function onDrop(e) {
		e.preventDefault();
		setIsDragging(false);
		onUploadFiles(e.dataTransfer.files);
	}

	async function toggleFavorite(item, type) {
		try {
			console.log('Toggling favorite for:', item.name, 'current favorite:', item.favorite);
			const result = await documentService.toggleFavorite(item.id, type.toUpperCase());
			console.log('API result:', result);
            
			// Update UI immediately instead of reloading
			const updateItem = (items) => 
				items.map(i => i.id === item.id ? { ...i, favorite: result } : i);
            
			setFolders(prev => updateItem(prev));
			setFiles(prev => updateItem(prev));
            
			// Show success notification
			const action = result ? 'thêm' : 'xóa';
			const itemType = type === 'folder' ? 'thư mục' : 'tệp';
			alert(`Đã ${action} ${itemType} '${item.name}' ${result ? 'vào' : 'khỏi'} mục yêu thích.`);
		} catch (error) {
			console.error('Error toggling favorite:', error);
			alert('Lỗi khi cập nhật yêu thích');
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
		} catch (error) {
			console.error('Error deleting item:', error);
			alert('Lỗi khi xóa');
		}
	}

	function startUploadModal() {
		setUploadFiles([]);
		setIsUploadOpen(true);
	}

	function completeUpload() {
		if (uploadFiles.length) {
			onUploadFiles(uploadFiles);
		}
		setIsUploadOpen(false);
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
			alert('Chia sẻ thành công');
		} catch (error) {
			console.error('Error sharing:', error);
			alert('Lỗi khi chia sẻ');
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
				console.error('Error renaming:', error);
				throw error;
			}
	}

	async function handlePermissionConfirm(permission) {
		if (!permissionItem) return;
		try {
				if (permissionItem.type === "folder") {
					await documentService.updateFolderPermission(permissionItem.data.id, permission);
				} else {
					await documentService.updateFilePermission(permissionItem.data.id, permission);
				}
			loadFolderContents();
		} catch (error) {
			console.error('Error updating permission:', error);
			throw error;
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				breadcrumbs={[{ label: "Trang chủ", to: "/" }, { label: "Tài liệu", to: "/documents" }, ...currentPath.map(f => ({ label: f.name, id: f.id }))]}
				onCrumbClick={(item) => {
					// If crumb has an id, navigate to that folder; if it's the second crumb (Tài liệu), go to root
					if (item.id) {
						setCurrentFolderId(item.id);
					} else if (item.to === "/documents" || item.label === "Tài liệu") {
						setCurrentFolderId(null);
					} else if (item.to === "/") {
						setCurrentFolderId(null);
					}
				}}
			/>

			<Card>
				<CardHeader>
					<CardTitle></CardTitle>
					<DocumentToolbar
						search={search}
						setSearch={setSearch}
						viewMode={viewMode}
						setViewMode={setViewMode}
						onUploadClick={startUploadModal}
						onCreateFolderClick={() => setIsCreateOpen(true)}
					/>
				</CardHeader>
				<CardContent>
					{loading && (
						<div className="flex items-center justify-center py-8">
							<div className="text-gray-500">Đang tải...</div>
								</div>
					)}
					{!loading && (
						<div
							onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
							onDragLeave={() => setIsDragging(false)}
							onDrop={onDrop}
							className={`rounded-md ${isDragging ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
						>
							{viewMode === "grid" ? (
								<DocumentGrid
									folders={visibleFolders}
									files={visibleFiles}
									currentFolderId={currentFolderId}
									onFolderClick={setCurrentFolderId}
									onUpLevel={goUpOneLevel}
									onToggleFavorite={toggleFavorite}
									onShare={openShare}
									onDelete={confirmDelete}
									onRename={handleRename}
									onPermission={handlePermission}
									onSharedUsers={handleSharedUsers}
									openMenu={openMenu}
									setOpenMenu={setOpenMenu}
								/>
							) : (
								<DocumentList
									folders={visibleFolders}
									files={visibleFiles}
									currentFolderId={currentFolderId}
									onFolderClick={setCurrentFolderId}
									onUpLevel={goUpOneLevel}
									onToggleFavorite={toggleFavorite}
									onShare={openShare}
									onDelete={confirmDelete}
									onRename={handleRename}
									onPermission={handlePermission}
									onSharedUsers={handleSharedUsers}
									openMenu={openMenu}
									setOpenMenu={setOpenMenu}
								/>
							)}
						</div>
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

					<DeleteModal
						isOpen={!!deleteItem}
						onClose={() => setDeleteItem(null)}
						deleteItem={deleteItem}
						onConfirm={onConfirmDelete}
					/>

					<UploadModal
						isOpen={isUploadOpen}
						onClose={() => setIsUploadOpen(false)}
						uploadDrag={uploadDrag}
						setUploadDrag={setUploadDrag}
						uploadFiles={uploadFiles}
						setUploadFiles={setUploadFiles}
						fileInputRef={fileInputRef}
						onComplete={completeUpload}
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
				</CardContent>
			</Card>
		</div>
	);
}

