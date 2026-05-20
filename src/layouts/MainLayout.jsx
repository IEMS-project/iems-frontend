import { BreadcrumbProvider } from "@/context/BreadcrumbContext";
import { UnreadCountsProvider } from "@/context/UnreadCountsContext";
import AppShell from "@/layouts/AppShell";

export default function MainLayout({ children }) {
    return (
        <BreadcrumbProvider>
            <UnreadCountsProvider>
                <AppShell>{children}</AppShell>
            </UnreadCountsProvider>
        </BreadcrumbProvider>
    );
}
