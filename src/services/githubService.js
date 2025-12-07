import { request } from "../lib/api";

export const githubService = {
    // Project Repository Management
    async createRepository(repositoryData) {
        const data = await request("/project-service/api/project-repositories", {
            method: "POST",
            body: repositoryData,
        });
        return data?.data || data;
    },

    async getRepositoriesByProject(projectId) {
        const data = await request(`/project-service/api/project-repositories/project/${projectId}`);
        return data?.data || data || [];
    },

    async getRepositoryById(repositoryId) {
        const data = await request(`/project-service/api/project-repositories/${repositoryId}`);
        return data?.data || data || null;
    },

    async updateRepository(repositoryId, repositoryData) {
        const data = await request(`/project-service/api/project-repositories/${repositoryId}`, {
            method: "PUT",
            body: repositoryData,
        });
        return data?.data || data;
    },

    async deleteRepository(repositoryId) {
        const data = await request(`/project-service/api/project-repositories/${repositoryId}`, {
            method: "DELETE",
        });
        return data?.data || data;
    },

    // GitHub API calls
    async getRepoContents(owner, repo, path = "", token) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return await response.json();
    },

    async getRepoInfo(owner, repo, token) {
        const url = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return await response.json();
    },

    async getFileContent(downloadUrl, token) {
        const response = await fetch(downloadUrl, {
            headers: {
                Authorization: `token ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        return await response.text();
    },

    // Parse GitHub repo link to get owner and repo name
    parseRepoLink(repoLink) {
        try {
            // Handle formats: https://github.com/owner/repo or github.com/owner/repo
            const url = repoLink.replace(/\/$/, ""); // Remove trailing slash
            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);

            if (match) {
                return {
                    owner: match[1],
                    repo: match[2].replace(/\.git$/, ""), // Remove .git suffix if present
                };
            }

            return null;
        } catch (error) {
            console.error("Error parsing repo link:", error);
            return null;
        }
    },

    // LocalStorage helper for GitHub token
    getGitHubToken() {
        return localStorage.getItem("github_token");
    },

    setGitHubToken(token) {
        localStorage.setItem("github_token", token);
    },

    removeGitHubToken() {
        localStorage.removeItem("github_token");
    },
};
