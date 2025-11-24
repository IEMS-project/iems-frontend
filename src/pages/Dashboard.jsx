import React from "react";
import ProjectOverview from "../components/dashboard/ProjectOverview";
import MyTasks from "../components/dashboard/MyTasks";
import ActivityPanel from "../components/dashboard/ActivityPanel";
import Calendar from "../components/ui/Calendar";

export default function Dashboard() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="space-y-6 xl:col-span-2">
					<ProjectOverview />
					<MyTasks />
				</div>
				<div className="space-y-6">
					<Calendar />
					<ActivityPanel />
				</div>
			</div>
		</div>
	);
}
