import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
};

export default function UserAvatar({ user, name, src, size = "sm", className = "" }) {
    return (
        <Avatar
            user={user}
            name={name}
            src={src}
            size={size}
            className={cn("ring-1 ring-border/70", sizeClasses[size], className)}
        />
    );
}
