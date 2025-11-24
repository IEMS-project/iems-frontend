import React, { useEffect } from "react";

// Modal accepts both `open` and `isOpen` props for backwards/alternate compatibility.
export default function Modal({ open, isOpen, onClose, title, children, footer, className = "" }) {
	const visible = open ?? isOpen;

	useEffect(() => {
		if (visible) {
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [visible]);

	if (!visible) return null;
    
	return (
		<div 
			className="fixed inset-0 z-[9999] flex items-center justify-center m-0 p-0"
			style={{ 
				margin: 0,
				padding: 0
			}}
		>
			<div 
				className="absolute inset-0 bg-black/60 backdrop-blur-sm m-0 p-0" 
				onClick={onClose}
				style={{
					margin: 0,
					padding: 0
				}}
			/>
			<div className={`relative z-10 w-full max-w-lg mx-4 my-auto overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-2xl ${className}`}>
				{title && (
					<div className="border-b border-border px-4 py-3 text-base font-semibold">
						{title}
					</div>
				)}
				<div className="p-4">
					{children}
				</div>
				{footer && (
					<div className="border-t border-border px-4 py-3">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
