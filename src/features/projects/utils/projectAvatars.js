import { projectService } from "@/features/projects/api/projectService";

export async function hydrateProjectsWithAvatars(projects = []) {
    const list = Array.isArray(projects) ? projects : [];

    return Promise.all(list.map(async (project) => {
        const projectId = project?.id || project?.projectId;
        if (!projectId) return project;

        try {
            const avatarUrl = await projectService.getProjectAvatarUrl(projectId);
            return avatarUrl ? { ...project, avatarUrl } : project;
        } catch (_) {
            return project;
        }
    }));
}
