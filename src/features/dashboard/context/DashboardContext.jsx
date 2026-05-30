import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { projectService } from '@/features/projects/api/projectService';
import { hydrateProjectsWithAvatars } from '@/features/projects/utils/projectAvatars';
import { issueService } from '@/features/projects/api/issueService';

const DashboardContext = createContext(undefined);

function computeStats(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let inProgress = 0, completed = 0, overdue = 0, total = 0;

    (Array.isArray(tasks) ? tasks : []).forEach((task) => {
        total++;
        const category = (task.statusCategory || '').toString().toUpperCase();
        const isDone = category === 'DONE';
        const isInProgress = category === 'IN_PROGRESS';

        if (isDone) { completed++; return; }
        if (isInProgress) inProgress++;

        if (!isDone && task.dueDate) {
            try {
                const [y, m, d] = task.dueDate.toString().split('T')[0].split('-').map(Number);
                const due = new Date(y, m - 1, d);
                if (due < today) overdue++;
            } catch (_) { /* ignore */ }
        }
    });

    return { total, inProgress, completed, overdue, todo: total - inProgress - completed };
}

export function DashboardProvider({ children }) {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(true);

    const loading = projectsLoading || tasksLoading;

    const stats = useMemo(() => computeStats(tasks), [tasks]);

    const refreshProjects = useCallback(async () => {
        try {
            setProjectsLoading(true);
            const data = await projectService.getMyProjects();
            setProjects(await hydrateProjectsWithAvatars(data));
        } catch (error) {
            console.error('Error loading projects:', error);
            setProjects([]);
        } finally {
            setProjectsLoading(false);
        }
    }, []);

    const refreshTasks = useCallback(async () => {
        try {
            setTasksLoading(true);
            const data = await issueService.getMyAssignedIssues();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.all([refreshProjects(), refreshTasks()]);
    }, [refreshProjects, refreshTasks]);

    const value = {
        projects,
        tasks,
        stats,
        loading,
        projectsLoading,
        tasksLoading,
        refreshProjects,
        refreshTasks,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
