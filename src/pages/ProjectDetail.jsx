import React, { useEffect, useState } from "react";
import ProjectDetails from "../components/project/ProjectDetails";
import Members from "../components/project/Members";
import Tasks from "../components/project/Tasks";
import Schedule from "../components/project/Schedule";
import ProjectTimeline from "../components/project/ProjectTimeline";
import ProjectRoles from "../components/project/ProjectRoles";
import PageHeader from "../components/common/PageHeader";
import { useParams } from "react-router-dom";
import { taskService } from "../services/taskService";

export default function Project() {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setTasksLoading(true);
                const data = await taskService.getTasksByProject(projectId);
                setTasks(Array.isArray(data) ? data : []);
            } catch (_e) {
                setTasks([]);
            } finally {
                setTasksLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId]);

    return (
        <div className="space-y-6">
            <PageHeader
                breadcrumbs={[
                    { label: "Dự án", to: "/projects" },
                    { label: "Chi tiết dự án" },
                ]}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <ProjectDetails />
                    <ProjectTimeline tasks={tasks} loading={tasksLoading} />
                    <Tasks tasks={tasks} tasksLoading={tasksLoading} onTasksChange={setTasks} />


                </div>
                <div className="space-y-6">
                    <Members />
                    <Schedule />
                    <ProjectRoles />
                </div>
            </div>
        </div>
    );
}