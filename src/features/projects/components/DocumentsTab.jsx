import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes, formatDate } from '@/lib/utils';
import { documentService } from '@/features/projects/api/documentService';
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ProjectDocumentDetailPanel from './ProjectDocumentDetailPanel';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

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
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

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
    const [showSidebar, setShowSidebar] = useState(false);
    const [movePath, setMovePath] = useState([]);

    // Inputs State
    const [newFolderName, setNewFolderName] = useState('');
    const [moveTargetId, setMoveTargetId] = useState('');

    useEffect(() => {
        if (projectId) {
            loadDocuments();
        }
    }, [projectId]);

    const loadDocuments = async () => {
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
    };

    // --- Derived Data ---
    const visibleDocuments = useMemo(() => {
        return documents
            .filter(d => (currentFolderId ? d.parentId === currentFolderId : !d.parentId))
            .sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.fileName.localeCompare(b.fileName);
            });
    }, [documents, currentFolderId]);

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

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = '';

        if (file.size > 50 * 1024 * 1024) {
            toast.error(t('projectDocuments.fileTooLarge', 'File is too large (max 50MB)'));
            return;
        }

        try {
            setUploading(true);
            await documentService.uploadProjectDocument(projectId, file, currentFolderId);
            toast.success(t('projectDocuments.uploadSuccess', 'Document uploaded successfully'));
            loadDocuments();
        } catch (err) {
            console.error("Upload error:", err);
            toast.error(err?.message || t('ui.common.error'));
        } finally {
            setUploading(false);
        }
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
            setMovePath([]);
            loadDocuments();
        } catch (err) {
            toast.error(err?.message || t('ui.common.error'));
        }
    };

    const handleSelectRow = (doc) => {
        setSelectedDoc(doc);
        setShowSidebar(true);
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
        <div className="flex h-[calc(100vh-200px)] overflow-hidden -m-4">
            <div className="flex-1 flex flex-col min-w-0 p-4 space-y-4 overflow-y-auto">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto text-lg font-bold text-foreground whitespace-nowrap">
                    <button
                        onClick={() => setCurrentFolderId(null)}
                        className="hover:text-blue-600 transition-colors"
                    >
                        {t('projectDocuments.title', 'Project Documents')}
                    </button>
                    {breadcrumbs.map(f => (
                        <React.Fragment key={f.id}>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            <button
                                onClick={() => setCurrentFolderId(f.id)}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {f.fileName}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center gap-2">
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
                        disabled={uploading || loading}
                        className="flex items-center gap-2"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? t('projectDocuments.uploading', 'Uploading...') : t('projectDocuments.upload', 'Upload Document')}
                    </Button>
                </div>
            </div>

            {/* List */}
            <Card>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 font-medium">{t('projectDocuments.columns.name', 'Name')}</th>
                                <th className="px-4 py-3 font-medium">{t('projectDocuments.columns.size', 'Size')}</th>
                                <th className="px-4 py-3 font-medium">{t('projectDocuments.columns.date', 'Upload Date')}</th>
                                <th className="px-4 py-3 font-medium text-right">{t('ui.common.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentFolderId && !loading && (
                                <tr
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setCurrentFolderId(getParentId(currentFolderId))}
                                >
                                    <td className="px-4 py-3" colSpan={4}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2">
                                                <CornerLeftUp className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <span className="font-medium text-muted-foreground">..</span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        {t('ui.common.loading', 'Loading...')}
                                    </td>
                                </tr>
                            ) : visibleDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                {currentFolderId ? <FolderIcon className="w-8 h-8 opacity-50" /> : <FileText className="w-8 h-8 opacity-50" />}
                                            </div>
                                            <p className="text-base font-medium text-foreground mb-1">
                                                {currentFolderId ? t('projectDocuments.folderEmpty', 'This folder is empty') : t('projectDocuments.empty', 'No documents yet')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visibleDocuments.map(doc => (
                                    <tr
                                        key={doc.id}
                                        className={cn(
                                            "hover:bg-muted/30 transition-colors group cursor-pointer",
                                            selectedDoc?.id === doc.id && "bg-blue-50/50 dark:bg-blue-900/20"
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
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded">
                                                    {getFileIcon(doc.isFolder, doc.fileType, doc.fileName)}
                                                </div>
                                                <div>
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
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {doc.isFolder ? '-' : formatBytes(doc.fileSize)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(doc.createdAt, 'PPp')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
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
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {showSidebar && selectedDoc && (
            <ProjectDocumentDetailPanel
                projectId={projectId}
                selectedItem={selectedDoc}
                documents={documents}
                onClose={() => setShowSidebar(false)}
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

            <Dialog open={!!showMove} onOpenChange={(open) => !open && (setShowMove(null), setMoveTargetId(''), setMovePath([]))}>
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
                                        className="flex flex-col items-center p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer group"
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

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Moving to: <span className="font-bold">{moveTargetId === 'root' ? 'Home' : allFolders.find(f => f.id === moveTargetId)?.fileName}</span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => (setShowMove(null), setMoveTargetId(''), setMovePath([]))}>
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

        </div>
    );
}
