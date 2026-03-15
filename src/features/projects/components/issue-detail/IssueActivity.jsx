import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  History,
  Send,
  ArrowRightLeft,
  UserCheck,
  Plus,
  Minus,
  Zap,
  CheckCircle2,
  CornerDownRight,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { issueService } from "@/features/projects/api/issueService";
import Avatar from "@/components/ui/Avatar";
import { toast } from "sonner";

/* ── Activity meta helpers ── */
function getActivityMeta(action) {
  switch (action) {
    case "ISSUE_CREATED":
      return { icon: Plus, colorClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" };
    case "ISSUE_STATUS_CHANGED":
      return { icon: ArrowRightLeft, colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" };
    case "ISSUE_ASSIGNED":
      return { icon: UserCheck, colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" };
    case "ISSUE_MOVED_TO_SPRINT":
      return { icon: Zap, colorClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" };
    case "ISSUE_REMOVED_FROM_SPRINT":
      return { icon: Minus, colorClass: "bg-muted text-muted-foreground" };
    default:
      return { icon: CheckCircle2, colorClass: "bg-muted text-muted-foreground" };
  }
}

const TABS = [
  { id: "all", label: "All" },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "history", label: "History", icon: History },
];

/* ── Single comment ── */
function CommentItem({ comment, members, onReply, replyingTo, replyText, setReplyText, onSubmitReply, replies }) {
  const resolveName = (userId) => {
    if (!userId) return "Unknown";
    const m = members.find((m) => m.userId === userId);
    return m?.userName || m?.userEmail || String(userId).slice(0, 8);
  };

  const authorName = comment.authorName || resolveName(comment.userId || comment.authorId);

  return (
    <div>
      <div className="flex items-start gap-3 group">
        <Avatar name={authorName} size="xs" className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-foreground">{authorName}</span>
            <span className="text-xs text-muted-foreground" title={comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}>
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2.5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          <button
            onClick={() => onReply(comment.id)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
          >
            <CornerDownRight className="w-3 h-3" />
            {replyingTo === comment.id ? "Cancel" : "Reply"}
          </button>
        </div>
      </div>

      {/* Nested replies */}
      {replies?.length > 0 && (
        <div className="ml-9 mt-2 space-y-2 border-l-2 border-blue-200 dark:border-blue-800 pl-3">
          {replies.map((r) => {
            const rName = r.authorName || resolveName(r.userId || r.authorId);
            return (
              <div key={r.id} className="flex items-start gap-2">
                <Avatar name={rName} size="xs" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{rName}</span>
                    <span className="text-xs text-muted-foreground" title={r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}>
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2 border-l border-blue-300 dark:border-blue-700">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply input */}
      {replyingTo === comment.id && (
        <div className="ml-9 mt-2 flex gap-2">
          <textarea
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) onSubmitReply(comment.id);
              if (e.key === "Escape") onReply(null);
            }}
            placeholder="Write a reply… (Ctrl+Enter to submit)"
            rows={2}
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            )}
          />
          <div className="flex flex-col gap-1 self-end">
            <button
              onClick={() => onSubmitReply(comment.id)}
              disabled={!replyText.trim()}
              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onReply(null)}
              className="p-2 rounded-md border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Activity log item ── */
function ActivityItem({ log }) {
  const { icon: Icon, colorClass } = getActivityMeta(log.action);
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={cn("mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {log.userImage ? (
            <img src={log.userImage} alt={log.userName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
          ) : (
            <Avatar name={log.userName || "?"} size="xs" className="flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-foreground">{log.userName || "Unknown"}</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{log.details || log.action}</p>
        <p className="text-xs text-muted-foreground mt-0.5" title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}>
          {timeAgo(log.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function IssueActivity({ projectId, issueId, members = [] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [collapsed, setCollapsed] = useState(false);

  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!projectId || !issueId) return;
    try {
      setLoadingComments(true);
      const data = await issueService.getComments(projectId, issueId);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoadingComments(false);
    }
  }, [projectId, issueId]);

  const loadActivityLogs = useCallback(async () => {
    if (!projectId || !issueId) return;
    try {
      setLoadingLogs(true);
      const data = await issueService.getActivityLogs(projectId, issueId);
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load activity logs", e);
    } finally {
      setLoadingLogs(false);
    }
  }, [projectId, issueId]);

  useEffect(() => {
    loadComments();
    loadActivityLogs();
  }, [loadComments, loadActivityLogs]);

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await issueService.addComment(projectId, issueId, { content: newComment.trim() });
      setNewComment("");
      await Promise.all([loadComments(), loadActivityLogs()]);
    } catch (e) {
      toast.error(e?.message || "Error adding comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyText("");
    } else {
      setReplyingTo(commentId);
      setReplyText("");
    }
  };

  const handleSubmitReply = async (parentCommentId) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await issueService.addComment(projectId, issueId, {
        content: replyText.trim(),
        parentCommentId,
      });
      setReplyingTo(null);
      setReplyText("");
      await loadComments();
    } catch (e) {
      toast.error(e?.message || "Error adding reply");
    } finally {
      setSubmitting(false);
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentCommentId) {
      acc[c.parentCommentId] = acc[c.parentCommentId] || [];
      acc[c.parentCommentId].push(c);
    }
    return acc;
  }, {});

  const totalCount = comments.length + activityLogs.length;

  // Build unified "All" feed sorted by time
  const allItems = [
    ...comments.filter((c) => !c.parentCommentId).map((c) => ({ type: "comment", data: c, time: c.createdAt })),
    ...activityLogs.map((l) => ({ type: "activity", data: l, time: l.createdAt })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <section className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold text-foreground">Activity</span>
          {totalCount > 0 && (
            <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {totalCount}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadComments();
            loadActivityLogs();
          }}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Tabs */}
          <div className="flex gap-0 border-b border-border mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
                {tab.id === "comments" && comments.length > 0 && (
                  <span className="text-xs bg-muted rounded-full px-1.5 py-0.5">{comments.length}</span>
                )}
                {tab.id === "history" && activityLogs.length > 0 && (
                  <span className="text-xs bg-muted rounded-full px-1.5 py-0.5">{activityLogs.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Comments ── */}
          {(activeTab === "comments" || activeTab === "all") && (
            <div className="space-y-4 mb-4">
              {/* Add comment */}
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) handleAddComment();
                  }}
                  placeholder="Add a comment… (Ctrl+Enter to submit)"
                  rows={3}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  )}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  className="self-end p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Comment list */}
              {activeTab === "comments" && (
                <div className="space-y-4">
                  {loadingComments && (
                    <p className="text-sm text-muted-foreground italic">Loading comments…</p>
                  )}
                  {!loadingComments && topLevelComments.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No comments yet. Be the first!</p>
                  )}
                  {topLevelComments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      members={members}
                      onReply={handleReply}
                      replyingTo={replyingTo}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onSubmitReply={handleSubmitReply}
                      replies={repliesByParent[c.id] || []}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: History ── */}
          {(activeTab === "history" || activeTab === "all") && (
            <div>
              {activeTab === "history" && (
                <div className="space-y-0">
                  {loadingLogs && (
                    <p className="text-sm text-muted-foreground italic">Loading history…</p>
                  )}
                  {!loadingLogs && activityLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No activity yet.</p>
                  )}
                  {activityLogs.map((log) => (
                    <ActivityItem key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: All ── */}
          {activeTab === "all" && (
            <div className="space-y-3 mt-2">
              {(loadingComments || loadingLogs) && (
                <p className="text-sm text-muted-foreground italic">Loading…</p>
              )}
              {!loadingComments && !loadingLogs && allItems.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No activity yet.</p>
              )}
              {allItems.map((item, idx) =>
                item.type === "comment" ? (
                  <CommentItem
                    key={`c-${item.data.id}`}
                    comment={item.data}
                    members={members}
                    onReply={handleReply}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSubmitReply={handleSubmitReply}
                    replies={repliesByParent[item.data.id] || []}
                  />
                ) : (
                  <ActivityItem key={`a-${item.data.id}`} log={item.data} />
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
