import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/ui/RichTextEditor";
import Textarea from "@/components/ui/Textarea";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import { cn, timeAgo } from "@/lib/utils";
import {
  Flag, User, CalendarDays, Hash, MessageSquare, Trash2, Send,
  Zap, History, Save, MoreHorizontal, ArrowRightLeft, UserCheck,
  Plus, Minus, CheckCircle2, CornerDownRight, X, Calendar,
  ChevronDown, ChevronRight, Layers, ExternalLink, Check,
} from "lucide-react";

// ── Status badge colour ─────────────────────────────────────────────────────
function getStatusStyle(name = "") {
  const n = name.toLowerCase();
  if (/done|complet|close|resolv|finish/.test(n))
    return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
  if (/progress|doing|review|active|open|start/.test(n))
    return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
  if (/block|cancel|reject|hold/.test(n))
    return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
  return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
}

// ── Activity icon map ───────────────────────────────────────────────────────
function getActivityMeta(action) {
  switch (action) {
    case "ISSUE_CREATED": return { icon: Plus, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" };
    case "ISSUE_STATUS_CHANGED": return { icon: ArrowRightLeft, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" };
    case "ISSUE_ASSIGNED": return { icon: UserCheck, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" };
    case "ISSUE_MOVED_TO_SPRINT": return { icon: Zap, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" };
    case "ISSUE_REMOVED_FROM_SPRINT": return { icon: Minus, color: "bg-muted text-muted-foreground" };
    default: return { icon: CheckCircle2, color: "bg-muted text-muted-foreground" };
  }
}

function initForm(issue) {
  return {
    title: issue?.title || "",
    description: issue?.description || "",
    issueTypeId: issue?.issueTypeId || "",
    statusId: issue?.statusId || "",
    priorityId: issue?.priorityId || "",
    assigneeId: issue?.assigneeId || "",
    sprintId: issue?.sprintId || "",
    storyPoints: issue?.storyPoints ?? "",
    dueDate: issue?.dueDate || "",
  };
}

// ── Portaled dropdown ────────────────────────────────────────────────────────
function ChildIssueDropdown({ options, onSelect, onClose, anchorEl }) {
  const ref = useRef(null);
  useEffect(() => {
    function onMD(e) {
      if (
        ref.current && !ref.current.contains(e.target) &&
        anchorEl && !anchorEl.contains(e.target)
      ) onClose();
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onMD);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMD); document.removeEventListener("keydown", onKey); };
  }, [onClose, anchorEl]);

  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 160),
        zIndex: 9999,
      }}
      className="max-h-52 overflow-y-auto rounded-md border border-border bg-popover shadow-lg py-1"
    >
      {options.map(opt => (
        <button key={String(opt.value)} type="button"
          className="w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-muted text-foreground transition-colors text-left"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSelect(opt.value); }}
        >
          {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
          <span className="truncate">{opt.label}</span>
          {opt.active && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-500" />}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Single child issue row (table-based) ────────────────────────────────────
function ChildIssueRow({ child, issueTypes, issuePriorities, workflowStatuses, members, projectId, onOpenDetail }) {
  const [openField, setOpenField] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [local, setLocal] = useState(child);
  useEffect(() => setLocal(child), [child]);

  const cs = workflowStatuses.find(s => s.id === local.statusId);
  const cp = issuePriorities.find(p => p.id === local.priorityId);
  const ca = members.find(m => (m.accountId || m.id) === local.assigneeId);
  const caName = ca?.fullName || ca?.userName || ca?.email || null;
  const { icon: CPI, color: cpc } = getPriorityIcon(cp?.name);
  const childTypeName = issueTypes.find(it => it.id === local.issueTypeId)?.name || "TASK";
  const ChildIcon = getIssueTypeIcon(childTypeName);
  const childTypeColor = getIssueTypeColor(childTypeName);

  const handleFieldUpdate = async (patch) => {
    const prev = { ...local };
    setLocal(p => ({ ...p, ...patch }));
    setOpenField(null); setAnchorEl(null);
    try {
      await issueService.updateIssue(projectId, local.id, patch);
    } catch (e) {
      setLocal(prev);
      toast.error(e?.message || "Error updating subtask");
    }
  };

  const toggle = (e, field) => {
    e.stopPropagation();
    if (openField === field) { setOpenField(null); setAnchorEl(null); }
    else { setOpenField(field); setAnchorEl(e.currentTarget); }
  };
  const closeField = () => { setOpenField(null); setAnchorEl(null); };

  const priorityOptions = issuePriorities.map(p => {
    const { icon: Icon, color } = getPriorityIcon(p.name);
    return { value: p.id, label: p.name, active: p.id === local.priorityId, icon: <Icon className={cn("w-3.5 h-3.5", color)} /> };
  });
  const statusOptions = workflowStatuses.map(s => ({
    value: s.id, label: s.name, active: s.id === local.statusId,
    icon: <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />,
  }));
  const caInitials = caName ? caName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : null;
  const assigneeOptions = [
    { value: null, label: "Unassigned", active: !local.assigneeId, icon: <User className="w-3.5 h-3.5 text-muted-foreground" /> },
    ...members.map(m => {
      const name = m.fullName || m.userName || m.email || "?";
      const id = m.accountId || m.id;
      const ini = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return { value: id, label: name, active: id === local.assigneeId,
        icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{ini}</div> };
    }),
  ];

  return (
    <tr className="group hover:bg-muted/40 transition-colors">
      {/* Work */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-cyan-100 dark:bg-cyan-900/30 shrink-0">
            <ChildIcon className={cn("w-3.5 h-3.5", childTypeColor)} />
          </span>
          <span className="text-xs font-mono text-muted-foreground shrink-0">{local.issueKey}</span>
          <span className="text-sm text-foreground truncate">{local.title}</span>
          <button type="button" title="Open detail" onClick={() => onOpenDetail(child)}
            className="ml-auto p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-70 transition-opacity shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>

      {/* Priority */}
      <td className="px-1 py-2 w-24">
        <button type="button" onClick={e => toggle(e, "priority")}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded hover:bg-muted transition-colors">
          <CPI className={cn("w-3.5 h-3.5 shrink-0", cpc)} />
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">{cp?.name || "—"}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
        {openField === "priority" && (
          <ChildIssueDropdown options={priorityOptions} onSelect={val => handleFieldUpdate({ priorityId: val })} onClose={closeField} anchorEl={anchorEl} />
        )}
      </td>

      {/* Assignee */}
      <td className="px-1 py-2 w-28">
        <button type="button" onClick={e => toggle(e, "assignee")}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded hover:bg-muted transition-colors">
          {caInitials
            ? <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{caInitials}</div>
            : <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <span className="text-xs text-foreground hidden sm:inline truncate">
            {caName ? caName.split(" ")[0] : <span className="text-muted-foreground">—</span>}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
        {openField === "assignee" && (
          <ChildIssueDropdown options={assigneeOptions} onSelect={val => handleFieldUpdate({ assigneeId: val })} onClose={closeField} anchorEl={anchorEl} />
        )}
      </td>

      {/* Status */}
      <td className="px-1 py-2 w-32">
        <button type="button" onClick={e => toggle(e, "status")}
          className="flex items-center gap-1 w-full px-1 py-0.5 rounded hover:bg-muted transition-colors">
          {cs
            ? <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusStyle(cs.name)}`}>{cs.name}</span>
            : <span className="text-xs text-muted-foreground px-1">—</span>}
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
        {openField === "status" && (
          <ChildIssueDropdown options={statusOptions} onSelect={val => handleFieldUpdate({ statusId: val })} onClose={closeField} anchorEl={anchorEl} />
        )}
      </td>
    </tr>
  );
}

// ── Collapsible section wrapper ─────────────────────────────────────────────
function Section({ title, collapsed, onToggle, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-blue-500 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {title}
        </button>
        {action}
      </div>
      {!collapsed && children}
    </div>
  );
}

// ── Avatar initials ─────────────────────────────────────────────────────────
function Avatar({ name, size = "sm", color = "bg-blue-500" }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function IssueDetailModal({ open, onClose, issue, onUpdate, onDelete }) {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { issueTypes, issuePriorities, workflowStatuses, members, sprints, refreshIssues } = useProject();

  const [form, setForm] = useState(() => initForm(issue));
  const [saving, setSaving] = useState(false);

  // Comments & activity
  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("comments"); // comments | history
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Subtasks
  const [children, setChildren] = useState([]);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subModalIssue, setSubModalIssue] = useState(null);

  // Collapse state
  const [collapsed, setCollapsed] = useState({ description: false, subtasks: false, activity: false });

  // More actions dropdown
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => { setForm(initForm(issue)); setCollapsed({ description: false, subtasks: false, activity: false }); }, [issue?.id, open]);

  useEffect(() => {
    if (!issue?.id || !open) return;
    loadComments();
    loadActivityLogs();
    loadChildren();
  }, [issue?.id, open]);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isDirty = issue && (
    form.title !== (issue.title || "") ||
    form.description !== (issue.description || "") ||
    form.issueTypeId !== (issue.issueTypeId || "") ||
    form.statusId !== (issue.statusId || "") ||
    form.priorityId !== (issue.priorityId || "") ||
    form.assigneeId !== (issue.assigneeId || "") ||
    form.sprintId !== (issue.sprintId || "") ||
    String(form.storyPoints) !== String(issue.storyPoints ?? "") ||
    form.dueDate !== (issue.dueDate || "")
  );

  const loadComments = async () => {
    try { setLoadingComments(true); const d = await issueService.getComments(projectId, issue.id); setComments(Array.isArray(d) ? d : []); }
    catch (e) { console.error(e); } finally { setLoadingComments(false); }
  };
  const loadActivityLogs = async () => {
    try { setLoadingLogs(true); const d = await issueService.getActivityLogs(projectId, issue.id); setActivityLogs(Array.isArray(d) ? d : []); }
    catch (e) { console.error(e); } finally { setLoadingLogs(false); }
  };
  const loadChildren = async () => {
    try { const d = await issueService.getChildren(projectId, issue.id); setChildren(Array.isArray(d) ? d : []); }
    catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      const patch = {};
      if (form.title !== (issue.title || "")) patch.title = form.title;
      if (form.description !== (issue.description || "")) patch.description = form.description || null;
      if (form.issueTypeId !== (issue.issueTypeId || "")) patch.issueTypeId = form.issueTypeId;
      if (form.statusId !== (issue.statusId || "")) patch.statusId = form.statusId;
      if (form.priorityId !== (issue.priorityId || "")) patch.priorityId = form.priorityId || null;
      if (form.assigneeId !== (issue.assigneeId || "")) patch.assigneeId = form.assigneeId || null;
      if (String(form.storyPoints) !== String(issue.storyPoints ?? "")) {
        patch.storyPoints = form.storyPoints === "" ? null : parseInt(form.storyPoints, 10);
      }
      if (form.dueDate !== (issue.dueDate || "")) patch.dueDate = form.dueDate || null;
      if (Object.keys(patch).length > 0) await issueService.updateIssue(projectId, issue.id, patch);
      if (form.sprintId !== (issue.sprintId || "")) {
        form.sprintId ? await issueService.moveToSprint(projectId, issue.id, form.sprintId)
          : await issueService.removeFromSprint(projectId, issue.id);
      }
      toast.success("Issue updated");
      await refreshIssues(); await loadActivityLogs(); onUpdate?.();
    } catch (e) { toast.error(e?.message || "Error saving"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await issueService.deleteIssue(projectId, issue.id);
      toast.success("Issue deleted");
      await refreshIssues(); onDelete?.(); onClose();
    } catch (e) { toast.error(e?.message || "Error deleting"); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try { await issueService.addComment(projectId, issue.id, { content: newComment.trim() }); setNewComment(""); await loadComments(); }
    catch (e) { toast.error(e?.message || "Error"); }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    try { await issueService.addComment(projectId, issue.id, { content: replyText.trim(), parentCommentId }); setReplyText(""); setReplyingTo(null); await loadComments(); }
    catch (e) { toast.error(e?.message || "Error"); }
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    const subtaskType = issueTypes.find(it => /subtask/i.test(it.name)) || issueTypes[issueTypes.length - 1];
    try {
      await issueService.createIssue(projectId, { title: subtaskTitle.trim(), issueTypeId: subtaskType?.id, parentId: issue.id });
      setSubtaskTitle(""); setAddingSubtask(false); await loadChildren();
    } catch (e) { toast.error(e?.message || "Error creating subtask"); }
  };

  const getAuthorName = (userId) => {
    if (!userId) return null;
    const m = members.find(m => (m.accountId || m.id) === userId);
    return m?.fullName || m?.userName || m?.email || null;
  };

  // Build reply tree for comments tab
  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentCommentId) { acc[c.parentCommentId] = acc[c.parentCommentId] || []; acc[c.parentCommentId].push(c); }
    return acc;
  }, {});

  // Subtask progress
  const doneChildren = children.filter(c => {
    const s = workflowStatuses.find(s => s.id === c.statusId);
    return s && /done|complet|close|resolv/.test(s.name.toLowerCase());
  }).length;
  const progress = children.length ? Math.round((doneChildren / children.length) * 100) : 0;

  if (!issue) return null;

  const currentStatus = workflowStatuses.find(s => s.id === form.statusId);
  const currentType = issueTypes.find(it => it.id === form.issueTypeId);
  const typeName = currentType?.name || "TASK";
  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);
  const priorityObj = issuePriorities.find(p => p.id === form.priorityId);
  const { icon: PriorityIcon, color: prioColor } = getPriorityIcon(priorityObj?.name);
  const sprintObj = sprints.find(s => s.id === form.sprintId);
  const assigneeName = getAuthorName(form.assigneeId);
  const reporterName = getAuthorName(issue.reporterId);

  const selectClass = "w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  // ── Render one comment (with replies) ─────────────────────────────────────
  const renderComment = (comment, isReply = false) => {
    const name = getAuthorName(comment.userId || comment.authorId) || "Unknown";
    const replies = repliesByParent[comment.id] || [];
    return (
      <div key={comment.id} className={isReply ? "pl-8 mt-2" : ""}>
        <div className={`rounded-lg p-3 ${isReply ? "bg-muted/40 border-l-2 border-blue-400" : "bg-muted/60"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Avatar name={name} />
              <span className="text-xs font-semibold text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground" title={comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}>{timeAgo(comment.createdAt)}</span>
            </div>
            {!isReply && (
              <button
                onClick={() => replyingTo === comment.id ? (setReplyingTo(null), setReplyText("")) : (setReplyingTo(comment.id), setReplyText(""))}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />{replyingTo === comment.id ? "Cancel" : "Reply"}
              </button>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
        {replies.length > 0 && <div className="space-y-2 mt-2">{replies.map(r => renderComment(r, true))}</div>}
        {replyingTo === comment.id && (
          <div className="pl-8 mt-2 flex gap-2">
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Reply..." className="flex-1 text-sm"
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleAddReply(comment.id); }} autoFocus />
            <div className="flex flex-col gap-1 self-end">
              <Button size="sm" onClick={() => handleAddReply(comment.id)} disabled={!replyText.trim()}><Send className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Render one activity log entry ─────────────────────────────────────────
  const renderActivity = (log) => {
    const { icon: Icon, color } = getActivityMeta(log.action);
    const initials = log.userName ? log.userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
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
          <p className="text-sm text-foreground">{log.details}</p>
          <p className="text-xs text-muted-foreground mt-0.5" title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}>{timeAgo(log.createdAt)}</p>
        </div>
      </div>
    );
  };

  // ── Sidebar detail field ──────────────────────────────────────────────────
  const DetailField = ({ label, icon: Icon, children: content }) => (
    <div className="grid grid-cols-[120px_1fr] items-start gap-1 py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}{label}
      </div>
      <div>{content}</div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      className="!max-w-5xl !h-[95vh] !max-h-[95vh]"
      contentClassName="overflow-hidden p-0"
      title={
        <div className="flex items-center gap-2">
          <TypeIcon className={`w-4 h-4 ${typeColor}`} />
          <span className="text-xs font-mono text-muted-foreground">{issue.issueKey}</span>
        </div>
      }
      footer={
        <div className="flex justify-between items-center">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saving} className="min-w-[80px]">
              <Save className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="h-full flex">

        {/* ════ LEFT COLUMN ════ */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 border-r border-border">

          {/* Issue header — fixed */}
          <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-border">
            <div className="flex items-start justify-between gap-3 mb-3">
              {/* Editable title */}
              <input
                value={form.title}
                onChange={e => set("title", e.target.value)}
                className="flex-1 text-lg font-semibold bg-transparent text-foreground border-0 border-b-2 border-transparent hover:border-border focus:border-blue-500 focus:outline-none py-0.5 transition-colors leading-snug"
                placeholder="Issue title"
              />
              {/* More actions */}
              <div className="relative shrink-0" ref={moreRef}>
                <button
                  onClick={() => setShowMoreMenu(v => !v)}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      onClick={() => { setShowMoreMenu(false); handleDelete(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete issue
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status + meta pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={form.statusId}
                onChange={e => set("statusId", e.target.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${getStatusStyle(currentStatus?.name)}`}
              >
                {workflowStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 border border-border">
                <TypeIcon className={`w-3 h-3 ${typeColor}`} />{typeName}
              </span>
              {priorityObj && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 border border-border">
                  <PriorityIcon className={`w-3 h-3 ${prioColor}`} />{priorityObj.name}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable main content — left side own scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto">

            {/* ── Description ── */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border">
              <Section
                title="Description"
                collapsed={collapsed.description}
                onToggle={() => setCollapsed(p => ({ ...p, description: !p.description }))}
              >
                <RichTextEditor
                  value={form.description}
                  onChange={v => set("description", v)}
                  placeholder="Add a description..."
                />
              </Section>
            </div>

            {/* ── Child Issues / Subtasks (only if any exist or adding) ── */}
            {(children.length > 0 || addingSubtask) && (
              <div className="flex-shrink-0 px-6 py-4 border-b border-border">
                <Section
                  title={`Child Issues${children.length ? ` (${children.length})` : ""}`}
                  collapsed={collapsed.subtasks}
                  onToggle={() => setCollapsed(p => ({ ...p, subtasks: !p.subtasks }))}
                  action={
                    !addingSubtask && (
                      <button onClick={() => setAddingSubtask(true)}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    )
                  }
                >
                  {/* Progress bar */}
                  {children.length > 0 && (
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
                    </div>
                  )}
                  {/* Subtask table */}
                  <div className="overflow-x-auto mb-2">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-t border-border bg-muted/30">
                          <th className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Work</th>
                          <th className="px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Priority</th>
                          <th className="px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Assignee</th>
                          <th className="px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {children.map(child => (
                          <ChildIssueRow
                            key={child.id}
                            child={child}
                            issueTypes={issueTypes}
                            issuePriorities={issuePriorities}
                            workflowStatuses={workflowStatuses}
                            members={members}
                            projectId={projectId}
                            onOpenDetail={setSubModalIssue}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Inline add subtask form */}
                  {addingSubtask && (
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        value={subtaskTitle}
                        onChange={e => setSubtaskTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAddSubtask(); if (e.key === "Escape") { setAddingSubtask(false); setSubtaskTitle(""); } }}
                        placeholder="Subtask title..."
                        className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleAddSubtask} disabled={!subtaskTitle.trim()}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddingSubtask(false); setSubtaskTitle(""); }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* ── Activity ── */}
            <div className="px-6 py-4">
              <Section
                title="Activity"
                collapsed={collapsed.activity}
                onToggle={() => setCollapsed(p => ({ ...p, activity: !p.activity }))}
                action={
                  !children.length && !addingSubtask && (
                    <button onClick={() => setAddingSubtask(true)}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium">
                      <Plus className="w-3.5 h-3.5" /> Child issue
                    </button>
                  )
                }
              >
                {/* Tabs — Comments / History only */}
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

                {/* Tab content */}
                <div className="space-y-3 pb-3">
                  {(loadingComments || loadingLogs) && <p className="text-sm text-muted-foreground italic">Loading...</p>}

                  {/* COMMENTS tab */}
                  {activeTab === "comments" && !loadingComments && (
                    topLevelComments.length === 0
                      ? <p className="text-sm text-muted-foreground italic">No comments yet</p>
                      : topLevelComments.map(c => renderComment(c))
                  )}

                  {/* HISTORY tab */}
                  {activeTab === "history" && !loadingLogs && (
                    activityLogs.length === 0
                      ? <p className="text-sm text-muted-foreground italic">No history yet</p>
                      : activityLogs.map(log => renderActivity(log))
                  )}
                </div>

                {/* Add comment input */}
                {activeTab === "comments" && (
                  <div className="flex gap-2 border-t border-border pt-3 mt-1">
                    <Textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment... (Ctrl+Enter to send)"
                      rows={2}
                      className="flex-1 text-sm"
                      onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleAddComment(); }}
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()} className="self-end">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div className="w-80 shrink-0 overflow-y-auto overflow-x-hidden">
          <div className="p-5 space-y-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Details</p>

            {/* Assignee */}
            <DetailField label="Assignee" icon={User}>
              <div className="space-y-1.5">
                {assigneeName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={assigneeName} />
                    <span className="text-sm text-foreground">{assigneeName}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-1">Unassigned</p>
                )}
                <select value={form.assigneeId} onChange={e => set("assigneeId", e.target.value)} className={selectClass}>
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.accountId || m.id} value={m.accountId || m.id}>
                      {m.fullName || m.userName || m.email || m.accountId}
                    </option>
                  ))}
                </select>
              </div>
            </DetailField>

            {/* Reporter — only if set */}
            {reporterName && (
              <DetailField label="Reporter" icon={User}>
                <div className="flex items-center gap-2 pt-1">
                  <Avatar name={reporterName} color="bg-green-500" />
                  <span className="text-sm text-foreground">{reporterName}</span>
                </div>
              </DetailField>
            )}

            {/* Priority */}
            <DetailField label="Priority" icon={Flag}>
              <select value={form.priorityId} onChange={e => set("priorityId", e.target.value)} className={selectClass}>
                <option value="">None</option>
                {issuePriorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </DetailField>

            {/* Type */}
            <DetailField label="Type" icon={Layers}>
              <select value={form.issueTypeId} onChange={e => set("issueTypeId", e.target.value)} className={selectClass}>
                {issueTypes.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
            </DetailField>

            {/* Sprint — only if set */}
            {form.sprintId ? (
              <DetailField label="Sprint" icon={Zap}>
                <select value={form.sprintId} onChange={e => set("sprintId", e.target.value)} className={selectClass}>
                  <option value="">Backlog</option>
                  {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </DetailField>
            ) : (
              <DetailField label="Sprint" icon={Zap}>
                <select value={form.sprintId} onChange={e => set("sprintId", e.target.value)} className={selectClass}>
                  <option value="">Backlog</option>
                  {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </DetailField>
            )}

            {/* Story Points — only if set */}
            {(form.storyPoints !== "" && form.storyPoints !== null) || true ? (
              <DetailField label="Story Points" icon={Hash}>
                <input
                  type="number" min={0} value={form.storyPoints}
                  onChange={e => set("storyPoints", e.target.value)}
                  placeholder="—" className={selectClass}
                />
              </DetailField>
            ) : null}

            {/* Due Date — only if set */}
            {form.dueDate ? (
              <DetailField label="Due date" icon={Calendar}>
                <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className={selectClass} />
              </DetailField>
            ) : (
              <DetailField label="Due date" icon={Calendar}>
                <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className={selectClass} />
              </DetailField>
            )}

            {/* Created / Updated */}
            {issue.createdAt && (
              <DetailField label="Created" icon={CalendarDays}>
                <p className="text-sm text-foreground pt-1">{new Date(issue.createdAt).toLocaleDateString()}</p>
              </DetailField>
            )}
            {issue.updatedAt && (
              <DetailField label="Updated" icon={CalendarDays}>
                <p className="text-sm text-foreground pt-1">{new Date(issue.updatedAt).toLocaleDateString()}</p>
              </DetailField>
            )}
          </div>
        </div>

      </div>
    </Modal>

    {/* Nested modal for subtask detail */}
    {subModalIssue && (
      <IssueDetailModal
        open={!!subModalIssue}
        onClose={() => setSubModalIssue(null)}
        issue={subModalIssue}
        onUpdate={() => { loadChildren(); setSubModalIssue(null); }}
        onDelete={() => { loadChildren(); setSubModalIssue(null); }}
      />
    )}
  </>
  );
}
