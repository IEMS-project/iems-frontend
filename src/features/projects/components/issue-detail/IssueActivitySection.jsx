import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Send, X, CornerDownRight, ArrowRight } from "lucide-react";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";
import Button from "@/components/ui/Button";
import MentionInput, { CommentContent } from "@/components/ui/MentionInput";
import Skeleton from "@/components/ui/Skeleton";
import { getActivityMeta } from "../../utils/issueStyles";
import IssueAvatar from "./IssueAvatar";
import CollapsibleSection from "./CollapsibleSection";

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
  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

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
      await issueService.addComment(projectId, issueId, { 
        content: newComment.trim(),
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
    const authorName = comment.authorName || getAuthorName(comment.authorId) || "user";
    const authorId = comment.authorId;
    const mention = `@[${authorName}](${authorId}) `;
    if (!newComment.includes(mention)) {
      setNewComment(prev => mention + prev);
    }
    // Scroll to input
    document.getElementById("main-comment-input")?.focus();
    document.getElementById("main-comment-input")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getAuthorName = (userId) => {
    if (!userId) return null;
    const m = members.find(m => (m.accountId || m.id) === userId);
    return m?.fullName || m?.userName || m?.name || m?.email || null;
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentCommentId) {
      acc[c.parentCommentId] = acc[c.parentCommentId] || [];
      acc[c.parentCommentId].push(c);
    }
    return acc;
  }, {});

  const renderComment = (comment, isReply = false) => {
    const name = comment.authorName || getAuthorName(comment.authorId) || "Unknown";
    const replies = repliesByParent[comment.id] || [];
    return (
      <div key={comment.id} className={isReply ? "pl-8 mt-2" : ""}>
        <div
          id={`comment-${comment.id}`}
          className={`rounded-lg p-3 transition-colors ${
            String(comment.id) === String(targetCommentId)
              ? "bg-primary/10 ring-2 ring-primary/40"
              : isReply ? "bg-muted/40 border-l-2 border-blue-400" : "bg-muted/60"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <IssueAvatar name={name} />
              <span className="text-xs font-semibold text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground" title={comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}>
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            {!isReply && (
              <button
                onClick={() => handleStartReply(comment)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />Reply
              </button>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"><CommentContent content={comment.content} /></p>
        </div>
        {replies.length > 0 && <div className="space-y-2 mt-2">{replies.map(r => renderComment(r, true))}</div>}
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
    <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
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
