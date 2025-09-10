import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PageHeader from "../components/common/PageHeader";

// Mock data based on user's sample API responses
const mockFolders = [
	{ id: "fe45de6e-98bf-4af4-95b4-1b0e89e8f824", name: "folder_1", parentId: null, ownerId: "a35b5506-ba88-47ad-86bc-87efae610f0e", createdAt: "2025-09-08T03:07:22.751596Z" },
	{ id: "a93856bf-8e67-4e91-ac57-e9416b278c76", name: "test", parentId: null, ownerId: "a35b5506-ba88-47ad-86bc-87efae610f0e", createdAt: "2025-09-08T06:33:35.102565Z" },
	{ id: "a389e207-3491-443c-8c82-e31a83431a84", name: "test", parentId: "fe45de6e-98bf-4af4-95b4-1b0e89e8f824", ownerId: "a35b5506-ba88-47ad-86bc-87efae610f0e", createdAt: "2025-09-08T06:33:40.364709Z" },
];

const mockFiles = [
	{ id: "e786a703-7c62-47d4-991e-3d7693995485", name: "Logo_Trường_Đại_Học_Sư_Phạm_Kỹ_Thuật_TP_Hồ_Chí_Minh.png", folderId: "fe45de6e-98bf-4af-95b4-1b0e89e8f824", ownerId: "a35b5506-ba88-47ad-86bc-87efae610f0e", path: "owners/a35.../1757300943986-Logo.png", size: 39385, type: "image/png", permission: "SHARED", createdAt: "2025-09-08T03:09:04.030589Z" },
	{ id: "8e0e9ca0-4fc4-4dbc-ac21-32b3fe13823e", name: "logo.png", folderId: "fe45de6e-98bf-4af-95b4-1b0e89e8f824", ownerId: "a35b5506-ba88-47ad-86bc-87efae610f0e", path: "owners/a35.../1757313064437-logo.png", size: 56595, type: "image/png", permission: "PRIVATE", createdAt: "2025-09-08T06:31:04.4561Z" },
	{ id: "513dd29b-7e8e-4d6f-a9f5-a8ea3886b673", name: "favicon.png", folderId: "a389e207-3491-443c-8c82-e31a83431a84", ownerId: "a35b5506-ba88-47ad-86bc-87efae610f0e", path: "owners/a35.../1757313231048-favicon.png", size: 21144, type: "image/png", permission: "PRIVATE", createdAt: "2025-09-08T06:33:51.058083Z" },
];

function humanSize(bytes) {
	if (bytes == null) return "-";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
	const [folders, setFolders] = useState(mockFolders);
	const [files, setFiles] = useState(mockFiles);
	const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
	const [search, setSearch] = useState("");
	const [viewMode, setViewMode] = useState("grid"); // grid | list

	const currentPath = useMemo(() => {
		const idToFolder = new Map(folders.map(f => [f.id, f]));
		const path = [];
		let cursor = currentFolderId ? idToFolder.get(currentFolderId) : null;
		while (cursor) {
			path.unshift(cursor);
			cursor = cursor.parentId ? idToFolder.get(cursor.parentId) : null;
		}
		return path;
	}, [folders, currentFolderId]);

	const idToFolder = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders]);

	function goUpOneLevel() {
		if (!currentFolderId) return;
		const current = idToFolder.get(currentFolderId);
		setCurrentFolderId(current?.parentId ?? null);
	}

	const visibleFolders = useMemo(() => folders.filter(f => f.parentId === currentFolderId && f.name.toLowerCase().includes(search.toLowerCase())), [folders, currentFolderId, search]);
	const visibleFiles = useMemo(() => files.filter(f => f.folderId === currentFolderId && f.name.toLowerCase().includes(search.toLowerCase())), [files, currentFolderId, search]);

	function onCreateFolder() {
		const name = prompt("Tên thư mục mới");
		if (!name) return;
		const newFolder = { id: crypto.randomUUID(), name, parentId: currentFolderId, ownerId: "me", createdAt: new Date().toISOString() };
		setFolders(prev => [...prev, newFolder]);
	}

	function onCreateFile() {
		const name = prompt("Tên tệp mới (vd: document.txt)");
		if (!name) return;
		const size = Math.floor(Math.random() * 200000) + 1024;
		const type = name.includes('.') ? `application/${name.split('.').pop()}` : "application/octet-stream";
		const newFile = { id: crypto.randomUUID(), name, folderId: currentFolderId, ownerId: "me", path: "mock", size, type, permission: "PRIVATE", createdAt: new Date().toISOString() };
		setFiles(prev => [...prev, newFile]);
	}

	return (
		<div className="space-y-6">
			<PageHeader breadcrumbs={[{ label: "Drive", to: "/documents" }, ...currentPath.map(f => ({ label: f.name, to: "#" }))]} />

			<Card>
				<CardHeader>
					<CardTitle></CardTitle>
					<div className="flex items-center gap-2">
						<Input
							type="text"
							placeholder="Tìm kiếm trong Drive"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						<Button variant="secondary" onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}>{viewMode === "grid" ? "Danh sách" : "Lưới"}</Button>
						<Button onClick={onCreateFolder}>+ Thư mục</Button>
						<Button onClick={onCreateFile}>+ Tệp</Button>
					</div>
				</CardHeader>
				<CardContent>
					{viewMode === "grid" ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
							{/* Up one level */}
							{currentFolderId && (
								<button onClick={goUpOneLevel} className="group flex flex-col rounded border border-gray-200 p-3 text-left hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:bg-gray-800/40">
									<div className="mb-2 h-10 w-12 rounded bg-gray-300" />
									<div className="font-medium">..</div>
								</button>
							)}
							{visibleFolders.map(f => (
								<button key={f.id} onClick={() => setCurrentFolderId(f.id)} className="group flex flex-col rounded border border-gray-200 p-3 text-left hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:bg-gray-800/40">
									<div className="mb-2 h-10 w-12 rounded bg-yellow-400/80 flex items-center justify-center">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-yellow-900/80"><path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path><path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path></svg>
									</div>
									<div className="truncate font-medium">{f.name}</div>
									<div className="text-xs text-gray-500">Thư mục</div>
								</button>
							))}
							{visibleFolders.length === 0 && visibleFiles.length === 0 && (
								<div className="text-sm text-gray-500">Thư mục trống</div>
							)}
						</div>
					) : (
						<div className="w-full overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
								<thead>
									<tr className="text-left text-gray-500 dark:text-gray-400">
										<th className="px-4 py-2 font-medium">Tên</th>
										<th className="px-4 py-2 font-medium">Loại</th>
										<th className="px-4 py-2 font-medium">Kích thước</th>
										<th className="px-4 py-2 font-medium">Ngày tạo</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
									{currentFolderId && (
										<tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 cursor-pointer" onClick={goUpOneLevel}>
											<td className="px-4 py-3 font-medium">..</td>
											<td className="px-4 py-3">-</td>
											<td className="px-4 py-3">-</td>
											<td className="px-4 py-3">-</td>
										</tr>
									)}
									{visibleFolders.map(f => (
										<tr key={f.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 cursor-pointer" onClick={() => setCurrentFolderId(f.id)}>
											<td className="px-4 py-3 font-medium flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-yellow-600"><path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path><path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path></svg><span>{f.name}</span></td>
											<td className="px-4 py-3">Thư mục</td>
											<td className="px-4 py-3">-</td>
											<td className="px-4 py-3">{new Date(f.createdAt).toLocaleString()}</td>
										</tr>
									))}
									{visibleFiles.map(file => (
										<tr key={file.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
											<td className="px-4 py-3 font-medium">{file.name}</td>
											<td className="px-4 py-3">{file.type || "Tệp"}</td>
											<td className="px-4 py-3">{humanSize(file.size)}</td>
											<td className="px-4 py-3">{new Date(file.createdAt).toLocaleString()}</td>
										</tr>
									))}
									{visibleFolders.length === 0 && visibleFiles.length === 0 && (
										<tr>
											<td className="px-4 py-3" colSpan={4}>Thư mục trống</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}

					{viewMode === "grid" && visibleFiles.length > 0 && (
						<>
							<div className="mt-4 text-xs uppercase tracking-wide text-gray-500">Tệp</div>
							<div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
								{visibleFiles.map(file => (
									<div key={file.id} className="group rounded border border-gray-200 p-3 hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:bg-gray-800/40">
										<div className="mb-2 h-20 w-full rounded bg-gray-100 dark:bg-gray-800" />
										<div className="truncate font-medium">{file.name}</div>
										<div className="text-xs text-gray-500">{humanSize(file.size)}</div>
									</div>
								))}
							</div>
						</>
					)}
				</CardContent>
			</Card>


		</div>
	);
}


