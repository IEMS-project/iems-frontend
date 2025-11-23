import React from "react";

function Skeleton({ className = "", ...props }) {
	return (
		<div
			className={`animate-pulse rounded-md bg-gray-200/80 dark:bg-gray-700/60 ${className}`}
			{...props}
		/>
	);
}

// Export both default and named for compatibility
export default Skeleton;
export { Skeleton };
