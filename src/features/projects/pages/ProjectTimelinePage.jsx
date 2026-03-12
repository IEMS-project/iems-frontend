import React from "react";
import ProjectTimeline from "@/features/projects/components/ProjectTimeline";
import { useProject } from "@/features/projects/context/ProjectContext";

export default function ProjectTimelinePage() {
    // Get tasks from context instead of loading separately
    const { tasks, tasksLoading } = useProject();

    return (
        <ProjectTimeline tasks={tasks} loading={tasksLoading} />
    );
}

