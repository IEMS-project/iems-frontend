import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Checkbox from "../components/ui/Checkbox";
import Input from "../components/ui/Input";
import PageHeader from "../components/common/PageHeader";

const initialUsers = [
	{ id: "u1", name: "Nguyễn Văn A" },
	{ id: "u2", name: "Trần Thị B" },
	{ id: "u3", name: "Lê Văn C" },
	{ id: "u4", name: "Phạm Thị D" },
];

const initialStructure = {
	root: {
		id: "root",
		name: "Tài liệu",
		folders: [
			{ id: "proj", name: "Dự án" },
			{ id: "design", name: "Thiết kế" },
			{ id: "reports", name: "Báo cáo" },
		],
		files: [
			{ id: "f1", name: "HDSD_IEMS.pdf", size: 1240, modified: "2025-01-02 10:20", owner: "Nguyễn Văn A", viewers: ["u1", "u2", "u3"] },
		],
	},
	proj: {
		id: "proj",
		name: "Dự án",
		folders: [
			{ id: "iems", name: "IEMS" },
		],
		files: [
			{ id: "f2", name: "Kế hoạch_Q1.xlsx", size: 540, modified: "2025-01-08 08:10", owner: "Trần Thị B", viewers: ["u2", "u3"] },
		],
	},
	iems: {
		id: "iems",
		name: "IEMS",
		folders: [],
		files: [
			{ id: "f3", name: "Spec_API.docx", size: 320, modified: "2025-01-10 14:00", owner: "Lê Văn C", viewers: ["u1", "u2", "u3", "u4"] },
		],
	},
	design: {
		id: "design",
		name: "Thiết kế",
		folders: [],
		files: [
			{ id: "f4", name: "UI_Main.fig", size: 8120, modified: "2025-01-05 16:30", owner: "Phạm Thị D", viewers: ["u4", "u1"] },
		],
	},
	reports: {
		id: "reports",
		name: "Báo cáo",
		folders: [],
		files: [],
	},
};

function humanSize(kb) {
	if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
	return `${kb} KB`;
}

// SidebarTree removed: No folder navigation UI

export default function Documents() {
	const [structure, setStructure] = useState(initialStructure);
	const [showUpload, setShowUpload] = useState(false);
	const [uploadData, setUploadData] = useState({
		name: '',
		file: null,
		folderId: 'root',
		viewers: new Set([initialUsers[0].id]),
	});
	const [search, setSearch] = useState('');

	const visibleFiles = useMemo(() => {
		const files = Object.values(structure).flatMap(f => f.files || []);
		if (!search.trim()) return files;
		const q = search.toLowerCase();
		return files.filter(f => f.name.toLowerCase().includes(q));
	}, [structure, search]);

	function onUploadSubmit() {
		if (!uploadData.name) return;
		const newFile = {
			id: `file_${Date.now()}`,
			name: uploadData.name,
			size: Math.floor(Math.random() * 900 + 100),
			modified: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
			owner: 'Bạn',
			viewers: Array.from(uploadData.viewers),
		};
		setStructure(prev => {
			const folder = prev[uploadData.folderId];
			const updated = { ...prev };
			updated[uploadData.folderId] = { ...folder, files: [...(folder.files || []), newFile] };
			return updated;
		});
		setShowUpload(false);
		setUploadData(d => ({ ...d, name: '', file: null }));
	}

	return (
		<>

			<div className="space-y-6">
				<PageHeader breadcrumbs={[{ label: "Tài liệu", to: "/documents" }]} />


				<Card>
					<CardHeader>
						<CardTitle>Danh sách</CardTitle>
						<div className="flex items-center gap-2">

							<Input
								type="text"
								placeholder="Tìm kiếm file..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
							<Button onClick={() => { setUploadData(d => ({ ...d, folderId: 'root' })); setShowUpload(true); }}>+ Tải lên</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="w-full overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
								<thead >
									<tr className="text-left text-gray-500 dark:text-gray-400">
										<th className="px-4 py-2 font-medium">Tên</th>
										<th className="px-4 py-2 font-medium">Chủ sở hữu</th>
										<th className="px-4 py-2 font-medium">Người xem</th>
										<th className="px-4 py-2 font-medium">Kích thước</th>
										<th className="px-4 py-2 font-medium">Cập nhật</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
									{visibleFiles.map((f) => (
										<tr key={f.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
											<td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{f.name}</td>
											<td className="px-4 py-3">{f.owner}</td>
											<td className="px-4 py-3">{f.viewers.length} người</td>
											<td className="px-4 py-3">{humanSize(f.size)}</td>
											<td className="px-4 py-3">{f.modified}</td>
										</tr>
									))}
									{visibleFiles.length === 0 && (
										<tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
											<td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100" colSpan={5}>Không có tài liệu</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>

			<Modal
				open={showUpload}
				onClose={() => setShowUpload(false)}
				title="Tải lên tài liệu"
				footer={
					<div className="flex justify-end gap-2">
						<Button variant="secondary" onClick={() => setShowUpload(false)}>Hủy</Button>
						<Button onClick={onUploadSubmit}>Tải lên</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Tên file</label>
						<input
							type="text"
							value={uploadData.name}
							onChange={(e) => setUploadData(d => ({ ...d, name: e.target.value }))}
							className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							placeholder="VD: BaoCao_Thang1.pdf"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Thư mục</label>
						<select
							value={uploadData.folderId}
							onChange={(e) => setUploadData(d => ({ ...d, folderId: e.target.value }))}
							className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
						>
							{Object.values(structure).map(folder => (
								<option key={folder.id} value={folder.id}>{folder.name}</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Người được xem</label>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{initialUsers.map(u => (
								<label key={u.id} className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={uploadData.viewers.has(u.id)}
										onChange={(e) => {
											setUploadData(d => {
												const next = new Set(d.viewers);
												if (e.target.checked) next.add(u.id); else next.delete(u.id);
												return { ...d, viewers: next };
											});
										}}
									/>
									<span>{u.name}</span>
								</label>
							))}
						</div>
						<p className="mt-1 text-xs text-gray-500">Mặc định bao gồm bạn và người được chọn.</p>
					</div>
				</div>
			</Modal>
		</>
	);
}
