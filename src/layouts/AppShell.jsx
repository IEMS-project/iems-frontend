import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/layouts/AppSidebar";
import LayoutHeader from "@/layouts/LayoutHeader";
import MobileNavDrawer from "@/layouts/MobileNavDrawer";
import { Toaster } from "@/components/ui/sonner";
import { isFullHeightRoute } from "@/layouts/layoutRules";

export default function AppShell({ children }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const isFullHeightPage = isFullHeightRoute(location.pathname);

    useEffect(() => {
        function handler(event) {
            if ((event.ctrlKey || event.metaKey) && event.key === "k") {
                event.preventDefault();
                setSearchOpen((value) => !value);
            }
        }

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <SidebarProvider className="app-market-bg h-dvh w-full overflow-hidden">
            <Toaster />
            <AppSidebar />
            <SidebarInset className="min-w-0 flex-1 overflow-hidden bg-transparent">
                <LayoutHeader
                    searchOpen={searchOpen}
                    onOpenSearch={() => setSearchOpen(true)}
                    onCloseSearch={() => setSearchOpen(false)}
                />
                {isFullHeightPage ? (
                    <main className="min-w-0 flex-1 overflow-hidden">
                        {children}
                    </main>
                ) : (
                    <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
                            {children}
                        </div>
                    </main>
                )}
                <button
                    type="button"
                    aria-label="Mở điều hướng"
                    onClick={() => setMobileNavOpen(true)}
                    className="fixed bottom-6 left-6 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 md:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </SidebarInset>
            <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        </SidebarProvider>
    );
}
