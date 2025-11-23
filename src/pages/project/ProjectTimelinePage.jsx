import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProjectTimeline from "../../components/project/ProjectTimeline";
import { taskService } from "../../services/taskService";

export default function ProjectTimelinePage() {
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
        <ProjectTimeline tasks={tasks} loading={tasksLoading} />
    );
}

