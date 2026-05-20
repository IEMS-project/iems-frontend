import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className = "",
}) {
    const EmptyIcon = icon || Inbox;

    return (
        <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center", className)}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground shadow-sm">
                <EmptyIcon className="h-5 w-5" />
            </div>
            {title && <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>}
            {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
