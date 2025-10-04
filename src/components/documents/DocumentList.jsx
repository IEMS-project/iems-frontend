import React from "react";
import DropdownPortal from "../ui/DropdownPortal";
import { getStoredTokens } from "../../lib/api";

function humanSize(bytes) {
	if (bytes == null) return "-";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderFavoriteIcon(active) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "#f59e0b" : "none"} stroke={active ? "#f59e0b" : "currentColor"} className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
		</svg>
	);
}

function renderShareIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 12a4.5 4.5 0 118.25 2.598m-8.25 0A4.5 4.5 0 1012 6v12a4.5 4.5 0 10-4.5-3.402z" />
		</svg>
	);
}

function renderDeleteIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 7h12m-9 0V5a1 1 0 011-1h4a1 1 0 011 1v2m-1 4v6m-4-6v6m-7 4h14a2 2 0 002-2V7H4v12a2 2 0 002 2z" />
		</svg>
	);
}

function renderKebabIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
			<path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 22a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
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
								</td>
								<td className="px-4 py-3">Thư mục {f.permission === "PUBLIC" ? "• 🌐 Công khai" : "• 🔒 Riêng tư"}</td>
								<td className="px-4 py-3">-</td>
								<td className="px-4 py-3">{new Date(f.createdAt).toLocaleString()}</td>
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
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><span>🖊️</span><span>Đổi tên</span></button>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><span>🔒</span><span>Thuộc tính</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>{renderShareIcon()}<span>Chia sẻ</span></button>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><span>👥</span><span>Người dùng đã chia sẻ</span></button>
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
								<td className="px-4 py-3 font-medium">{file.name}</td>
								<td className="px-4 py-3">{file.type || "Tệp"}</td>
								<td className="px-4 py-3">{humanSize(file.size)}</td>
								<td className="px-4 py-3">{new Date(file.createdAt).toLocaleString()}</td>
								<td className="px-4 py-3">
									<div className="relative flex items-center justify-end gap-3">
										<button onClick={() => onToggleFavorite(file, "file")} className="text-gray-600 hover:text-yellow-500" title="Yêu thích">{renderFavoriteIcon(!!file.favorite)}</button>
										<button data-dropdown-trigger="true" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setOpenMenu(prev => (prev.id === file.id && prev.type === "file" ? { id: null, type: null, anchorRect: null } : { id: file.id, type: "file", anchorRect: rect })); }} className="text-gray-600 hover:text-gray-900" title=":">{renderKebabIcon()}</button>
										{openMenu.id === file.id && openMenu.type === "file" && openMenu.anchorRect && (
											<DropdownPortal anchorRect={openMenu.anchorRect}>
												<div className="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
													{isOwner ? (
														<>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><span>🖊️</span><span>Đổi tên</span></button>
															<div className="border-t my-1"></div>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>{renderShareIcon()}<span>Chia sẻ</span></button>
															<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}><span>👥</span><span>Người dùng đã chia sẻ</span></button>
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
