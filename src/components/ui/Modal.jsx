import React from "react";

export default function Modal({ open, onClose, title, children, footer, className = "" }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 ${className}`}>
				{title && (
					<div className="border-b border-gray-200 px-4 py-3 text-base font-semibold dark:border-gray-800">
						{title}
					</div>
				)}
				<div className="p-4">
					{children}
				</div>
				{footer && (
					<div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
