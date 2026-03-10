import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { taskService } from "@/features/tasks/api/taskService";
import { useAuth } from "@/context/AuthContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import Button from "@/components/ui/Button";
import { MessageSquare, Send, Edit2, Trash2, X, Check, User, Reply, CornerDownRight, ChevronDown, ChevronUp } from "lucide-react";

function formatRelativeTime(dateString, t) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return t("comments.justNow");
    if (diffMinutes < 60) return t("comments.minutesAgo", { count: diffMinutes });
    if (diffHours < 24) return t("comments.hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("comments.daysAgo", { count: diffDays });
    
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function CommentItem({ comment, currentUserId, onUpdate, onDelete, onReply, t }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editorKey, setEditorKey] = useState(0);

    // Compare authorId with currentUserId - normalize to string for comparison
    const authorIdStr = comment.authorId?.toString?.() || comment.authorId || "";
    const currentUserIdStr = currentUserId?.toString?.() || currentUserId || "";
    const isOwner = authorIdStr && currentUserIdStr && authorIdStr === currentUserIdStr;

    const handleStartEdit = () => {
        setEditContent(comment.content);
        setEditorKey(prev => prev + 1); // Force re-mount of editor
        setIsEditing(true);
    };

    const handleUpdate = async () => {
        if (!editContent || editContent === "<p><br></p>") return;
        setIsUpdating(true);
        try {
            await onUpdate(comment.id, editContent);
            setIsEditing(false);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(comment.id);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditContent(comment.content);
        setIsEditing(false);
    };

    return (
        <div className="flex gap-3 py-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
                {comment.authorAvatar ? (
                    <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                        {comment.authorName || t("comments.anonymous")}
                    </span>
                    {/* Reply indicator */}
                    {comment.parentAuthorName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3" />
                            {t("comments.replyTo")} <span className="font-medium">{comment.parentAuthorName}</span>
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt, t)}
                    </span>
                    {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <span className="text-xs text-muted-foreground italic">
                            ({t("comments.edited")})
                        </span>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                        <RichTextEditor
                            key={`edit-${editorKey}`}
                            value={editContent}
                            onChange={setEditContent}
                            placeholder={t("comments.editPlaceholder")}
                            className="min-h-[100px] bg-background"
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleUpdate}
                                disabled={isUpdating || !editContent || editContent === "<p><br></p>"}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                {isUpdating ? t("comments.saving") : t("comments.save")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                            >
                                <X className="w-4 h-4 mr-1" />
                                {t("comments.cancel")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                )}

                {/* Actions */}
                {!isEditing && (
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => onReply(comment)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                            <Reply className="w-3 h-3" />
                            {t("comments.reply")}
                        </button>
                        {isOwner && (
                            <>
                                <button
                                    onClick={handleStartEdit}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    {t("comments.edit")}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    {isDeleting ? t("comments.deleting") : t("comments.delete")}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TaskComments({ taskId }) {
    const { t } = useTranslation();
    const { userProfile } = useAuth();
    const currentUserId = userProfile?.id;
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [replyTo, setReplyTo] = useState(null); // { id, authorName }
    const [editorKey, setEditorKey] = useState(0);
    const [expandedRoots, setExpandedRoots] = useState(new Set()); // Track which root comments have expanded replies

    // Helper function to organize comments into { rootComments, repliesByRoot }
    const organizeComments = (rawComments) => {
        if (!Array.isArray(rawComments)) return { rootComments: [], repliesByRoot: new Map() };
        
        // Create a map for quick lookup
        const commentMap = new Map();
        rawComments.forEach(c => commentMap.set(c.id, c));
        
        // Find root comment id for any comment (traverse up the parent chain)
        const getRootId = (comment) => {
            let current = comment;
            while (current.parentCommentId && commentMap.has(current.parentCommentId)) {
                current = commentMap.get(current.parentCommentId);
            }
            return current.id;
        };
        
        // Separate root comments and replies
        const rootComments = rawComments.filter(c => !c.parentCommentId);
        const replies = rawComments.filter(c => c.parentCommentId);
        
        // Group replies by their root comment
        const repliesByRoot = new Map();
        replies.forEach(reply => {
            const rootId = getRootId(reply);
            if (!repliesByRoot.has(rootId)) {
                repliesByRoot.set(rootId, []);
            }
            repliesByRoot.get(rootId).push(reply);
        });
        
        // Sort replies by createdAt within each group
        repliesByRoot.forEach((replyList, rootId) => {
            replyList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        
        return { rootComments, repliesByRoot };
    };

    const [organizedData, setOrganizedData] = useState({ rootComments: [], repliesByRoot: new Map() });

    const fetchComments = useCallback(async () => {
        if (!taskId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await taskService.getComments(taskId);
            setOrganizedData(organizeComments(data));
            // Also keep flat list for total count
            setComments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
            setError(t("comments.fetchError"));
        } finally {
            setIsLoading(false);
        }
    }, [taskId, t]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleAddComment = async () => {
        if (!newComment || newComment === "<p><br></p>") return;
        setIsSubmitting(true);
        try {
            const added = await taskService.addComment(taskId, newComment, replyTo?.id || null);
            // Update both flat list and organized data
            const newComments = [...comments, added];
            setComments(newComments);
            setOrganizedData(organizeComments(newComments));
            // Auto-expand replies for the root comment if this is a reply
            if (added.parentCommentId) {
                // Find root of this reply
                const findRoot = (commentId) => {
                    const comment = newComments.find(c => c.id === commentId);
                    if (!comment || !comment.parentCommentId) return commentId;
                    return findRoot(comment.parentCommentId);
                };
                const rootId = findRoot(added.parentCommentId);
                setExpandedRoots(prev => new Set([...prev, rootId]));
            }
            setNewComment("");
            setReplyTo(null);
            setEditorKey(prev => prev + 1);
        } catch (err) {
            console.error("Failed to add comment:", err);
            setError(t("comments.addError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId, content) => {
        try {
            const updated = await taskService.updateComment(commentId, content);
            const newComments = comments.map(c => c.id === commentId ? updated : c);
            setComments(newComments);
            setOrganizedData(organizeComments(newComments));
        } catch (err) {
            console.error("Failed to update comment:", err);
            setError(t("comments.updateError"));
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await taskService.deleteComment(commentId);
            const newComments = comments.filter(c => c.id !== commentId);
            setComments(newComments);
            setOrganizedData(organizeComments(newComments));
        } catch (err) {
            console.error("Failed to delete comment:", err);
            setError(t("comments.deleteError"));
        }
    };

    const toggleReplies = (rootId) => {
        setExpandedRoots(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rootId)) {
                newSet.delete(rootId);
            } else {
                newSet.add(rootId);
            }
            return newSet;
        });
    };

    const handleReply = (comment) => {
        setReplyTo({ id: comment.id, authorName: comment.authorName || t("comments.anonymous") });
        setNewComment("");
        setEditorKey(prev => prev + 1);
        // Scroll to comment input
        setTimeout(() => {
            document.getElementById("comment-input")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquare className="w-4 h-4" />
                {t("comments.title")} ({comments.length})
            </div>

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            {/* Add new comment */}
            <div id="comment-input" className="space-y-2">
                {/* Reply indicator */}
                {replyTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                        <CornerDownRight className="w-4 h-4" />
                        <span>{t("comments.replyingTo")} <span className="font-medium text-foreground">{replyTo.authorName}</span></span>
                        <button
                            onClick={cancelReply}
                            className="ml-auto hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <RichTextEditor
                    key={`new-${editorKey}`}
                    value={newComment}
                    onChange={setNewComment}
                    placeholder={replyTo ? t("comments.replyPlaceholder") : t("comments.placeholder")}
                    className="min-h-[80px]"
                />
                <div className="flex justify-end">
                    <Button
                        onClick={handleAddComment}
                        disabled={isSubmitting || !newComment || newComment === "<p><br></p>"}
                        size="sm"
                    >
                        <Send className="w-4 h-4 mr-1" />
                        {isSubmitting ? t("comments.sending") : (replyTo ? t("comments.sendReply") : t("comments.send"))}
                    </Button>
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-1">
                {isLoading ? (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                        {t("comments.loading")}
                    </div>
                ) : organizedData.rootComments.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                        {t("comments.noComments")}
                    </div>
                ) : (
                    organizedData.rootComments.map(rootComment => {
                        const replies = organizedData.repliesByRoot.get(rootComment.id) || [];
                        const isExpanded = expandedRoots.has(rootComment.id);
                        const replyCount = replies.length;
                        
                        return (
                            <div key={rootComment.id} className="border-b border-border last:border-b-0">
                                {/* Root comment */}
                                <CommentItem
                                    comment={rootComment}
                                    currentUserId={currentUserId}
                                    onUpdate={handleUpdateComment}
                                    onDelete={handleDeleteComment}
                                    onReply={handleReply}
                                    t={t}
                                />
                                
                                {/* Toggle replies button */}
                                {replyCount > 0 && (
                                    <button
                                        onClick={() => toggleReplies(rootComment.id)}
                                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 ml-11 mb-2 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="w-3 h-3" />
                                                {t("comments.hideReplies", { count: replyCount })}
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3 h-3" />
                                                {t("comments.showReplies", { count: replyCount })}
                                            </>
                                        )}
                                    </button>
                                )}
                                
                                {/* Replies (collapsible) */}
                                {isExpanded && replies.map(reply => (
                                    <div 
                                        key={reply.id}
                                        className="ml-8 border-l-2 border-l-muted pl-3"
                                    >
                                        <CommentItem
                                            comment={reply}
                                            currentUserId={currentUserId}
                                            onUpdate={handleUpdateComment}
                                            onDelete={handleDeleteComment}
                                            onReply={handleReply}
                                            t={t}
                                        />
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
