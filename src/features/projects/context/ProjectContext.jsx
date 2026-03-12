import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '@/features/projects/api/projectService';
import { userService } from '@/features/profile/api/userService';
import { taskService } from '@/features/tasks/api/taskService';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // States for all project-related data
    const [projectData, setProjectData] = useState(null);
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [phases, setPhases] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [phasesLoading, setPhasesLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(true);

    // Refresh functions with useCallback to avoid re-creating on every render
    const refreshProject = useCallback(async () => {
        if (!projectId) return;
        console.log('[ProjectContext] Refreshing project data...');
        try {
            setLoading(true);
            const data = await projectService.getProjectById(projectId);
            if (data && data.status === "error" &&
                (data.message?.includes("Permission denied") ||
                    data.message?.includes("PERMISSION_DENIED"))) {
                navigate("/permission-denied");
                return;
            }
            setProjectData(data);
        } catch (e) {
            if (e.status === 403 ||
                e.message?.includes("PERMISSION_DENIED") ||
                e.message?.includes("permission") ||
                e.message?.includes("quyền") ||
                e.message?.includes("Permission denied")) {
                navigate("/permission-denied");
                return;
            }
            console.error("Error loading project:", e);
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);

    const refreshMembers = useCallback(async () => {
        if (!projectId) return;
        console.log('[ProjectContext] Refreshing members...');
        try {
            setMembersLoading(true);
            const data = await projectService.getProjectMembers(projectId);
            setMembers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading members:", e);
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    }, [projectId]);

    const refreshRoles = useCallback(async () => {
        if (!projectId) return;
        console.log('[ProjectContext] Refreshing roles...');
        try {
            setRolesLoading(true);
            const data = await projectService.getProjectRoles(projectId);
            setRoles(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading roles:", e);
            setRoles([]);
        } finally {
            setRolesLoading(false);
        }
    }, [projectId]);

    const refreshPhases = useCallback(async () => {
        if (!projectId) return;
        console.log('[ProjectContext] Refreshing phases...');
        try {
            setPhasesLoading(true);
            const data = await projectService.getPhases(projectId);
            setPhases(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading phases:", e);
            setPhases([]);
        } finally {
            setPhasesLoading(false);
        }
    }, [projectId]);

    const refreshTasks = useCallback(async () => {
        if (!projectId) return;
        console.log('[ProjectContext] Refreshing tasks...');
        try {
            setTasksLoading(true);
            const data = await taskService.getTasksByProject(projectId);
            setTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading tasks:", e);
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    }, [projectId]);

    // Initial load when projectId changes - only once!
    useEffect(() => {
        if (!projectId) return;

        console.log('[ProjectContext] Loading data for projectId:', projectId);
        
        const loadAllData = async () => {
            try {
                // Load project data first
                console.log('[ProjectContext] Fetching project data...');
                setLoading(true);
                const data = await projectService.getProjectById(projectId);
                if (data && data.status === "error" &&
                    (data.message?.includes("Permission denied") ||
                        data.message?.includes("PERMISSION_DENIED"))) {
                    navigate("/permission-denied");
                    return;
                }
                setProjectData(data);
                console.log('[ProjectContext] Project data loaded');
            } catch (e) {
                if (e.status === 403 ||
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    navigate("/permission-denied");
                    return;
                }
                console.error("Error loading project:", e);
            } finally {
                setLoading(false);
            }

            // Load other data in parallel
            console.log('[ProjectContext] Fetching members, roles, phases, tasks, users...');
            try {
                setMembersLoading(true);
                setRolesLoading(true);
                setPhasesLoading(true);
                setTasksLoading(true);

                const [membersData, rolesData, phasesData, tasksData, usersData] = await Promise.all([
                    projectService.getProjectMembers(projectId).catch(e => { console.error("Error loading members:", e); return []; }),
                    projectService.getProjectRoles(projectId).catch(e => { console.error("Error loading roles:", e); return []; }),
                    projectService.getPhases(projectId).catch(e => { console.error("Error loading phases:", e); return []; }),
                    taskService.getTasksByProject(projectId).catch(e => { console.error("Error loading tasks:", e); return []; }),
                    userService.getAssignableUsers().catch(e => { console.error("Error loading users:", e); return []; })
                ]);

                setMembers(Array.isArray(membersData) ? membersData : []);
                setRoles(Array.isArray(rolesData) ? rolesData : []);
                setPhases(Array.isArray(phasesData) ? phasesData : []);
                setTasks(Array.isArray(tasksData) ? tasksData : []);
                setAssignableUsers(Array.isArray(usersData) ? usersData : []);
                console.log('[ProjectContext] All data loaded');
            } finally {
                setMembersLoading(false);
                setRolesLoading(false);
                setPhasesLoading(false);
                setTasksLoading(false);
            }
        };

        loadAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]); // Only reload when projectId changes

    // Listen for project roles updates from other components
    useEffect(() => {
        const handleRolesUpdate = async (event) => {
            if (event.detail.projectId === projectId) {
                try {
                    setRolesLoading(true);
                    const data = await projectService.getProjectRoles(projectId);
                    setRoles(Array.isArray(data) ? data : []);
                } catch (e) {
                    console.error("Error loading roles:", e);
                } finally {
                    setRolesLoading(false);
                }
            }
        };

        window.addEventListener('projectRolesUpdated', handleRolesUpdate);
        return () => window.removeEventListener('projectRolesUpdated', handleRolesUpdate);
    }, [projectId]);

    const value = {
        // Data
        projectData,
        members,
        roles,
        phases,
        tasks,
        assignableUsers,

        // Loading states
        loading,
        membersLoading,
        rolesLoading,
        phasesLoading,
        tasksLoading,

        // Refresh functions (stable references)
        refreshProject,
        refreshMembers,
        refreshRoles,
        refreshPhases,
        refreshTasks,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
}
