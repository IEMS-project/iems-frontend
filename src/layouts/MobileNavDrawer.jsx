import { Link } from "react-router-dom";
import { BarChart3, Bot, FileText, FolderKanban, MessageSquare, Shield, X } from "lucide-react";

const mobileNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/documents", label: "Documents", icon: FileText },
    { to: "/chatbot", label: "AI Assistant", icon: Bot },
    { to: "/admin", label: "Admin", icon: Shield },
];

export default function MobileNavDrawer({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="md:hidden">
            <div className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60" onClick={onClose} />
            <div className="fixed inset-y-0 left-0 z-50 h-dvh w-72 max-w-full translate-x-0 transform overflow-y-auto border-r border-border bg-card p-3 text-card-foreground shadow-xl transition-transform">
                <div className="flex h-12 items-center justify-between px-2">
                    <div className="flex items-center gap-2 font-semibold">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
                            I
                        </span>
                        IEMS
                    </div>
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={onClose}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <nav className="space-y-1">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={onClose}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
