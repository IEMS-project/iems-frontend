import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const variantStyles = {
	default: "text-muted-foreground hover:bg-muted/60 dark:hover:bg-muted/20",
	edit: "text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10",
	danger: "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10",
	success: "text-green-600 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-500/10",
};

export default function IconActionButton({
	icon: Icon,
	label,
	variant = "default",
	className = "",
	...props
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={cn(
				"h-8 w-8 rounded-full border border-transparent transition-colors",
				variantStyles[variant] || variantStyles.default,
				className
			)}
			title={label}
			aria-label={label}
			{...props}
		>
			{Icon ? <Icon className="h-4 w-4" /> : null}
		</Button>
	);
}



