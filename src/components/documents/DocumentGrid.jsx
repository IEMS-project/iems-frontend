import React from "react";
import { getStoredTokens } from "../../lib/api";
import DropdownPortal from "../ui/DropdownPortal";

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
			<path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 22a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
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
							<div className="mb-2 h-12 w-16 rounded bg-yellow-400/80 flex items-center justify-center relative">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-yellow-900/80">
									<path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
									<path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
								</svg>
								{f.permission === "PUBLIC" && (
									<div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title="Công khai">
										🌐
									</div>
								)}
							</div>

							<div className="truncate font-medium">{f.name}</div>
							<div className="text-xs text-gray-500">Thư mục {f.permission === "PUBLIC" ? "• Công khai" : "• Riêng tư"}</div>
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
												<span>🖊️</span>
												<span>Đổi tên</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>🔒</span>
												<span>Thuộc tính</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												{renderShareIcon()}<span>Chia sẻ</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>👥</span>
												<span>Người dùng đã chia sẻ</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onMove(f, "folder"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>📁</span>
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

						<div className="mb-2 h-20 w-full rounded bg-gray-100 dark:bg-gray-800" />
						<div className="truncate font-medium">{file.name}</div>
						<div className="text-xs text-gray-500">{humanSize(file.size)}</div>

						{openMenu.id === file.id && openMenu.type === "file" && openMenu.anchorRect && (
							<DropdownPortal anchorRect={openMenu.anchorRect}>
								<div className="w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
									{isOwner ? (
										<>
											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onRename(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>🖊️</span>
												<span>Đổi tên</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onPermission(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>🔒</span>
												<span>Thuộc tính</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onShare(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												{renderShareIcon()}<span>Chia sẻ</span>
											</button>

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onSharedUsers(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>👥</span>
												<span>Người dùng đã chia sẻ</span>
											</button>

											<div className="border-t my-1" />

											<button className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-100" onClick={() => { onMove(file, "file"); setOpenMenu({ id: null, type: null, anchorRect: null }); }}>
												<span>📁</span>
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


