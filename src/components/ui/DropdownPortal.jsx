import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function DropdownPortal({ anchorRect, children, offset = 4 }) {
	const [container] = useState(() => document.createElement("div"));

	useEffect(() => {
		container.style.position = "fixed"; // fixed to viewport
		document.body.appendChild(container);
		container.setAttribute('data-dropdown-portal', 'true');
		return () => {
			document.body.removeChild(container);
		};
	}, [container]);

	useEffect(() => {
		if (!anchorRect) return;
		const { top, left, width, height, right, bottom } = anchorRect;

		// Estimate size, then correct after mount
		let child = container.firstElementChild;
		let menuWidth = (child && child.offsetWidth) || 160;
		let menuHeight = (child && child.offsetHeight) || 80;

		// Position below the anchor, right-aligned to the anchor
		let targetTop = bottom + offset;
		let targetLeft = right; // align right edge, then translateX(-100%)

		// Clamp inside viewport
		const viewportPadding = 8;
		if (targetLeft - menuWidth < viewportPadding) {
			targetLeft = Math.max(menuWidth + viewportPadding, targetLeft);
		}
		if (targetLeft > window.innerWidth - viewportPadding) {
			targetLeft = window.innerWidth - viewportPadding;
		}
		if (targetTop + menuHeight > window.innerHeight - viewportPadding) {
			targetTop = Math.max(viewportPadding, window.innerHeight - menuHeight - viewportPadding);
		}

		container.style.top = `${targetTop}px`;
		container.style.left = `${targetLeft}px`;
		container.style.transform = "translateX(-100%)"; // right align
		container.style.zIndex = 9999;
		container.style.pointerEvents = 'auto';
	}, [anchorRect, container, offset]);

	if (!anchorRect) return null;

	return createPortal(
		<div>
			{children}
		</div>,
		container
	);
}
