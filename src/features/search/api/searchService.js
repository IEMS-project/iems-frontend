import { request } from "@/lib/api";
import { projectService } from "@/features/projects/api/projectService";

export const searchService = {
    /**
     * Search issues across all user's projects.
     * Falls back to client-side filter if backend search not available.
     */
    async searchIssues(query, signal) {
        if (!query || query.trim().length < 2) return [];
        try {
            // Try dedicated search endpoint first
            const data = await request(
                `/project-service/issues/search?q=${encodeURIComponent(query.trim())}&size=8`,
                { signal }
            );
            const results = data?.data?.content || data?.data || data || [];
            if (Array.isArray(results) && results.length >= 0) return results;
        } catch (_) { /* fall through to project-level search */ }

        // Fallback: load projects then search per-project (first 4 projects)
        try {
            const projects = await projectService.getMyProjects();
            const top4 = (Array.isArray(projects) ? projects : []).slice(0, 4);
            const results = await Promise.allSettled(
                top4.map(p =>
                    request(`/project-service/projects/${p.id || p.projectId}/issues?size=50`, { signal })
                )
            );
            const q = query.trim().toLowerCase();
            return results
                .filter(r => r.status === "fulfilled")
                .flatMap(r => {
                    const d = r.value?.data || r.value;
                    const items = Array.isArray(d) ? d : (Array.isArray(d?.content) ? d.content : []);
                    return items.filter(
                        i => (i.title || "").toLowerCase().includes(q) ||
                             (i.issueKey || "").toLowerCase().includes(q)
                    );
                })
                .slice(0, 8);
        } catch (_) {
            return [];
        }
    },

    /**
     * Search projects by name.
     */
    async searchProjects(query) {
        if (!query || query.trim().length < 2) return [];
        try {
            const projects = await projectService.getMyProjects();
            const q = query.trim().toLowerCase();
            return (Array.isArray(projects) ? projects : [])
                .filter(p => (p.name || p.title || "").toLowerCase().includes(q))
                .slice(0, 5);
        } catch (_) {
            return [];
        }
    },
};
