import React from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

function renderListIcon(active) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-5 w-5 ${active ? "text-blue-600" : "text-gray-600"}`}>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h10" />
		</svg>
	);
}

function renderGridIcon(active) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-5 w-5 ${active ? "text-blue-600" : "text-gray-600"}`}>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
		</svg>
	);
}

export default function DocumentToolbar({ 
	search, 
	setSearch, 
	viewMode, 
	setViewMode, 
	onUploadClick, 
	onCreateFolderClick 
}) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-2">
				<Input
					type="text"
					placeholder="Tìm kiếm thư mục và tệp"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<div className="flex items-center rounded-md border border-gray-300 p-1">
					<button 
						aria-label="List view" 
						onClick={() => setViewMode("list")} 
						className={`h-8 w-8 grid place-items-center rounded ${viewMode === "list" ? "bg-blue-50" : "hover:bg-gray-100"}`}
					>
						{renderListIcon(viewMode === "list")}
					</button>
					<button 
						aria-label="Grid view" 
						onClick={() => setViewMode("grid")} 
						className={`h-8 w-8 grid place-items-center rounded ${viewMode === "grid" ? "bg-blue-50" : "hover:bg-gray-100"}`}
					>
						{renderGridIcon(viewMode === "grid")}
					</button>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button type="button" onClick={onUploadClick}>Tải tệp lên</Button>
				<Button type="button" onClick={onCreateFolderClick}>+ Thư mục</Button>
			</div>
		</div>
	);
}
