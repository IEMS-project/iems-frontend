import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import {
    FileText,
    Upload,
    Trash2,
    Download,
    MoreVertical,
    FileImage,
    FileArchive,
    FileSpreadsheet,
    File,
    AlertCircle,
    Loader2,
    FolderPlus,
    Folder as FolderIcon,
    ChevronRight,
    CornerLeftUp,
    Pencil,
    MoveRight,
    Eye,
    Search
} from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes, formatDate } from '@/lib/utils';
import { documentService } from '@/features/projects/api/documentService';
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/ui/EmptyState";
import ProjectDocumentDetailPanel from './ProjectDocumentDetailPanel';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import UploadProgressPanel from '@/features/documents/components/UploadProgressPanel';

// Helper to get file icon by type/extension
const getFileIcon = (isFolder, fileType = '', fileName = '') => {
    if (isFolder) return <FolderIcon className="h-5 w-5 text-blue-400 fill-blue-100 dark:fill-blue-900" />;

    const type = fileType.toLowerCase();
    const name = fileName.toLowerCase();

    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type.includes('pdf') || name.endsWith('.pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('zip') || type.includes('tar') || type.includes('rar') || name.match(/\.(zip|rar|tar\.gz)$/)) return <FileArchive className="h-5 w-5 text-orange-500" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv') || name.match(/\.(xls|xlsx|csv)$/)) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type.includes('word') || type.includes('document') || name.match(/\.(doc|docx)$/)) return <FileText className="h-5 w-5 text-blue-600" />;

    return <File className="h-5 w-5 text-gray-400" />;
};

export default function DocumentsTab() {
    const { t } = useTranslation();
    const { projectData } = useOutletContext();
    const projectId = projectData?.id;

    // Data State
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadTasks, setUploadTasks] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const uploadControllersRef = useRef(new Map());

    // Navigation State
    const [currentFolderId, setCurrentFolderId] = useState(null);

    // Modals State
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showRename, setShowRename] = useState(null);
    const [showMove, setShowMove] = useState(null);
    const [docToDelete, setDocToDelete] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [updatingEmbedDocId, setUpdatingEmbedDocId] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Inputs State
    const [newFolderName, setNewFolderName] = useState('');
    const [moveTargetId, setMoveTargetId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await documentService.getProjectDocuments(projectId);
            setDocuments(data || []);
        } catch (err) {
            console.error("Failed to load documents:", err);
            if (err?.status === 403) {
                setError(t('projectDocuments.accessDenied', 'You do not have access to view this project\'s documents.'));
            } else {
                toast.error(t('ui.common.error'));
            }
        } finally {
            setLoading(false);
        }
    }, [projectId, t]);

    useEffect(() => {
        if (projectId) {
            loadDocuments();
        }
    }, [projectId, loadDocuments]);

    const updateUploadTask = useCallback((taskId, patch) => {
        setUploadTasks((prev) =>
            prev.map((task) => (
                task.id === taskId
                    ? { ...task, ...(typeof patch === 'function' ? patch(task) : patch) }
                    : task
            ))
        );
    }, []);

    const startUploadTask = useCallback((task) => {
        const controller = new AbortController();
        uploadControllersRef.current.set(task.id, controller);
        updateUploadTask(task.id, { status: 'uploading', progress: task.progress || 0, error: null });

        documentService.uploadProjectDocument(projectId, task.file, task.folderId, {
            signal: controller.signal,
            onUploadProgress: (event) => {
                if (!event.total) return;
                const uploadProgress = Math.round((event.loaded * 100) / event.total);
                const progress = Math.min(90, Math.round((event.loaded * 90) / event.total));
                updateUploadTask(task.id, {
                    progress,
                    status: uploadProgress >= 100 ? 'processing' : 'uploading',
                });
            },
        })
            .then(() => {
                updateUploadTask(task.id, { status: 'completed', progress: 100, error: null });
                loadDocuments();
            })
            .catch((err) => {
                const canceled = err?.code === 'ERR_CANCELED' || controller.signal.aborted;
                updateUploadTask(task.id, {
                    status: canceled ? 'canceled' : 'failed',
                    error: canceled ? null : (err?.message || t('ui.common.error')),
                });
                if (!canceled) {
                    console.error('Upload error:', err);
                }
            })
            .finally(() => {
                uploadControllersRef.current.delete(task.id);
            });
    }, [loadDocuments, projectId, t, updateUploadTask]);

    const cancelUpload = useCallback((taskId) => {
        uploadControllersRef.current.get(taskId)?.abort();
        updateUploadTask(taskId, (task) => (
            task.status === 'queued' ? { status: 'canceled', progress: 0, error: null } : {}
        ));
    }, [updateUploadTask]);

    const cancelAllUploads = useCallback(() => {
        uploadControllersRef.current.forEach((controller) => controller.abort());
        setUploadTasks((prev) =>
            prev.map((task) =>
                task.status === 'queued' || task.status === 'uploading' || task.status === 'processing'
                    ? { ...task, status: 'canceled', error: null }
                    : task
            )
        );
    }, []);

    const retryUpload = useCallback((taskId) => {
        const task = uploadTasks.find((item) => item.id === taskId);
        if (!task || task.status === 'uploading') return;
        const retryTask = { ...task, progress: 0, status: 'queued', error: null };
        updateUploadTask(taskId, retryTask);
        window.setTimeout(() => startUploadTask(retryTask), 0);
    }, [startUploadTask, updateUploadTask, uploadTasks]);

    const retryFailedUploads = useCallback(() => {
        uploadTasks
            .filter((task) => task.status === 'failed' || task.status === 'canceled')
            .forEach((task) => {
                const retryTask = { ...task, progress: 0, status: 'queued', error: null };
                updateUploadTask(task.id, retryTask);
                window.setTimeout(() => startUploadTask(retryTask), 0);
            });
    }, [startUploadTask, updateUploadTask, uploadTasks]);

    const clearFinishedUploads = useCallback(() => {
        setUploadTasks((prev) => prev.filter((task) => task.status === 'queued' || task.status === 'uploading' || task.status === 'processing'));
    }, []);

    // --- Derived Data ---
    const visibleDocuments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return documents
            .filter(d => (currentFolderId ? d.parentId === currentFolderId : !d.parentId))
            .filter(d => !query || d.fileName?.toLowerCase().includes(query) || d.fileType?.toLowerCase().includes(query))
            .sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.fileName.localeCompare(b.fileName);
            });
    }, [documents, currentFolderId, searchQuery]);

    const allFolders = useMemo(() => documents.filter(d => d.isFolder), [documents]);

    const breadcrumbs = useMemo(() => {
        const path = [];
        let curr = currentFolderId;
        while (curr) {
            const folder = documents.find(d => d.id === curr);
            if (folder) {
                path.unshift(folder);
                curr = folder.parentId;
            } else {
                break;
            }
        }
        return path;
    }, [currentFolderId, documents]);

    // --- Handlers ---
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = '';

        const task = {
            id: `${Date.now()}-${file.name}`,
            file,
            folderId: currentFolderId,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'queued',
            error: null,
        };

        setUploadTasks((prev) => [...prev, task]);
        window.setTimeout(() => startUploadTask(task), 0);
    };

    const submitCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await documentService.createFolder(projectId, newFolderName.trim(), currentFolderId);
            toast.success(t('projectDocuments.createFolderSuccess', 'Folder created successfully'));
            setShowCreateFolder(false);
            setNewFolderName('');
            loadDocuments();
        } catch (err) {
            toast.error(err?.message || t('ui.common.error'));
        }
    };

    const submitRename = async () => {
        if (!showRename || !newFolderName.trim()) return;
        try {
            await documentService.renameDocument(projectId, showRename.id, newFolderName.trim());
            toast.success(t('projectDocuments.renameSuccess', 'Renamed successfully'));
            setShowRename(null);
            setNewFolderName('');
            loadDocuments();
        } catch (err) {
            toast.error(err?.message || t('ui.common.error'));
        }
    };

    const submitMove = async () => {
        if (!showMove) return;
        const targetId = moveTargetId === 'root' ? null : moveTargetId;
        
        // Cycle prevention
        if (targetId === showMove.id) {
            toast.error("Cannot move a folder into itself.");
            return;
        }

        try {
            await documentService.moveDocument(projectId, showMove.id, targetId);
            toast.success(t('projectDocuments.moveSuccess', 'Moved successfully'));
            setShowMove(null);
            setMoveTargetId('');
            loadDocuments();
        } catch (err) {
            toast.error(err?.message || t('ui.common.error'));
        }
    };

    const handleSelectRow = (doc) => {
        setSelectedDoc(doc);
    };

    const confirmDelete = (doc) => {
        setDocToDelete(doc);
    };

    const handleDelete = async () => {
        if (!docToDelete) return;
        try {
            await documentService.deleteProjectDocument(projectId, docToDelete.id);
            toast.success(t('projectDocuments.deleteSuccess', 'Document deleted'));
            loadDocuments();
        } catch (err) {
            toast.error(err?.message || t('ui.common.error'));
        } finally {
            setDocToDelete(null);
        }
    };

    const handleDownload = async (doc) => {
        try {
            const data = await documentService.getDocumentDownloadLink(projectId, doc.id);
            if (data?.downloadUrl) {
                window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
            } else {
                throw new Error("No download link received");
            }
        } catch (err) {
            console.error("Download error:", err);
            toast.error(t('ui.common.error'));
        }
    };

    const handlePreview = async (doc) => {
        if (doc.isFolder) {
            setCurrentFolderId(doc.id);
            return;
        }
        try {
            setPreviewDoc(doc);
            setPreviewUrl(null); // Show loading
            const data = await documentService.getDocumentDownloadLink(projectId, doc.id);
            if (data?.downloadUrl) {
                setPreviewUrl(data.downloadUrl);
            } else {
                throw new Error("No download link received");
            }
        } catch (err) {
            console.error("Preview error:", err);
            toast.error(t('ui.common.error'));
            setPreviewDoc(null);
        }
    };

    const handleToggleEmbed = async (doc) => {
        if (doc.isFolder || updatingEmbedDocId) return;

        try {
            setUpdatingEmbedDocId(doc.id);
            const updated = await documentService.setAllowEmbedded(projectId, doc.id, !doc.allowEmbedded);
            setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, allowEmbedded: updated?.allowEmbedded ?? !doc.allowEmbedded } : d));
            toast.success(updated?.allowEmbedded ? 'Đã bật Embed for AI' : 'Đã tắt Embed for AI');
        } catch (err) {
            console.error('Toggle embed error:', err);
            toast.error(err?.message || t('ui.common.error'));
        } finally {
            setUpdatingEmbedDocId(null);
        }
    };

    const getParentId = (folderId) => {
        const f = documents.find(d => d.id === folderId);
        return f ? f.parentId : null;
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">{t('projectDocuments.accessRestricted', 'Access Restricted')}</h3>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    const currentMoveFolderId = moveTargetId === 'root' ? null : moveTargetId;
    const moveBreadcrumbs = (() => {
        const path = [];
        let curr = currentMoveFolderId;
        while (curr) {
            const folder = allFolders.find(d => d.id === curr);
            if (folder) {
                path.unshift(folder);
                curr = folder.parentId;
            } else { break; }
        }
        return path;
    })();

    const moveSubfolders = allFolders.filter(f => 
        (currentMoveFolderId ? f.parentId === currentMoveFolderId : !f.parentId) &&
        f.id !== showMove?.id // Don't show current folder itself
    );
    return (
        <div className="grid h-[calc(100vh-180px)] min-h-[560px] grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12">
            <div className={cn(
                "flex min-w-0 flex-col space-y-4 overflow-hidden xl:col-span-12",
                selectedDoc && "xl:col-span-8 2xl:col-span-9"
            )}>
            {/* Header / Actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-sm text-muted-foreground whitespace-nowrap">
                        <button
                            onClick={() => setCurrentFolderId(null)}
                            className="font-medium text-foreground transition-colors hover:text-primary"
                        >
                            {t('projectDocuments.title', 'Project Documents')}
                        </button>
                        {breadcrumbs.map(f => (
                            <React.Fragment key={f.id}>
                                <ChevronRight className="h-4 w-4 shrink-0" />
                                <button
                                    onClick={() => setCurrentFolderId(f.id)}
                                    className="transition-colors hover:text-primary"
                                >
                                    {f.fileName}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-[220px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('ui.common.search', 'Search')}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setNewFolderName('');
                            setShowCreateFolder(true);
                        }}
                        className="flex items-center gap-2"
                    >
                        <FolderPlus className="w-4 h-4" />
                        {t('projectDocuments.newFolder', 'New Folder')}
                    </Button>
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <Button
                        onClick={handleUploadClick}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        {t('projectDocuments.upload', 'Upload Document')}
                    </Button>
                </div>
            </div>

            {/* List */}
            <Card className="min-h-0 flex-1 overflow-hidden shadow-sm">
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted/60">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="px-4 py-3 uppercase">{t('projectDocuments.columns.name', 'Name')}</TableHead>
                                <TableHead className="px-4 py-3 uppercase">{t('projectDocuments.columns.size', 'Size')}</TableHead>
                                <TableHead className="px-4 py-3 uppercase">{t('projectDocuments.columns.date', 'Upload Date')}</TableHead>
                                <TableHead className="px-4 py-3 text-right uppercase">{t('ui.common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentFolderId && !loading && (
                                <TableRow
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setCurrentFolderId(getParentId(currentFolderId))}
                                >
                                    <TableCell className="px-4 py-3" colSpan={4}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2">
                                                <CornerLeftUp className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <span className="font-medium text-muted-foreground">..</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        {t('ui.common.loading', 'Loading...')}
                                    </TableCell>
                                </TableRow>
                            ) : visibleDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-6">
                                        <EmptyState
                                            icon={currentFolderId ? FolderIcon : FileText}
                                            title={searchQuery ? t('ui.common.noResults', 'No results found') : (currentFolderId ? t('projectDocuments.folderEmpty', 'This folder is empty') : t('projectDocuments.empty', 'No documents yet'))}
                                            description={searchQuery ? t('projectDocuments.searchEmpty', 'Try a different document name or file type.') : t('projectDocuments.emptyHint', 'Upload a document or create a folder to get started.')}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleDocuments.map(doc => (
                                    <TableRow
                                        key={doc.id}
                                        className={cn(
                                            "group cursor-pointer",
                                            selectedDoc?.id === doc.id && "bg-primary/10"
                                        )}
                                        onClick={() => handleSelectRow(doc)}
                                        onDoubleClick={() => {
                                            if (doc.isFolder) {
                                                setCurrentFolderId(doc.id);
                                            } else {
                                                handlePreview(doc);
                                            }
                                        }}
                                    >
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded">
                                                    {getFileIcon(doc.isFolder, doc.fileType, doc.fileName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate max-w-[300px]" title={doc.fileName}>
                                                        {doc.fileName}
                                                    </p>
                                                    {!doc.isFolder && doc.allowEmbedded && (
                                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                            {doc.aiIndexed ? 'RAG Ready' : 'Embedding Enabled'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-muted-foreground">
                                            {doc.isFolder ? '-' : formatBytes(doc.fileSize)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-muted-foreground">
                                            {formatDate(doc.createdAt, 'PPp')}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!doc.isFolder && (
                                                        <DropdownMenuItem onClick={() => handlePreview(doc)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            {t('ui.common.view', 'View')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {!doc.isFolder && (
                                                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            {t('ui.common.download', 'Download')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => {
                                                        setNewFolderName(doc.fileName);
                                                        setShowRename(doc);
                                                    }}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        {t('projectDocuments.rename', 'Rename')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setMoveTargetId('root');
                                                        setShowMove(doc);
                                                    }}>
                                                        <MoveRight className="w-4 h-4 mr-2" />
                                                        {t('projectDocuments.move', 'Move')}
                                                    </DropdownMenuItem>
                                                    {!doc.isFolder && (
                                                        <DropdownMenuItem onClick={() => handleToggleEmbed(doc)} disabled={updatingEmbedDocId === doc.id}>
                                                            {updatingEmbedDocId === doc.id ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <FileText className="w-4 h-4 mr-2" />
                                                            )}
                                                            {doc.allowEmbedded ? 'Disable Embed for AI' : 'Enable Embed for AI'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => confirmDelete(doc)}
                                                        className="text-red-600 dark:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        {t('ui.common.delete', 'Delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>

            {selectedDoc && (
                <ProjectDocumentDetailPanel
                    projectId={projectId}
                    selectedItem={selectedDoc}
                    documents={documents}
                    onClose={() => {
                        setSelectedDoc(null);
                    }}
                />
            )}

            {/* Modals */}
            <ConfirmDialog
                open={!!docToDelete}
                onOpenChange={(open) => !open && setDocToDelete(null)}
                onConfirm={handleDelete}
                title={t('projectDocuments.deleteConfirmTitle', 'Delete Document')}
                message={t('projectDocuments.deleteConfirm', 'Are you sure you want to delete {{name}}?', { name: docToDelete?.fileName })}
                confirmText={t('ui.common.delete', 'Delete')}
                cancelText={t('ui.common.cancel', 'Cancel')}
                variant="danger"
            />

            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('projectDocuments.newFolder', 'New Folder')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            autoFocus
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitCreateFolder()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateFolder(false)}>{t('ui.common.cancel', 'Cancel')}</Button>
                        <Button onClick={submitCreateFolder} disabled={!newFolderName.trim()}>
                            {t('ui.common.create', 'Create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!showRename} onOpenChange={(open) => !open && setShowRename(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('projectDocuments.rename', 'Rename')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            autoFocus
                            placeholder="New Name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRename(null)}>{t('ui.common.cancel', 'Cancel')}</Button>
                        <Button onClick={submitRename} disabled={!newFolderName.trim() || newFolderName === showRename?.fileName}>
                            {t('ui.common.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!showMove} onOpenChange={(open) => !open && (setShowMove(null), setMoveTargetId(''))}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('projectDocuments.move', 'Move')} "{showMove?.fileName}"</DialogTitle>
                        <DialogDescription>
                            Select destination folder:
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        {/* Folder Navigator UI similar to image7.png */}
                        <div className="border rounded-md bg-muted/20">
                            <div className="bg-muted/50 px-3 py-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setMoveTargetId('root')}
                                >
                                    Home
                                </Button>
                                {moveBreadcrumbs.map(f => (
                                    <React.Fragment key={f.id}>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 px-2 text-xs"
                                            onClick={() => setMoveTargetId(f.id)}
                                        >
                                            {f.fileName}
                                        </Button>
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="p-2 min-h-[200px] max-h-[300px] overflow-y-auto grid grid-cols-3 gap-2">
                                {currentMoveFolderId && (
                                    <div 
                                        className="flex flex-col items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                                        onClick={() => {
                                            const parent = allFolders.find(f => f.id === currentMoveFolderId)?.parentId;
                                            setMoveTargetId(parent || 'root');
                                        }}
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center">
                                            <CornerLeftUp className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1 text-center font-medium">..</span>
                                    </div>
                                )}

                                {moveSubfolders.length === 0 && (
                                    <div className="col-span-3 flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <FolderIcon className="w-8 h-8 opacity-20 mb-2" />
                                        <p className="text-xs italic">Folder is empty</p>
                                    </div>
                                )}

                                {moveSubfolders.map(f => (
                                    <div 
                                        key={f.id} 
                                        className="flex flex-col items-center p-2 rounded-md hover:bg-primary/10 cursor-pointer group"
                                        onClick={() => setMoveTargetId(f.id)}
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <FolderIcon className="w-10 h-10 text-yellow-500 fill-yellow-200 dark:fill-yellow-900/50" />
                                        </div>
                                        <span className="text-xs mt-1 text-center font-medium line-clamp-1 w-full px-1" title={f.fileName}>
                                            {f.fileName}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-primary/10 rounded-md border border-primary/20">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Moving to: <span className="font-bold">{moveTargetId === 'root' ? 'Home' : allFolders.find(f => f.id === moveTargetId)?.fileName}</span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => (setShowMove(null), setMoveTargetId(''))}>
                            {t('ui.common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={submitMove}>
                            {t('projectDocuments.move', 'Move Here')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-4 md:p-6">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="truncate pr-8">{previewDoc?.fileName}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 bg-muted/20 rounded-md overflow-hidden flex flex-col items-center justify-center relative">
                        {previewUrl ? (
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border-0 bg-white"
                                title="Document Preview"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                <p>Loading preview...</p>
                            </div>
                        )}
                        {previewUrl && (
                            <div className="absolute top-4 right-4 shadow-md rounded-md bg-background/80 backdrop-blur-sm border p-1 opacity-50 hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(previewUrl, '_blank')}
                                    title="Open in new tab"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <UploadProgressPanel
                tasks={uploadTasks}
                onCancel={cancelUpload}
                onCancelAll={cancelAllUploads}
                onRetry={retryUpload}
                onRetryFailed={retryFailedUploads}
                onClearFinished={clearFinishedUploads}
            />

        </div>
    );
}
