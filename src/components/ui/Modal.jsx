import React, { useEffect, useRef } from "react";

// Modal accepts both `open` and `isOpen` props for backwards/alternate compatibility.
export default function Modal({ open, isOpen, onClose, title, children, footer, className = "", contentClassName = "" }) {
	const visible = open ?? isOpen;
	const dialogRef = useRef(null);
	const previousActiveElementRef = useRef(null);

	useEffect(() => {
		if (visible) {
			previousActiveElementRef.current = document.activeElement;
			document.body.style.overflow = 'hidden';

			const focusableSelector = [
				'a[href]',
				'button:not([disabled])',
				'textarea:not([disabled])',
				'input:not([disabled])',
				'select:not([disabled])',
				'[tabindex]:not([tabindex="-1"])',
			].join(',');

			const focusFirst = () => {
				const focusable = dialogRef.current?.querySelectorAll(focusableSelector);
				const first = focusable?.[0] || dialogRef.current;
				first?.focus?.();
			};

			const focusTimer = window.setTimeout(focusFirst, 0);
			const handleKeyDown = (event) => {
				if (event.key === "Escape") {
					event.stopPropagation();
					onClose?.();
					return;
				}

				if (event.key !== "Tab") return;

				const focusable = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || [])
					.filter((element) => element.offsetParent !== null);
				if (focusable.length === 0) {
					event.preventDefault();
					dialogRef.current?.focus();
					return;
				}

				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			};

			document.addEventListener("keydown", handleKeyDown, true);
			return () => {
				window.clearTimeout(focusTimer);
				document.removeEventListener("keydown", handleKeyDown, true);
				document.body.style.overflow = 'unset';
				previousActiveElementRef.current?.focus?.();
			};
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
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				tabIndex={-1}
				className={`relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 my-auto flex flex-col rounded-lg border border-border bg-card text-foreground shadow-2xl ${className}`}
			>
				{title && (
					<div className="border-b border-border px-4 py-3 text-base font-semibold flex-shrink-0 break-words">
						{title}
					</div>
				)}
				<div className={`p-4 overflow-y-auto flex-1 ${contentClassName}`}>
					{children}
				</div>
				{footer && (
					<div className="border-t border-border px-4 py-3 flex-shrink-0">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
