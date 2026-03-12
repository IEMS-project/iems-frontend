import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectService } from '@/features/projects/api/projectService';
import { taskService } from '@/features/tasks/api/taskService';

const DashboardContext = createContext(undefined);

export function DashboardProvider({ children }) {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(true);

    // Combined loading state
    const loading = projectsLoading || tasksLoading;

    // Refresh functions
    const refreshProjects = useCallback(async () => {
        try {
            setProjectsLoading(true);
            const data = await projectService.getMyProjects();
            setProjects(Array.isArray(data) ? data : []);
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
            const data = await taskService.getMyTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    }, []);

    // Initial load - load both in parallel
    useEffect(() => {
        console.log('[DashboardContext] Loading dashboard data...');
        
        Promise.all([
            refreshProjects(),
            refreshTasks()
        ]).then(() => {
            console.log('[DashboardContext] Dashboard data loaded successfully');
        });
    }, [refreshProjects, refreshTasks]);

    const value = {
        projects,
        tasks,
        loading,
        projectsLoading,
        tasksLoading,
        refreshProjects,
        refreshTasks
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
