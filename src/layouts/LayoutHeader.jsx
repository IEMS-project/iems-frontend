import { Search } from "lucide-react";
import Breadcrumb from "@/layouts/Breadcrumb";
import CommandPalette from "@/components/ui/CommandPalette";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import NotificationBell from "@/components/ui/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function LayoutHeader({ searchOpen, onOpenSearch, onCloseSearch }) {
    return (
        <header className="z-20 flex h-[73px] w-full min-w-0 shrink-0 items-center gap-4 border-b border-white/60 bg-card/78 px-4 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl dark:border-white/10 dark:bg-card/70 dark:shadow-black/20">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-primary/10 hover:text-primary" />
            <div className="min-w-0 flex-1">
                <Breadcrumb />
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-2">
                <button
                    type="button"
                    aria-label="Mở tìm kiếm"
                    onClick={onOpenSearch}
                    className="hidden w-52 max-w-[32vw] items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-sm text-muted-foreground shadow-sm shadow-slate-900/[0.02] backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary sm:flex lg:w-64"
                >
                    <Search className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Tìm kiếm</span>
                    <kbd className="ml-1 rounded border border-border/70 bg-card/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        Ctrl K
                    </kbd>
                </button>
                <button
                    type="button"
                    aria-label="Mở tìm kiếm"
                    onClick={onOpenSearch}
                    className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary sm:hidden"
                >
                    <Search className="h-4 w-4" />
                </button>
                <NotificationBell />
                <LanguageSwitcher />
            </div>
            <CommandPalette open={searchOpen} onClose={onCloseSearch} />
        </header>
    );
}
