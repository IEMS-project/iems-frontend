import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { ArrowLeft, GitBranch, GitCommit, History, User, Folder, Key } from "lucide-react";
import { githubService } from "../../../services/githubService";
import FileTree from "./FileTree";
import CodeViewer from "./CodeViewer";

export default function RepositoryCodeViewer() {
    const { projectId, repoId } = useParams();
    const navigate = useNavigate();
    const [repository, setRepository] = useState(null);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState("main");
    const [commits, setCommits] = useState([]);
    const [showCommits, setShowCommits] = useState(false);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState(null);
    const [error, setError] = useState(null);
    const githubToken = githubService.getGitHubToken();

    useEffect(() => {
        loadRepository();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoId]);

    useEffect(() => {
        if (repository && githubToken) {
            loadRootFolder();
            loadBranches();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repository, currentBranch, githubToken]);

    useEffect(() => {
        if (showCommits && repository && githubToken) {
            loadCommits();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showCommits, currentBranch]);

    const loadRepository = async () => {
        try {
            const repos = await githubService.getRepositoriesByProject(projectId);
            console.log("All repos:", repos);
            console.log("Looking for repoId:", repoId);
            const repo = repos.find(r => r.id === repoId || r.id === parseInt(repoId));
            console.log("Found repo:", repo);
            if (repo) {
                setRepository(repo);
            } else {
                setError("Repository not found");
            }
        } catch (error) {
            console.error("Error loading repository:", error);
            setError("Failed to load repository");
        }
    };

    const loadRootFolder = async () => {
        if (!repository || !githubToken) {
            setTree([]);
            return;
        }

        const parsed = githubService.parseRepoLink(repository.repoLink);
        if (!parsed) {
            setError("Invalid repository link format");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const items = await fetchFolder("", parsed.owner, parsed.repo);
            setTree(items);
        } catch (error) {
            console.error("Error loading root folder:", error);
            setError(error.message || "Failed to load repository. Please check your GitHub token.");
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = async () => {
        if (!repository || !githubToken) {
            setBranches([{ name: "main" }]);
            return;
        }

        const parsed = githubService.parseRepoLink(repository.repoLink);
        if (!parsed) return;

        try {
            const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches`;
            const res = await fetch(url, {
                headers: { Authorization: `token ${githubToken}` }
            });

            if (!res.ok) {
                console.warn("Failed to fetch branches, using default 'main'");
                setBranches([{ name: "main" }]);
                return;
            }

            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error("Error loading branches:", error);
            setBranches([{ name: "main" }]);
        }
    };

    const loadCommits = async () => {
        if (!repository || !githubToken) return;

        const parsed = githubService.parseRepoLink(repository.repoLink);
        if (!parsed) return;

        try {
            setLoadingCommits(true);
            const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?sha=${currentBranch}&per_page=20`;
            const res = await fetch(url, {
                headers: { Authorization: `token ${githubToken}` }
            });

            if (!res.ok) throw new Error("Failed to fetch commits");
            const data = await res.json();
            setCommits(data);
        } catch (error) {
            console.error("Error loading commits:", error);
        } finally {
            setLoadingCommits(false);
        }
    };

    const fetchFolder = async (path = "", owner, repo) => {
        if (!githubToken) {
            throw new Error("GitHub token required");
        }

        const ref = selectedCommit || currentBranch;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
        const res = await fetch(url, {
            headers: { Authorization: `token ${githubToken}` }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("GitHub API Error:", res.status, errorData);

            if (res.status === 403 && errorData.message?.includes("rate limit")) {
                throw new Error("GitHub API rate limit exceeded. Please wait an hour or use a different token.");
            }
            throw new Error(`Failed to fetch folder (${res.status}): ${errorData.message || 'Unknown error'}`);
        }
        return await res.json();
    };

    const fetchFileContent = async (url) => {
        if (!githubToken) {
            throw new Error("GitHub token required");
        }

        const res = await fetch(url, {
            headers: { Authorization: `token ${githubToken}` }
        });

        if (!res.ok) throw new Error("Failed to fetch file");
        const data = await res.json();
        if (data.encoding === "base64") {
            return atob(data.content.replace(/\n/g, ""));
        }
        return data.content;
    };

    const handleFileClick = async (item) => {
        if (item.type !== "file") return;

        try {
            setLoadingFile(true);
            setSelectedFile(item);
            const content = await fetchFileContent(item.url);
            setFileContent(content);
        } catch (error) {
            console.error("Error loading file:", error);
            setFileContent("// Error loading file content");
        } finally {
            setLoadingFile(false);
        }
    };

    const handleBranchChange = (branch) => {
        setCurrentBranch(branch);
        setSelectedCommit(null);
        setSelectedFile(null);
        setFileContent("");
        loadRootFolder();
    };

    const handleCommitSelect = (commitSha) => {
        setSelectedCommit(commitSha);
        setSelectedFile(null);
        setFileContent("");
        loadRootFolder();
    };

    const handleBackToBranch = () => {
        setSelectedCommit(null);
        setSelectedFile(null);
        setFileContent("");
        loadRootFolder();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!githubToken) {
        return (
            <div className="flex flex-col h-[calc(100vh-200px)] border border-border rounded-lg overflow-hidden bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md p-6">
                        <Key className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">GitHub Token Required</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Please add your GitHub Personal Access Token in the repository list page.
                        </p>
                        <Button
                            variant="default"
                            onClick={() => navigate(`/projects/${projectId}/code`)}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Repository List
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] border border-border rounded-lg overflow-hidden bg-background">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/projects/${projectId}/code`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>

                    {repository && (
                        <>
                            <div className="h-4 w-px bg-border" />
                            <span className="text-sm font-semibold">{repository.name}</span>
                        </>
                    )}

                    {/* Branch Selector */}
                    <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={currentBranch}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            disabled={!!selectedCommit}
                            className="px-2 py-1 border border-border rounded-md bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            {branches.map((branch) => (
                                <option key={branch.name} value={branch.name}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Commit Badge */}
                    {selectedCommit && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md">
                            <GitCommit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-mono text-blue-700 dark:text-blue-300">
                                {selectedCommit.substring(0, 7)}
                            </span>
                            <button
                                onClick={handleBackToBranch}
                                className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                title="Back to branch head"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={showCommits ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowCommits(!showCommits)}
                        className="flex items-center gap-1.5 text-xs h-7"
                    >
                        <History className="w-3.5 h-3.5" />
                        History
                    </Button>
                </div>
            </div>

            {/* Commit History Panel */}
            {showCommits && (
                <div className="border-b border-border bg-muted/20 max-h-60 overflow-y-auto">
                    {loadingCommits ? (
                        <div className="p-4 text-muted-foreground text-sm">Loading commits...</div>
                    ) : commits.length > 0 ? (
                        <div className="divide-y divide-border">
                            {commits.map((commit) => (
                                <div
                                    key={commit.sha}
                                    className={`px-4 py-2.5 transition-colors cursor-pointer ${selectedCommit === commit.sha
                                        ? "bg-blue-50 dark:bg-blue-950/50 border-l-4 border-blue-500"
                                        : "hover:bg-muted/50"
                                        }`}
                                    onClick={() => handleCommitSelect(commit.sha)}
                                    title="Click to view code at this commit"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${selectedCommit === commit.sha
                                            ? "bg-blue-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                            }`}>
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {commit.commit.message.split("\n")[0]}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                                                <span>•</span>
                                                <span>{commit.commit.author.name}</span>
                                                <span>•</span>
                                                <span>{formatDate(commit.commit.author.date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-muted-foreground text-sm">No commits found</div>
                    )}
                </div>
            )}

            {/* Main Content - Split View */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - File Tree */}
                <div className="w-80 border-r border-border flex flex-col bg-background">
                    <div className="px-3 py-2 border-b border-border bg-muted/20">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            Files
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-2">
                        {loading ? (
                            <div className="text-muted-foreground text-sm p-2">Loading...</div>
                        ) : error ? (
                            <div className="p-4">
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                                                Unable to load repository
                                            </h3>
                                            <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                                                {error}
                                            </p>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => navigate(`/projects/${projectId}/code`)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Back to Repository List
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <FileTree
                                items={tree}
                                onFileClick={handleFileClick}
                                fetchFolder={(path) => {
                                    if (!repository) return Promise.resolve([]);
                                    const parsed = githubService.parseRepoLink(repository.repoLink);
                                    if (!parsed) return Promise.resolve([]);
                                    return fetchFolder(path, parsed.owner, parsed.repo);
                                }}
                                selectedFile={selectedFile}
                            />
                        )}
                    </div>
                </div>

                {/* Right Side - Code Viewer */}
                <CodeViewer
                    selectedFile={selectedFile}
                    fileContent={fileContent}
                    loading={loadingFile}
                />
            </div>
        </div>
    );
}
