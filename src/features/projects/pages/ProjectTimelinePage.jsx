import React, { useEffect } from "react";
import ProjectTimeline from "@/features/projects/components/ProjectTimeline";
import { useProject } from "@/features/projects/context/ProjectContext";

export default function ProjectTimelinePage() {
    const { issues, sprints, workflowStatuses, members, issuesLoading, sprintsLoading, refreshIssues, refreshSprints } = useProject();

    useEffect(() => {
        refreshIssues();
        refreshSprints();
    }, []);

    return (
        <ProjectTimeline
            issues={issues}
            sprints={sprints}
            workflowStatuses={workflowStatuses}
            members={members}
            loading={issuesLoading || sprintsLoading}
        />
    );
}
