import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Send, X, CornerDownRight, ArrowRight, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";
import Button from "@/components/ui/button";
import MentionInput, { CommentContent, convertMarkdownToPlainText, convertPlainTextToMarkdown } from "@/components/ui/MentionInput";
import Skeleton from "@/components/ui/skeleton";
import { getActivityMeta } from "../../utils/issueStyles";
import IssueAvatar from "./IssueAvatar";
import CollapsibleSection from "./CollapsibleSection";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

function StatusBadge({ value, workflowStatuses }) {
  if (!value) return null;
  const status = workflowStatuses.find(s => s.id === value || s.name === value);
  const name = status?.name || value;
  const color = status?.color || "#6B7280";
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: color + "22", color, border: `1px solid ${color}55` }}
    >
      {name}
    </span>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3 pb-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-lg bg-muted/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export default function IssueActivitySection({
  projectId,
  issueId,
  targetCommentId,
  members,
  workflowStatuses,
  collapsed,
  onToggle,
  hasChildren,
  onAddChild
}) {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === "vi";

  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [expandedComments, setExpandedComments] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [activityLoadingMore, setActivityLoadingMore] = useState(false);
  const activityPageRef = useRef(0);
  const activityHasMoreRef = useRef(false);
  const activityLoadingMoreRef = useRef(false);
  const activitySentinelRef = useRef(null);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const d = await issueService.getComments(projectId, issueId);
      setComments(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await issueService.getActivityLogs(projectId, issueId, 0, 10);
      setActivityLogs(res.content || []);
      activityHasMoreRef.current = !res.last;
      activityPageRef.current = 0;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadMoreActivityLogs = useCallback(() => {
    if (activityLoadingMoreRef.current || !activityHasMoreRef.current) return;
    activityLoadingMoreRef.current = true;
    setActivityLoadingMore(true);
    const next = activityPageRef.current + 1;
    issueService.getActivityLogs(projectId, issueId, next, 10)
      .then(res => {
        setActivityLogs(prev => [...prev, ...(res.content || [])]);
        activityHasMoreRef.current = !res.last;
        if (!res.empty) activityPageRef.current = next;
      })
      .catch(() => {})
      .finally(() => {
        activityLoadingMoreRef.current = false;
        setActivityLoadingMore(false);
      });
  }, [projectId, issueId]);

  useEffect(() => {
    if (!issueId) return;
    loadComments();
    loadActivityLogs();
  }, [issueId]);

  useEffect(() => {
    if (!targetCommentId || loadingComments || comments.length === 0) return;

    setActiveTab("comments");

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`comment-${targetCommentId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [targetCommentId, loadingComments, comments]);

  useEffect(() => {
    const el = activitySentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) loadMoreActivityLogs();
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMoreActivityLogs, loadingLogs]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const parsedContent = convertPlainTextToMarkdown(newComment.trim(), members);
      await issueService.addComment(projectId, issueId, { 
        content: parsedContent,
        parentCommentId: replyingTo?.id
      });
      setNewComment("");
      setReplyingTo(null);
      await loadComments();
    } catch (e) {
      toast.error(e?.message || "Error");
    }
  };

  const handleStartReply = (comment) => {
    setReplyingTo(comment);
    // Scroll to input
    document.getElementById("main-comment-input")?.focus();
    document.getElementById("main-comment-input")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getAuthorName = (userId) => {
    if (!userId) return null;
    const m = members.find(m => (m.accountId || m.id) === userId);
    return m?.fullName || m?.userName || m?.name || m?.email || null;
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(convertMarkdownToPlainText(comment.content));
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      const parsedContent = convertPlainTextToMarkdown(editingText.trim(), members);
      await issueService.updateComment(projectId, issueId, commentId, {
        content: parsedContent
      });
      toast.success(isVi ? "Đã cập nhật bình luận" : "Comment updated successfully");
      setEditingCommentId(null);
      setEditingText("");
      await loadComments();
    } catch (e) {
      toast.error(e?.message || (isVi ? "Lỗi khi cập nhật bình luận" : "Error updating comment"));
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmMsg = isVi 
      ? "Bạn có chắc chắn muốn xóa bình luận này không?" 
      : "Are you sure you want to delete this comment?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await issueService.deleteComment(projectId, issueId, commentId);
      toast.success(isVi ? "Đã xóa bình luận thành công" : "Comment deleted successfully");
      await loadComments();
    } catch (e) {
      toast.error(e?.message || (isVi ? "Lỗi khi xóa bình luận" : "Error deleting comment"));
    }
  };

  // Build a map of all comments for quick lookup
  const commentsMap = new Map(comments.map(c => [c.id, c]));

  // Helper to trace root parent comment ID
  const getRootParentId = (commentId) => {
    let current = commentsMap.get(commentId);
    if (!current) return null;
    while (current.parentCommentId && commentsMap.has(current.parentCommentId)) {
      current = commentsMap.get(current.parentCommentId);
    }
    return current.id;
  };

  // Helper to get name of parent comment author
  const getParentAuthorName = (comment) => {
    if (!comment.parentCommentId) return null;
    const parentComment = commentsMap.get(comment.parentCommentId);
    if (!parentComment) return null;
    return parentComment.authorName || getAuthorName(parentComment.authorId) || "User";
  };

  // Filter top level (root) comments
  const topLevelComments = comments.filter(c => !c.parentCommentId || !commentsMap.has(c.parentCommentId));

  // Group all replies flat under their root ancestor
  const repliesByRootParent = comments.reduce((acc, c) => {
    if (c.parentCommentId && commentsMap.has(c.parentCommentId)) {
      const rootId = getRootParentId(c.id);
      if (rootId && rootId !== c.id) {
        acc[rootId] = acc[rootId] || [];
        acc[rootId].push(c);
      }
    }
    return acc;
  }, {});

  // Sort flat replies under each root by creation date
  Object.keys(repliesByRootParent).forEach(rootId => {
    repliesByRootParent[rootId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  });

  const renderComment = (comment, isReply = false, rootId = null) => {
    const name = comment.authorName || getAuthorName(comment.authorId) || "Unknown";
    const replies = repliesByRootParent[comment.id] || [];
    const isEdited = comment.updatedAt && comment.updatedAt !== comment.createdAt;
    
    const member = members.find(m => (m.accountId || m.id) === comment.authorId);
    const avatarSrc = comment.authorImage || member?.image || member?.avatar || member?.imageUrl;

    const isAuthor = userProfile && String(comment.authorId) === String(userProfile.id);
    const targetName = getParentAuthorName(comment);

    return (
      <div key={comment.id} className="group relative">
        <div
          id={`comment-${comment.id}`}
          className={`rounded-xl p-3.5 transition-all duration-200 ${
            String(comment.id) === String(targetCommentId)
              ? "bg-primary/10 ring-2 ring-primary/40 shadow-sm"
              : isReply 
                ? "bg-muted/30 border-l-2 border-blue-400/70 hover:bg-muted/40" 
                : "bg-muted/50 hover:bg-muted/60 shadow-sm"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <IssueAvatar name={name} src={avatarSrc} user={member} size={isReply ? "sm" : "md"} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs font-semibold text-foreground">{name}</span>
                {targetName && comment.parentCommentId !== rootId && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {isVi ? "trả lời" : "replied to"} <span className="font-semibold text-foreground/80">@{targetName}</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground" title={comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}>
                {timeAgo(comment.createdAt)}
                {isEdited && (
                  <span className="ml-1.5 text-[10px] italic font-normal text-muted-foreground/80">
                    {isVi ? "(đã chỉnh sửa)" : "(edited)"}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Content / Edit Box */}
          {editingCommentId === comment.id ? (
            <div className="mt-1.5 space-y-2">
              <MentionInput
                value={editingText}
                onChange={setEditingText}
                projectId={projectId}
                placeholder={isVi ? "Sửa bình luận..." : "Edit comment..."}
                rows={3}
                className="w-full"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingText("");
                  }}
                  className="px-3 h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isVi ? "Hủy" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateComment(comment.id)}
                  disabled={!editingText.trim()}
                  className="px-3 h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isVi ? "Lưu" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap pl-0.5">
              <CommentContent content={comment.content} />
            </p>
          )}

          {/* Footer Action Buttons (Only when not editing) */}
          {editingCommentId !== comment.id && (
            <div className="flex items-center gap-3.5 mt-2.5 pt-1 border-t border-border/10 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleStartReply(comment)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />
                {isVi ? "Trả lời" : "Reply"}
              </button>
              {isAuthor && (
                <>
                  <button
                    onClick={() => handleStartEdit(comment)}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {isVi ? "Sửa" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    {isVi ? "Xóa" : "Delete"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nested replies section for top-level comments */}
        {!isReply && replies.length > 0 && (
          <div className="mt-2 pl-4 ml-4 border-l border-border/80 space-y-3">
            <button
              onClick={() => {
                setExpandedComments(prev => ({
                  ...prev,
                  [comment.id]: !prev[comment.id]
                }));
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors px-1 py-1"
            >
              {expandedComments[comment.id] ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  {isVi ? `Ẩn ${replies.length} phản hồi` : `Hide ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  {isVi ? `Xem ${replies.length} phản hồi` : `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                </>
              )}
            </button>

            {expandedComments[comment.id] && (
              <div className="space-y-3 pt-1">
                {replies.map(r => renderComment(r, true, comment.id))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderActivity = (log) => {
    const { icon: Icon, color } = getActivityMeta(log.action);
    const initials = log.userName ? log.userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
    let fromVal = log.oldValue ?? null;
    let toVal = log.newValue ?? null;
    if (log.action === "ISSUE_STATUS_CHANGED" && fromVal == null && toVal == null && log.details?.includes("→")) {
      const colonIdx = log.details.indexOf(":");
      const raw = colonIdx !== -1 ? log.details.slice(colonIdx + 1) : log.details;
      const parts = raw.split("→");
      fromVal = parts[0]?.trim() || null;
      toVal = parts[1]?.trim() || null;
    }
    const isStatusChange = log.action === "ISSUE_STATUS_CHANGED" && (fromVal != null || toVal != null);
    
    return (
      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {log.userImage
              ? <img src={log.userImage} alt={log.userName} className="w-5 h-5 rounded-full object-cover shrink-0" />
              : <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{initials}</div>
            }
            <span className="text-xs font-semibold text-foreground">{log.userName || "Unknown"}</span>
          </div>
          {isStatusChange ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge value={fromVal} workflowStatuses={workflowStatuses} />
              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <StatusBadge value={toVal} workflowStatuses={workflowStatuses} />
            </div>
          ) : (
            <p className="text-sm text-foreground">{log.details}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5" title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}>{timeAgo(log.createdAt)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-5 mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <CollapsibleSection
        title="Activity"
        collapsed={collapsed}
        onToggle={onToggle}
        action={
          !hasChildren && (
            <button onClick={onAddChild}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium">
              <Plus className="w-3.5 h-3.5" /> Child issue
            </button>
          )
        }
      >
        <div className="flex gap-0 border-b border-border mb-3">
          {[["comments", "Comments"], ["history", "History"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${activeTab === key ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {label}
              {key === "comments" && comments.length > 0 && <span className="ml-1.5 bg-muted rounded-full px-1.5 py-0.5 text-[10px]">{comments.length}</span>}
              {key === "history" && activityLogs.length > 0 && <span className="ml-1.5 bg-muted rounded-full px-1.5 py-0.5 text-[10px]">{activityLogs.length}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-3 pb-3">
          {(activeTab === "comments" && loadingComments) || (activeTab === "history" && loadingLogs) ? (
            <ActivitySkeleton />
          ) : null}

          {activeTab === "comments" && !loadingComments && (
            topLevelComments.length === 0
              ? <p className="text-sm text-muted-foreground italic">No comments yet</p>
              : topLevelComments.map(c => renderComment(c))
          )}

          {activeTab === "history" && !loadingLogs && (
            activityLogs.length === 0
              ? <p className="text-sm text-muted-foreground italic">No history yet</p>
              : (
                <>
                  {activityLogs.map(log => renderActivity(log))}
                  <div ref={activitySentinelRef} className="h-4 w-full flex items-center justify-center">
                    {activityLoadingMore && <span className="text-xs text-muted-foreground">Loading more...</span>}
                  </div>
                </>
              )
          )}
        </div>

        {activeTab === "comments" && (
          <div className="border-t border-border pt-4 mt-2">
            {replyingTo && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-t-lg border-x border-t border-blue-100 dark:border-blue-800 text-xs">
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-medium">
                  <CornerDownRight className="w-3 h-3" />
                  Replying to <span className="font-bold">{replyingTo.authorName || getAuthorName(replyingTo.authorId)}</span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <MentionInput
                  id="main-comment-input"
                  value={newComment}
                  onChange={setNewComment}
                  projectId={projectId}
                  placeholder={replyingTo ? "Write a reply..." : "Add a comment... type @ to mention someone"}
                  rows={4}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleAddComment(); }}
                  className={replyingTo ? "rounded-t-none border-t-0" : ""}
                />
              </div>
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()} className="self-end rounded-lg h-10 w-10 p-0 shrink-0">
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              Tip: Press <kbd className="font-sans font-semibold text-foreground">Ctrl + Enter</kbd> to send quickly
            </p>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
