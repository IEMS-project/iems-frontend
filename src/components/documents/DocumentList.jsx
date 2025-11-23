import React from "react";
import DropdownPortal from "../ui/DropdownPortal";
import { getStoredTokens } from "../../lib/api";
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
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#DC2626" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Word
	if (['doc', 'docx'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2B579A" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Excel
	if (['xls', 'xlsx'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1D6F42" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// PowerPoint
	if (['ppt', 'pptx'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#D04423" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Images
	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" className="h-6 w-6">
				<path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5Z" />
			</svg>
		);
	}
	
	// Videos
	if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" className="h-6 w-6">
				<path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
			</svg>
		);
	}
	
	// Audio
	if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8B5CF6" className="h-6 w-6">
				<path d="M14,3H6A2,2 0 0,0 4,5V19A2,2 0 0,0 6,21H18A2,2 0 0,0 20,19V9L14,3M18,19H6V5H13V10H18M12,11A3,3 0 0,0 9,14A3,3 0 0,0 12,17A3,3 0 0,0 15,14A3,3 0 0,0 12,11M7,4H5V5H7M8,4H9V6H7M9,7V8H7V7M5,7H7V8H5" />
			</svg>
		);
	}
	
	// Archives
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Code files
	if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Text files
	if (['txt', 'md', 'rtf'].includes(ext)) {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" className="h-6 w-6">
				<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
			</svg>
		);
	}
	
	// Default file icon
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280" className="h-6 w-6">
			<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
		</svg>
	);
}

export default function DocumentList({ 
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
	setOpenMenu 
}) {
	return (
		<div className="w-full overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
				<thead>
					<tr className="text-left text-gray-500 dark:text-gray-400">
						<th className="px-4 py-2 font-medium">Tên</th>
						<th className="px-4 py-2 font-medium">Loại</th>
						<th className="px-4 py-2 font-medium">Kích thước</th>
						<th className="px-4 py-2 font-medium">Ngày tạo</th>
						<th className="px-4 py-2 font-medium text-right">Hành động</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
					{currentFolderId && (
						<tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 cursor-pointer" onClick={onUpLevel}>
							<td className="px-4 py-3 font-medium">..</td>
							<td className="px-4 py-3">-</td>
							<td className="px-4 py-3">-</td>
							<td className="px-4 py-3">-</td>
							<td className="px-4 py-3"></td>
						</tr>
					)}

					{/* Folders */}
					{folders.map(f => {
						const tokens = getStoredTokens();
						const currentUserId = tokens?.userInfo?.userId;
						const isOwner = currentUserId && String(currentUserId) === String(f.ownerId);
						return (
							<tr key={f.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
								<td className="px-4 py-3 font-medium flex items-center gap-2 cursor-pointer" onClick={() => onFolderClick(f.id)}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-yellow-600">
										<path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
										<path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
									</svg>
									<span>{f.name}</span>
									{f.permission === "PUBLIC" ? (
										<FaGlobe className="h-5 w-5" />
									) : (
										<FaLock className="h-5 w-5" />
									)}
								</td>
								<td className="px-4 py-3">Thư mục</td>
								<td className="px-4 py-3">-</td>
								<td className="px-4 py-3">{new Date(f.createdAt).toLocaleDateString()}</td>
								<td className="px-4 py-3">
									<div className="relative flex items-center justify-end gap-3">
										<button onClick={() => onToggleFavorite(f, "folder")} className="text-gray-600 hover:text-yellow-500" title="Yêu thích">{renderFavoriteIcon(!!f.favorite)}</button>
										<button data-dropdown-trigger="true" onClick={(e) => {
											const rect = e.currentTarget.getBoundingClientRect();
											setOpenMenu(prev => (prev.id === f.id && prev.type === "folder" ? { id: null, type: null, anchorRect: null } : { id: f.id, type: "folder", anchorRect: rect }));
										}} className="text-gray-600 hover:text-gray-900" title=":">{renderKebabIcon()}</button>
										{openMenu.id === f.id && openMenu.type === "folder" && openMenu.anchorRect && (
											<DropdownPortal anchorRect={openMenu.anchorRect}>
												<div className="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
													{isOwner ? (
														<>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaEdit className="h-4 w-4" /><span>Đổi tên</span></button>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaLock className="h-4 w-4" /><span>Thuộc tính</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>{renderShareIcon()}<span>Chia sẻ</span></button>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaUsers className="h-4 w-4" /><span>Người dùng đã chia sẻ</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onMove(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaFolder className="h-4 w-4" /><span>Di chuyển</span></button>
														</>
													) : (
															<div className="px-2 py-2 text-sm text-gray-500">Bạn không có quyền chỉnh sửa</div>
													)}
												</div>
											</DropdownPortal>
										)}
									</div>
								</td>
							</tr>
						);
					})}

					{/* Files */}
					{files.map(file => {
						const tokens = getStoredTokens();
						const currentUserId = tokens?.userInfo?.userId;
						const isOwner = currentUserId && String(currentUserId) === String(file.ownerId);
						return (
							<tr key={file.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
								<td className="px-4 py-3 font-medium flex items-center gap-2">
									{getFileIcon(file.name)}
									<span>{file.name}</span>
								</td>
								<td className="px-4 py-3">{file.type || "Tệp"}</td>
								<td className="px-4 py-3">{humanSize(file.size)}</td>
								<td className="px-4 py-3">{new Date(file.createdAt).toLocaleDateString()}</td>
								<td className="px-4 py-3">
									<div className="relative flex items-center justify-end gap-3">
										<button onClick={() => onToggleFavorite(file, "file")} className="text-gray-600 hover:text-yellow-500" title="Yêu thích">{renderFavoriteIcon(!!file.favorite)}</button>
										<button data-dropdown-trigger="true" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setOpenMenu(prev => (prev.id === file.id && prev.type === "file" ? { id: null, type: null, anchorRect: null } : { id: file.id, type: "file", anchorRect: rect })); }} className="text-gray-600 hover:text-gray-900" title=":">{renderKebabIcon()}</button>
										{openMenu.id === file.id && openMenu.type === "file" && openMenu.anchorRect && (
											<DropdownPortal anchorRect={openMenu.anchorRect}>
												<div className="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
													{isOwner ? (
														<>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaEdit className="h-4 w-4" /><span>Đổi tên</span></button>
														<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaLock className="h-4 w-4" /><span>Thuộc tính</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>{renderShareIcon()}<span>Chia sẻ</span></button>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaUsers className="h-4 w-4" /><span>Người dùng đã chia sẻ</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onMove(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><FaFolder className="h-4 w-4" /><span>Di chuyển</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100 text-red-600" onClick={() => { onDelete(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>{renderDeleteIcon()}<span>Xóa</span></button>
														</>
													) : (
														<div className="px-2 py-2 text-sm text-gray-500">Bạn không có quyền chỉnh sửa</div>
													)}
												</div>
											</DropdownPortal>
										)}
									</div>
								</td>
							</tr>
						);
					})}

					{folders.length === 0 && files.length === 0 && (
						<tr>
							<td className="px-4 py-3" colSpan={5}>Kéo & thả tệp vào đây để tải lên</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
