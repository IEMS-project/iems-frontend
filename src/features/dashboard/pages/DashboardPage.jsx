import DashboardMarketPanel from "@/features/dashboard/components/DashboardMarketPanel";
import ProjectOverview from "@/features/dashboard/components/ProjectOverview";
import MyTasks from "@/features/dashboard/components/MyTasks";
import RecentActivity from "@/features/dashboard/components/RecentActivity";
import { DashboardProvider } from "@/features/dashboard/context/DashboardContext";

export default function Dashboard() {
    return (
        <DashboardProvider>
            <div className="space-y-6">


                <div className="grid items-stretch grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <DashboardMarketPanel className="min-h-[360px]" />
                    <aside className="min-w-0">
                        <RecentActivity className="h-full min-h-[360px]" />
                    </aside>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <ProjectOverview />
                    <MyTasks />
                </div>
            </div>
        </DashboardProvider>
    );
}
