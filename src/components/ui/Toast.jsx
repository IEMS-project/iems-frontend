import React, { useState } from "react";

export default function Toast({ 
	id,
	title,
	message,
	description,
	action,
	onClose,
	className = "" 
}) {
	const [isExiting, setIsExiting] = useState(false);

	const handleClose = () => {
		setIsExiting(true);
		setTimeout(() => {
			if (onClose) onClose(id);
		}, 300); // Animation duration
	};

	const handleAction = () => {
		if (action?.onClick) {
			action.onClick();
			if (action.dismissOnClick !== false) {
				handleClose();
			}
		}
	};

	return (
		<div 
			className={`w-80 bg-white rounded-lg shadow-lg p-4 border border-gray-200 ${className} transform transition-all duration-300 ${
				isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
			}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					{title && (
						<div className="font-semibold text-gray-900 text-sm mb-1">
							{title}
						</div>
					)}
					{message && !title && (
						<div className="font-semibold text-gray-900 text-sm mb-1">
							{message}
						</div>
					)}
					{description && (
						<div className="text-xs text-gray-600 mt-0.5">
							{description}
						</div>
					)}
				</div>
				<div className="flex items-start gap-2 flex-shrink-0">
					{action && (
						<button
							onClick={handleAction}
							className="px-3 py-1.5 text-xs font-medium rounded transition-colors bg-gray-900 text-white hover:bg-gray-800"
						>
							{action.label || 'Undo'}
						</button>
					)}
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
						aria-label="Đóng"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

