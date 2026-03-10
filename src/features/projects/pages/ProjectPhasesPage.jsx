import React from "react";
import { useParams, useOutletContext } from "react-router-dom";
import ProjectPhases from "@/features/projects/components/ProjectPhases";

export default function ProjectPhasesPage() {
    const { projectId } = useParams();
    const { projectData } = useOutletContext();

    return <ProjectPhases projectId={projectId} projectData={projectData} />;
}
