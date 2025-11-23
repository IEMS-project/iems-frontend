import React from "react";
import { getStoredTokens } from "../../lib/api";
import DropdownPortal from "../ui/DropdownPortal";
import { FaStar, FaRegStar, FaShare, FaTrash, FaEllipsisV, FaEdit, FaLock, FaUsers, FaFolder, FaGlobe } from "react-icons/fa";

function humanSize(bytes) {
	if (bytes == null) return "-";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderFavoriteIcon(active) {
	return active ? (
		<FaStar className="h-6 w-6 text-yellow-500" />
	) : (
		<FaRegStar className="h-6 w-6" />
	);
}

function renderShareIcon() {
	return <FaShare className="h-5 w-5" />;
}

function renderDeleteIcon() {
	return <FaTrash className="h-5 w-5" />;
}

function renderKebabIcon() {
	return <FaEllipsisV className="h-6 w-6" />;
}

function getFileIcon(fileName) {
	if (!fileName) return null;
	
	const ext = fileName.split('.').pop()?.toLowerCase();
	
	// PDF
	if (ext === 'pdf') {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#DC2626" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Word
	if (['doc', 'docx'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2B579A" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Excel
	if (['xls', 'xlsx'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1D6F42" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// PowerPoint
	if (['ppt', 'pptx'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#D04423" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Images
	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" className="h-12 w-12">
				<path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5Z" />
			</svg>
		);
	}
	
	// Videos
	if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" className="h-12 w-12">
				<path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
			</svg>
		);
	}
	
	// Audio
	if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8B5CF6" className="h-12 w-12">
				<path d="M14,3H6A2,2 0 0,0 4,5V19A2,2 0 0,0 6,21H18A2,2 0 0,0 20,19V9L14,3M18,19H6V5H13V10H18M12,11A3,3 0 0,0 9,14A3,3 0 0,0 12,17A3,3 0 0,0 15,14A3,3 0 0,0 12,11M7,4H5V5H7M8,4H9V6H7M9,7V8H7V7M5,7H7V8H5" />
			</svg>
		);
	}
	
	// Archives
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Code files
	if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Text files
	if (['txt', 'md', 'rtf'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" className="h-12 w-12">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Default file icon
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" className="h-12 w-12">
			<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
		</svg>
	);
}

export default function DocumentGrid({
	folders,
	files,
	currentFolderId,
	onFolderClick,
	onUpLevel,
	onToggleFavorite,
	onShare,
	onDelete,
	onRename,
	onPermission,
	onSharedUsers,
	onMove,
	openMenu,
	setOpenMenu,
}) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
			{/* Up one level */}
			{currentFolderId && (
				<button onClick={onUpLevel} className="group flex flex-col rounded border border-gray-200 p-3 text-left hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:bg-gray-800/40">
					<div className="mb-2 h-12 w-16 rounded bg-gray-300" />
					<div className="font-medium">..</div>
				</button>
			)}

			{/* Folders */}
			{folders.map((f) => {
				const tokens = getStoredTokens();
				const currentUserId = tokens?.userInfo?.userId;
				const isOwner = currentUserId && String(currentUserId) === String(f.ownerId);

				return (
					<div key={f.id} className="group relative flex flex-col rounded border border-gray-200 p-3 hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:bg-gray-800/40">
						<button onClick={() => onFolderClick(f.id)} className="text-left w-full">
							<div className="mb-2 h-12 w-16 rounded bg-yellow-400/80 flex items-center justify-center">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-yellow-900/80">
									<path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
									<path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
								</svg>
							</div>

							<div className="truncate font-medium flex items-center gap-1">
								<span>{f.name}</span>
								{f.permission === "PUBLIC" ? (
									<FaGlobe className="h-4 w-4" />
								) : (
									<FaLock className="h-4 w-4" />
								)}
							</div>
							<div className="text-xs text-gray-500">Thư mục</div>
						</button>

						<div className="absolute right-2 top-2 z-10 flex items-center gap-2">
							<button onClick={() => onToggleFavorite(f, "folder")} className="p-1 rounded bg-white/70 hover:bg-white text-gray-600 hover:text-yellow-500" title="Yêu thích">
								{renderFavoriteIcon(!!f.favorite)}
							</button>

							<button
								data-dropdown-trigger="true"
								onClick={(e) => {
									const rect = e.currentTarget.getBoundingClientRect();
									setOpenMenu((prev) =>
										prev.id === f.id && prev.type === "folder" ? { id: null, type: null, anchorRect: null } : { id: f.id, type: "folder", anchorRect: rect }
									);
								}}
								className="p-1 rounded bg-white/70 hover:bg-white text-gray-600 hover:text-gray-900"
								title=":"
							>
								{renderKebabIcon()}
							</button>
						</div>

						{openMenu.id === f.id && openMenu.type === "folder" && openMenu.anchorRect && (
							<DropdownPortal anchorRect={openMenu.anchorRect}>
								<div className="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
									{isOwner ? (
										<>
											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaEdit className="h-4 w-4" />
												<span>Đổi tên</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaLock className="h-4 w-4" />
												<span>Thuộc tính</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												{renderShareIcon()}<span>Chia sẻ</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaUsers className="h-4 w-4" />
												<span>Người dùng đã chia sẻ</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onMove(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaFolder className="h-4 w-4" />
												<span>Di chuyển</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100 text-red-600" onClick={() => { onDelete(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												{renderDeleteIcon()}<span>Xóa</span>
											</button>
										</>
									) : (
										<div className="px-2 py-2 text-sm text-gray-500">Bạn không có quyền chỉnh sửa</div>
									)}
								</div>
							</DropdownPortal>
						)}
					</div>
				);
			})}

			{/* Files */}
			{files.map((file) => {
				const tokens = getStoredTokens();
				const currentUserId = tokens?.userInfo?.userId;
				const isOwner = currentUserId && String(currentUserId) === String(file.ownerId);

				return (
					<div key={file.id} className="group relative rounded border border-gray-200 p-3 hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:bg-gray-800/40">
						<div className="absolute right-2 top-2 z-10 flex items-center gap-2">
							<button onClick={() => onToggleFavorite(file, "file")} className="p-1 rounded bg-white/70 hover:bg-white text-gray-600 hover:text-yellow-500" title="Yêu thích">
								{renderFavoriteIcon(!!file.favorite)}
							</button>

							<button
								data-dropdown-trigger="true"
								onClick={(e) => {
									const rect = e.currentTarget.getBoundingClientRect();
									setOpenMenu((prev) => (prev.id === file.id && prev.type === "file" ? { id: null, type: null, anchorRect: null } : { id: file.id, type: "file", anchorRect: rect }));
								}}
								className="p-1 rounded bg-white/70 hover:bg-white text-gray-600 hover:text-gray-900"
								title=":"
							>
								{renderKebabIcon()}
							</button>
						</div>

						<div className="mb-2 h-20 w-full rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
							{getFileIcon(file.name)}
						</div>
						<div className="truncate font-medium">{file.name}</div>
						<div className="text-xs text-gray-500">{humanSize(file.size)}</div>

						{openMenu.id === file.id && openMenu.type === "file" && openMenu.anchorRect && (
							<DropdownPortal anchorRect={openMenu.anchorRect}>
								<div className="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
									{isOwner ? (
										<>
											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaEdit className="h-4 w-4" />
												<span>Đổi tên</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaLock className="h-4 w-4" />
												<span>Thuộc tính</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												{renderShareIcon()}<span>Chia sẻ</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaUsers className="h-4 w-4" />
												<span>Người dùng đã chia sẻ</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onMove(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<FaFolder className="h-4 w-4" />
												<span>Di chuyển</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100 text-red-600" onClick={() => { onDelete(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												{renderDeleteIcon()}<span>Xóa</span>
											</button>
										</>
									) : (
										<div className="px-2 py-2 text-sm text-gray-500">Bạn không có quyền chỉnh sửa</div>
									)}
								</div>
							</DropdownPortal>
						)}
					</div>
				);
			})}

			{files.length === 0 && folders.length === 0 && (
				<div className="text-sm text-gray-500">Kéo & thả tệp vào đây để tải lên</div>
			)}
		</div>
	);
}


