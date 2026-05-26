import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '@/features/projects/api/projectService';
import { issueService } from '@/features/projects/api/issueService';
import { sprintService } from '@/features/projects/api/sprintService';
import { workflowService } from '@/features/projects/api/workflowService';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // Core data
    const [projectData, setProjectData] = useState(null);
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);

    // New entities
    const [issues, setIssues] = useState([]);
    const [backlogIssues, setBacklogIssues] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [workflowStatuses, setWorkflowStatuses] = useState([]);
    const [issueTypes, setIssueTypes] = useState([]);
    const [issuePriorities, setIssuePriorities] = useState([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [issuesLoading, setIssuesLoading] = useState(true);
    const [sprintsLoading, setSprintsLoading] = useState(true);
    const [workflowsLoading, setWorkflowsLoading] = useState(true);

    // ── Refresh Functions ──────────────────────────────────────
    const refreshProject = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await projectService.getProjectById(projectId);
            if (data?.status === "error" &&
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

    const refreshIssues = useCallback(async () => {
        if (!projectId) return;
        try {
            setIssuesLoading(true);
            const [allIssues, backlog] = await Promise.all([
                issueService.getIssues(projectId).catch(() => []),
                issueService.getBacklog(projectId).catch(() => []),
            ]);
            setIssues(Array.isArray(allIssues) ? allIssues : []);
            setBacklogIssues(Array.isArray(backlog) ? backlog : []);
        } catch (e) {
            console.error("Error loading issues:", e);
            setIssues([]);
            setBacklogIssues([]);
        } finally {
            setIssuesLoading(false);
        }
    }, [projectId]);

    const refreshSprints = useCallback(async () => {
        if (!projectId) return;
        try {
            setSprintsLoading(true);
            const data = await sprintService.getSprints(projectId);
            setSprints(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading sprints:", e);
            setSprints([]);
        } finally {
            setSprintsLoading(false);
        }
    }, [projectId]);

    const refreshWorkflows = useCallback(async () => {
        if (!projectId) return;
        try {
            setWorkflowsLoading(true);
            const wfs = await workflowService.getWorkflows(projectId);
            const workflowList = Array.isArray(wfs) ? wfs : [];
            setWorkflows(workflowList);

            // Load statuses from default workflow
            const defaultWf = workflowList.find(w => w.isDefault) || workflowList[0];
            if (defaultWf) {
                const statuses = await workflowService.getStatuses(projectId, defaultWf.id);
                const sortedStatuses = (Array.isArray(statuses) ? statuses : [])
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                setWorkflowStatuses(sortedStatuses);
            }
        } catch (e) {
            console.error("Error loading workflows:", e);
            setWorkflows([]);
            setWorkflowStatuses([]);
        } finally {
            setWorkflowsLoading(false);
        }
    }, [projectId]);

    const refreshIssueTypes = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await projectService.getIssueTypes(projectId);
            setIssueTypes(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading issue types:", e);
            setIssueTypes([]);
        }
    }, [projectId]);

    const refreshIssuePriorities = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await projectService.getIssuePriorities(projectId);
            setIssuePriorities(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading issue priorities:", e);
            setIssuePriorities([]);
        }
    }, [projectId]);

    const updateIssueInCache = useCallback((updatedIssue) => {
        if (!updatedIssue?.id) return;

        setIssues((prev) => {
            const exists = prev.some((item) => item.id === updatedIssue.id);
            if (!exists) {
                return [...prev, updatedIssue];
            }
            return prev.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item));
        });

        setBacklogIssues((prev) => {
            if (updatedIssue.sprintId) {
                return prev.filter((item) => item.id !== updatedIssue.id);
            }

            const exists = prev.some((item) => item.id === updatedIssue.id);
            if (!exists) {
                return [...prev, updatedIssue];
            }
            return prev.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item));
        });
    }, []);

    const rollbackIssueInCache = useCallback((previousIssue) => {
        if (!previousIssue?.id) return;
        updateIssueInCache(previousIssue);
    }, [updateIssueInCache]);

    // ── Initial Load ───────────────────────────────────────────
    useEffect(() => {
        if (!projectId) return;

        const loadAllData = async () => {
            // Load project data first
            try {
                setLoading(true);
                const data = await projectService.getProjectById(projectId);
                if (data?.status === "error" &&
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
                    e.message?.includes("Permission denied")) {
                    navigate("/permission-denied");
                    return;
                }
                console.error("Error loading project:", e);
            } finally {
                setLoading(false);
            }

            // Load CRITICAL data in parallel (needed for UI immediately)
            try {
                setMembersLoading(true);
                setRolesLoading(true);
                setSprintsLoading(true);
                setWorkflowsLoading(true);

                const [
                    membersData, rolesData, sprintsData, workflowsData,
                    issueTypesData, prioritiesData
                ] = await Promise.all([
                    projectService.getProjectMembers(projectId).catch(() => []),
                    projectService.getProjectRoles(projectId).catch(() => []),
                    sprintService.getSprints(projectId).catch(() => []),
                    workflowService.getWorkflows(projectId).catch(() => []),
                    projectService.getIssueTypes(projectId).catch(() => []),
                    projectService.getIssuePriorities(projectId).catch(() => []),
                ]);

                setMembers(Array.isArray(membersData) ? membersData : []);
                setRoles(Array.isArray(rolesData) ? rolesData : []);
                setSprints(Array.isArray(sprintsData) ? sprintsData : []);
                setIssueTypes(Array.isArray(issueTypesData) ? issueTypesData : []);
                setIssuePriorities(Array.isArray(prioritiesData) ? prioritiesData : []);

                // Workflows & statuses
                const wfList = Array.isArray(workflowsData) ? workflowsData : [];
                setWorkflows(wfList);
                const defaultWf = wfList.find(w => w.isDefault) || wfList[0];
                if (defaultWf) {
                    const statuses = await workflowService.getStatuses(projectId, defaultWf.id).catch(() => []);
                    const sorted = (Array.isArray(statuses) ? statuses : [])
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    setWorkflowStatuses(sorted);
                }
            } finally {
                setMembersLoading(false);
                setRolesLoading(false);
                setSprintsLoading(false);
                setWorkflowsLoading(false);
            }

            // LAZY-LOAD issue data after critical data is ready
            // (Issues/backlog can be fetched in background without blocking UI)
            try {
                setIssuesLoading(true);
                const [issuesData, backlogData] = await Promise.all([
                    issueService.getIssues(projectId).catch(() => []),
                    issueService.getBacklog(projectId).catch(() => []),
                ]);
                setIssues(Array.isArray(issuesData) ? issuesData : []);
                setBacklogIssues(Array.isArray(backlogData) ? backlogData : []);
            } catch (error) {
                console.error("Error loading issues:", error);
            } finally {
                setIssuesLoading(false);
            }
        };

        loadAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Listen for project roles updates
    useEffect(() => {
        const handleRolesUpdate = async (event) => {
            if (event.detail.projectId === projectId) {
                await refreshRoles();
            }
        };
        window.addEventListener('projectRolesUpdated', handleRolesUpdate);
        return () => window.removeEventListener('projectRolesUpdated', handleRolesUpdate);
    }, [projectId, refreshRoles]);

    const value = {
        // Data
        projectData,
        members,
        roles,
        issues,
        backlogIssues,
        sprints,
        workflows,
        workflowStatuses,
        issueTypes,
        issuePriorities,

        // Loading states
        loading,
        membersLoading,
        rolesLoading,
        issuesLoading,
        sprintsLoading,
        workflowsLoading,

        // Refresh functions
        refreshProject,
        refreshMembers,
        refreshRoles,
        refreshIssues,
        refreshSprints,
        refreshWorkflows,
        refreshIssueTypes,
        refreshIssuePriorities,
        updateIssueInCache,
        rollbackIssueInCache,
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
