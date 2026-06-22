import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Plus, Trash2, Code, LinkIcon, ExternalLink, Edit2 } from "lucide-react";
import { githubService } from "@/features/projects/api/githubService";
import GitHubTokenManager from "./GitHubTokenManager";

export default function RepositoryList() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [githubToken, setGithubToken] = useState(() => githubService.getGitHubToken() || "");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingRepo, setEditingRepo] = useState(null);
    const [repoName, setRepoName] = useState("");
    const [repoLink, setRepoLink] = useState("");
    const [repoErrors, setRepoErrors] = useState({});
    const repoNameInputRef = useRef(null);
    const repoLinkInputRef = useRef(null);

    useEffect(() => {
        loadRepositories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const loadRepositories = async () => {
        try {
            setLoading(true);
            const repos = await githubService.getRepositoriesByProject(projectId);
            setRepositories(repos);
        } catch (error) {
            console.error("Error loading repositories:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetRepositoryForm = () => {
        setRepoName("");
        setRepoLink("");
        setRepoErrors({});
    };

    const isValidGitHubRepoUrl = (value) => {
        const trimmed = value.trim();
        try {
            const url = new URL(trimmed);
            if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
                return false;
            }
            const [owner, repo, ...rest] = url.pathname.split("/").filter(Boolean);
            return Boolean(owner && repo) && rest.length === 0;
        } catch {
            return false;
        }
    };

    const validateRepositoryForm = () => {
        const errors = {};
        if (!repoName.trim()) errors.name = "Repository name is required.";
        if (!repoLink.trim()) {
            errors.link = "Repository URL is required.";
        } else if (!isValidGitHubRepoUrl(repoLink)) {
            errors.link = "Repository URL must be a valid GitHub URL.";
        }

        setRepoErrors(errors);
        if (errors.name) repoNameInputRef.current?.focus();
        else if (errors.link) repoLinkInputRef.current?.focus();
        return Object.keys(errors).length === 0;
    };

    const handleAddRepository = async () => {
        if (!validateRepositoryForm()) return;

        try {
            await githubService.createRepository({
                projectId: projectId,
                name: repoName.trim(),
                repoLink: repoLink.trim(),
            });

            setShowAddDialog(false);
            resetRepositoryForm();
            loadRepositories();
        } catch (error) {
            console.error("Error adding repository:", error);
            alert("Failed to add repository");
        }
    };

    const handleDeleteRepository = async (repoId) => {
        if (!confirm("Are you sure you want to delete this repository?")) {
            return;
        }

        try {
            await githubService.deleteRepository(repoId);
            loadRepositories();
        } catch (error) {
            console.error("Error deleting repository:", error);
            alert("Failed to delete repository");
        }
    };

    const handleEditRepository = (repo) => {
        setEditingRepo(repo);
        setRepoName(repo.name);
        setRepoLink(repo.repoLink);
        setRepoErrors({});
        setShowEditDialog(true);
    };

    const handleUpdateRepository = async () => {
        if (!validateRepositoryForm()) return;

        try {
            await githubService.updateRepository(editingRepo.id, {
                name: repoName.trim(),
                repoLink: repoLink.trim(),
            });

            setShowEditDialog(false);
            setEditingRepo(null);
            resetRepositoryForm();
            loadRepositories();
        } catch (error) {
            console.error("Error updating repository:", error);
            alert("Failed to update repository");
        }
    };

    const handleSaveToken = (token) => {
        githubService.setGitHubToken(token);
        setGithubToken(token);
    };

    const handleRemoveToken = () => {
        githubService.removeGitHubToken();
        setGithubToken("");
    };

    const handleViewCode = (repo) => {
        navigate(`/projects/${projectId}/code/${repo.id}`);
    };

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Add Repository Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add GitHub Repository
                        </h3>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Repository Name</label>
                                <input
                                    ref={repoNameInputRef}
                                    id="add-repository-name"
                                    type="text"
                                    value={repoName}
                                    onChange={(e) => {
                                        setRepoName(e.target.value);
                                        setRepoErrors(prev => ({ ...prev, name: "" }));
                                    }}
                                    placeholder="My Backend"
                                    className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 text-sm ${repoErrors.name ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-primary"}`}
                                    aria-invalid={repoErrors.name ? "true" : "false"}
                                    aria-describedby={repoErrors.name ? "add-repository-name-error" : undefined}
                                />
                                {repoErrors.name && <p id="add-repository-name-error" className="mt-1 text-xs font-medium text-destructive">{repoErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Repository Link</label>
                                <input
                                    ref={repoLinkInputRef}
                                    id="add-repository-link"
                                    type="text"
                                    value={repoLink}
                                    onChange={(e) => {
                                        setRepoLink(e.target.value);
                                        setRepoErrors(prev => ({ ...prev, link: "" }));
                                    }}
                                    placeholder="https://github.com/owner/repo"
                                    className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 text-sm ${repoErrors.link ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-primary"}`}
                                    aria-invalid={repoErrors.link ? "true" : "false"}
                                    aria-describedby={repoErrors.link ? "add-repository-link-error" : undefined}
                                />
                                {repoErrors.link && <p id="add-repository-link-error" className="mt-1 text-xs font-medium text-destructive">{repoErrors.link}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowAddDialog(false);
                                    resetRepositoryForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleAddRepository}
                            >
                                Add Repository
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Repository Dialog */}
            {showEditDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Edit2 className="w-5 h-5" />
                            Edit Repository
                        </h3>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Repository Name</label>
                                <input
                                    ref={repoNameInputRef}
                                    id="edit-repository-name"
                                    type="text"
                                    value={repoName}
                                    onChange={(e) => {
                                        setRepoName(e.target.value);
                                        setRepoErrors(prev => ({ ...prev, name: "" }));
                                    }}
                                    placeholder="My Backend"
                                    className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 text-sm ${repoErrors.name ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-primary"}`}
                                    aria-invalid={repoErrors.name ? "true" : "false"}
                                    aria-describedby={repoErrors.name ? "edit-repository-name-error" : undefined}
                                />
                                {repoErrors.name && <p id="edit-repository-name-error" className="mt-1 text-xs font-medium text-destructive">{repoErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Repository Link</label>
                                <input
                                    ref={repoLinkInputRef}
                                    id="edit-repository-link"
                                    type="text"
                                    value={repoLink}
                                    onChange={(e) => {
                                        setRepoLink(e.target.value);
                                        setRepoErrors(prev => ({ ...prev, link: "" }));
                                    }}
                                    placeholder="https://github.com/owner/repo"
                                    className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 text-sm ${repoErrors.link ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-primary"}`}
                                    aria-invalid={repoErrors.link ? "true" : "false"}
                                    aria-describedby={repoErrors.link ? "edit-repository-link-error" : undefined}
                                />
                                {repoErrors.link && <p id="edit-repository-link-error" className="mt-1 text-xs font-medium text-destructive">{repoErrors.link}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowEditDialog(false);
                                    setEditingRepo(null);
                                    resetRepositoryForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleUpdateRepository}
                            >
                                Update Repository
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            GitHub Repositories
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <GitHubTokenManager
                                token={githubToken}
                                onSaveToken={handleSaveToken}
                                onRemoveToken={handleRemoveToken}
                            />
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                    resetRepositoryForm();
                                    setShowAddDialog(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Repository
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading repositories...
                        </div>
                    ) : repositories.length === 0 ? (
                        <div className="text-center py-12">
                            <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Repositories</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Add a GitHub repository to start viewing code.
                            </p>
                            <Button
                                variant="default"
                                onClick={() => {
                                    resetRepositoryForm();
                                    setShowAddDialog(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Repository
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {repositories.map((repo) => (
                                <div
                                    key={repo.id}
                                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base mb-1 truncate">
                                                {repo.name}
                                            </h3>
                                            <a
                                                href={repo.repoLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                                            >
                                                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{repo.repoLink}</span>
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditRepository(repo)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteRepository(repo.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleViewCode(repo)}
                                            className="flex-1"
                                        >
                                            <Code className="w-4 h-4 mr-1" />
                                            View Code
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(repo.repoLink, "_blank")}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
