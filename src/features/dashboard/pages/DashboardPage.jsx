import React from "react";
import ProjectOverview from "@/features/dashboard/components/ProjectOverview";
import MyTasks from "@/features/dashboard/components/MyTasks";
import Calendar from "@/components/ui/Calendar";
import { DashboardProvider } from "@/features/dashboard/context/DashboardContext";

export default function Dashboard() {
	return (
		<DashboardProvider>
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<div className="space-y-6 xl:col-span-2">
						<ProjectOverview />
						<MyTasks />
					</div>
					<div className="space-y-6">
						<Calendar />
					</div>
				</div>
			</div>
		</DashboardProvider>
	);
}
