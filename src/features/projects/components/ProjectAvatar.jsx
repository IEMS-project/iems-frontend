import React from "react";
import { cn } from "@/lib/utils";

function getInitials(name = "") {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "P";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getSizeClass(size) {
    switch (size) {
        case "xs":
            return "h-6 w-6 text-[10px]";
        case "sm":
            return "h-8 w-8 text-xs";
        case "md":
            return "h-10 w-10 text-sm";
        case "lg":
            return "h-12 w-12 text-base";
        case "xl":
            return "h-16 w-16 text-lg";
        default:
            return typeof size === "number" ? "" : "h-10 w-10 text-sm";
    }
}

function getColorClass(project) {
    const key = String(project?.projectKey || project?.name || project?.id || "iems");
    const colors = [
        "bg-blue-500 text-white",
        "bg-emerald-500 text-white",
        "bg-amber-500 text-white",
        "bg-violet-500 text-white",
        "bg-cyan-500 text-white",
        "bg-rose-500 text-white",
    ];
    return colors[key.charCodeAt(0) % colors.length];
}

export default function ProjectAvatar({ project, src, name, size = "md", className = "" }) {
    const displayName = name || project?.name || project?.title || "Project";
    const imageSrc = src || project?.avatarUrl || "";
    const numericSize = typeof size === "number" ? `${size * 0.25}rem` : undefined;
    const [imageFailed, setImageFailed] = React.useState(false);
    const shouldShowImage = Boolean(imageSrc) && !imageFailed;

    React.useEffect(() => {
        setImageFailed(false);
    }, [imageSrc]);

    return (
        <div
            className={cn(
                "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 font-semibold shadow-sm",
                getSizeClass(size),
                shouldShowImage ? "bg-muted" : getColorClass(project),
                className
            )}
            style={numericSize ? { width: numericSize, height: numericSize } : undefined}
            title={displayName}
        >
            {shouldShowImage ? (
                <img
                    src={imageSrc}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className="select-none">{getInitials(displayName)}</span>
            )}
        </div>
    );
}
