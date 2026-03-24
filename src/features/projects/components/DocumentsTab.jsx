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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

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

    return (
        <div className="space-y-4">
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
                                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                        onDoubleClick={() => handlePreview(doc)}
                                    >
                                        <td className="px-4 py-3" onClick={() => doc.isFolder && setCurrentFolderId(doc.id)}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded">
                                                    {getFileIcon(doc.isFolder, doc.fileType, doc.fileName)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground truncate max-w-[300px]" title={doc.fileName}>
                                                        {doc.fileName}
                                                    </p>
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

            <Dialog open={!!showMove} onOpenChange={(open) => !open && setShowMove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('projectDocuments.move', 'Move')} "{showMove?.fileName}"</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm text-muted-foreground">Select destination folder:</p>
                        <select 
                            className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring" 
                            value={moveTargetId} 
                            onChange={e => setMoveTargetId(e.target.value)}
                        >
                            <option value="root">/ (Root)</option>
                            {allFolders
                                .filter(f => f.id !== showMove?.id && f.parentId !== showMove?.id) // very simple cycle prevention
                                .map(f => (
                                    <option key={f.id} value={f.id}>{f.fileName}</option>
                                ))
                            }
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMove(null)}>{t('ui.common.cancel', 'Cancel')}</Button>
                        <Button onClick={submitMove}>{t('projectDocuments.move', 'Move')}</Button>
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
