import { cn } from "@/lib/utils";

export default function PageHeader({ title, subtitle, eyebrow, icon: Icon, actions, children, className = "" }) {
    return (
        <div className={cn("text-foreground", className)}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    {Icon && (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                            <Icon className="h-6 w-6" />
                        </div>
                    )}
                    <div className="min-w-0">
                        {eyebrow && (
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                                {eyebrow}
                            </div>
                        )}
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children && <div className="mt-5">{children}</div>}
        </div>
    );
}
