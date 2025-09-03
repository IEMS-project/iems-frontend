import React from "react";

export default function RightDrawer({ open, onClose, title, children }) {
	return (
		<div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
			<div className="absolute inset-y-0 right-0 flex h-full w-[360px] flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
				<div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 text-sm font-semibold dark:border-gray-800">
					<span>{title}</span>
					<button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
				</div>
				<div className="min-h-0 flex-1 overflow-auto p-4">
					{children}
				</div>
			</div>
			{open && <div className="fixed inset-0 bg-black/20" onClick={onClose} />}
		</div>
	);
}
