import React, { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer, className = "" }) {
	useEffect(() => {
		if (open) {
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [open]);

	if (!open) return null;
	
	return (
		<div 
			className="fixed z-[9999] flex items-center justify-center" 
			style={{ 
				top: 0, 
				left: 0, 
				right: 0, 
				bottom: 0,
				width: '100vw',
				height: '100vh',
				minHeight: '100vh',
				position: 'fixed'
			}}
		>
			<div 
				className="absolute bg-black/50" 
				onClick={onClose}
				style={{ 
					top: 0, 
					left: 0, 
					right: 0, 
					bottom: 0,
					width: '100vw',
					height: '100vh',
					minHeight: '100vh',
					position: 'absolute'
				}}
			/>
			<div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 ${className}`}>
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
