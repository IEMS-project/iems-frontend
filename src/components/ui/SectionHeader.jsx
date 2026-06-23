import { cn } from "@/lib/utils";

export default function SectionHeader({ title, description, icon: Icon, action, className = "" }) {
    return (
        <div className={cn("flex items-start justify-between gap-4", className)}>
            <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                    </span>
                )}
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
