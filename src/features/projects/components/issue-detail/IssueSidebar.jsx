import React, { useMemo, useRef, useState } from "react";
import { User, Flag, Layers, Zap, Hash, Calendar, CalendarDays, Tag } from "lucide-react";
import FibonacciStoryPointInput from "../FibonacciStoryPointInput";
import { todayStr } from "@/features/projects/utils/dateValidation";
import Avatar from "@/components/ui/Avatar";
import InlineDropdown from "../inline-editors/InlineDropdown";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";
import LabelBadge from "./LabelBadge";
import LabelSelector from "./LabelSelector";
import { cn } from "@/lib/utils";

function DetailField({ label, icon: Icon, children: content }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-1 py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}{label}
      </div>
      <div>{content}</div>
    </div>
  );
}

export default function IssueSidebar({
  form,
  onChangeField,
  issue,
  onUpdate,
  members,
  issuePriorities,
  issueTypes,
  sprints,
  assigneeName,
  reporterName
}) {
  // Unify props: if onUpdate is provided (Page), we use issue as form and onUpdate as change handler
  const isPagePattern = !!onUpdate;
  const currentForm = isPagePattern ? issue : form;
  const handleChange = isPagePattern ? (field, value) => onUpdate({ [field]: value }) : onChangeField;

  if (!currentForm) return null;

  const selectClass = "w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  const [openField, setOpenField] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const assigneeBtnRef = useRef(null);
  const priorityBtnRef = useRef(null);
  const typeBtnRef = useRef(null);

  const resolveMemberId = (member) =>
    member?.accountId ||
    member?.userId ||
    member?.user?.accountId ||
    member?.user?.id ||
    member?.id;

  const selectedAssignee = useMemo(
    () => members.find((m) => String(resolveMemberId(m) || "") === String(currentForm.assigneeId || "")),
    [members, currentForm.assigneeId]
  );

  const assigneeOptions = useMemo(() => {
    const options = [
      {
        value: "",
        label: "Unassigned",
        active: !currentForm.assigneeId,
        icon: <User className="w-3.5 h-3.5 text-muted-foreground" />,
      },
      ...members
        .map((m) => {
          const id = resolveMemberId(m);
          if (!id) return null;
          const name = m.fullName || m.userName || m.name || m.email || String(id);
          return {
            value: id,
            label: name,
            active: String(id) === String(currentForm.assigneeId || ""),
            icon: <Avatar user={m} name={name} size="xs" />,
          };
        })
        .filter(Boolean),
    ];

    if (currentForm.assigneeId && !members.some((m) => String(resolveMemberId(m) || "") === String(currentForm.assigneeId))) {
      options.push({
        value: currentForm.assigneeId,
        label: assigneeName || String(currentForm.assigneeId),
        active: true,
        icon: <Avatar user={issue?.assignee} name={assigneeName || String(currentForm.assigneeId)} size="xs" />,
      });
    }

    return options;
  }, [members, currentForm.assigneeId, assigneeName, issue?.assignee]);

  const selectedAssigneeName =
    !currentForm.assigneeId
      ? ""
      : (
        selectedAssignee?.fullName ||
        selectedAssignee?.userName ||
        selectedAssignee?.name ||
        selectedAssignee?.email ||
        assigneeName ||
        ""
      );

  const currentPriority = issuePriorities.find((p) => String(p.id) === String(currentForm.priorityId || ""));
  const currentType = issueTypes.find((it) => String(it.id) === String(currentForm.issueTypeId || ""));
  const { icon: CurrentPriorityIcon, color: currentPriorityColor } = getPriorityIcon(currentPriority?.name);
  const CurrentTypeIcon = getIssueTypeIcon(currentType?.name);
  const currentTypeColor = getIssueTypeColor(currentType?.name);

  const priorityOptions = useMemo(() => {
    return [
      {
        value: "",
        label: "None",
        active: !currentForm.priorityId,
        icon: <Flag className="w-3.5 h-3.5 text-muted-foreground" />,
      },
      ...issuePriorities.map((p) => {
        const { icon: Icon, color } = getPriorityIcon(p.name);
        return {
          value: p.id,
          label: p.name,
          active: String(p.id) === String(currentForm.priorityId || ""),
          icon: <Icon className={cn("w-3.5 h-3.5", color)} />,
        };
      }),
    ];
  }, [issuePriorities, currentForm.priorityId]);

  const typeOptions = useMemo(() => {
    return issueTypes.map((it) => {
      const TypeIcon = getIssueTypeIcon(it?.name);
      const typeColor = getIssueTypeColor(it?.name);
      return {
        value: it.id,
        label: it.name,
        active: String(it.id) === String(currentForm.issueTypeId || ""),
        icon: <TypeIcon className={cn("w-3.5 h-3.5", typeColor)} />,
      };
    });
  }, [issueTypes, currentForm.issueTypeId]);

  return (
    <div className="p-5 space-y-0">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Details</p>

      {/* Assignee */}
      <DetailField label="Assignee" icon={User}>
        <div className="space-y-1.5">
          <button
            type="button"
            ref={assigneeBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              if (openField === "assignee") {
                setOpenField(null);
                setAnchorEl(null);
                return;
              }
              setOpenField("assignee");
              setAnchorEl(e.currentTarget);
            }}
            className="w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center gap-2"
          >
            {selectedAssigneeName ? (
              <>
                <Avatar user={selectedAssignee || issue?.assignee} name={selectedAssigneeName} size="xs" />
                <span className="truncate">{selectedAssigneeName}</span>
              </>
            ) : (
              <>
                <Avatar name="Unassigned" size="xs" className="bg-muted text-muted-foreground" />
                <span className="text-muted-foreground">Unassigned</span>
              </>
            )}
          </button>
          {openField === "assignee" && (
            <InlineDropdown
              options={assigneeOptions}
              onSelect={(value) => {
                handleChange("assigneeId", value || "");
                setOpenField(null);
                setAnchorEl(null);
              }}
              onClose={() => {
                setOpenField(null);
                setAnchorEl(null);
              }}
              anchorEl={anchorEl || assigneeBtnRef.current}
            />
          )}
        </div>
      </DetailField>

      {/* Reporter */}
      {reporterName && (
        <DetailField label="Reporter" icon={User}>
          <div className="flex items-center gap-2 pt-1">
            <Avatar user={issue?.reporter} name={reporterName} size="xs" />
            <span className="text-sm text-foreground">{reporterName}</span>
          </div>
        </DetailField>
      )}

      {/* Priority */}
      <DetailField label="Priority" icon={Flag}>
        <>
          <button
            type="button"
            ref={priorityBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              if (openField === "priority") {
                setOpenField(null);
                setAnchorEl(null);
                return;
              }
              setOpenField("priority");
              setAnchorEl(e.currentTarget);
            }}
            className="w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center gap-2"
          >
            {currentPriority ? (
              <>
                <CurrentPriorityIcon className={cn("w-3.5 h-3.5", currentPriorityColor)} />
                <span className="truncate">{currentPriority.name}</span>
              </>
            ) : (
              <>
                <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">None</span>
              </>
            )}
          </button>
          {openField === "priority" && (
            <InlineDropdown
              options={priorityOptions}
              onSelect={(value) => {
                handleChange("priorityId", value || "");
                setOpenField(null);
                setAnchorEl(null);
              }}
              onClose={() => {
                setOpenField(null);
                setAnchorEl(null);
              }}
              anchorEl={anchorEl || priorityBtnRef.current}
            />
          )}
        </>
      </DetailField>

      {/* Labels */}
      <DetailField label="Labels" icon={Tag}>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentForm.labels && currentForm.labels.map(l => (
            <LabelBadge 
              key={l.id} 
              label={l} 
              onRemove={(id) => {
                const newLabels = currentForm.labels.filter(lbl => lbl.id !== id);
                handleChange("labels", newLabels);
                handleChange("labelIds", newLabels.map(lbl => lbl.id));
              }} 
            />
          ))}
          <LabelSelector 
            projectId={issue?.projectId} 
            selectedLabels={currentForm.labels || []} 
            onChange={(newLabels) => {
              handleChange("labels", newLabels);
              handleChange("labelIds", newLabels.map(lbl => lbl.id));
            }} 
          />
        </div>
      </DetailField>

      {/* Type */}
      <DetailField label="Type" icon={Layers}>
        <>
          <button
            type="button"
            ref={typeBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              if (openField === "type") {
                setOpenField(null);
                setAnchorEl(null);
                return;
              }
              setOpenField("type");
              setAnchorEl(e.currentTarget);
            }}
            className="w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center gap-2"
          >
            {currentType ? (
              <>
                <CurrentTypeIcon className={cn("w-3.5 h-3.5", currentTypeColor)} />
                <span className="truncate">{currentType.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select type</span>
            )}
          </button>
          {openField === "type" && (
            <InlineDropdown
              options={typeOptions}
              onSelect={(value) => {
                handleChange("issueTypeId", value || "");
                setOpenField(null);
                setAnchorEl(null);
              }}
              onClose={() => {
                setOpenField(null);
                setAnchorEl(null);
              }}
              anchorEl={anchorEl || typeBtnRef.current}
            />
          )}
        </>
      </DetailField>

      {/* Sprint */}
      <DetailField label="Sprint" icon={Zap}>
        <select value={currentForm.sprintId || ""} onChange={e => handleChange("sprintId", e.target.value)} className={selectClass}>
          <option value="">Backlog</option>
          {sprints
            .filter(s => s.status === "PLANNED" || s.status === "ACTIVE" || s.id === currentForm.sprintId)
            .map(s => (
              <option
                key={s.id}
                value={s.id}
                disabled={s.status === "COMPLETED" || s.status === "CANCELLED"}
              >
                {s.name}
              </option>
            ))}
        </select>
      </DetailField>

      {/* Story Points */}
      <DetailField label="Story Points" icon={Hash}>
        <FibonacciStoryPointInput
          value={currentForm.storyPoints}
          onChange={v => handleChange("storyPoints", v)}
          placeholder="—"
          className={selectClass}
        />
      </DetailField>

      {/* Due Date */}
      <DetailField label="Due date" icon={Calendar}>
        <input
          type="date"
          min={todayStr()}
          value={currentForm.dueDate || ""}
          onChange={e => handleChange("dueDate", e.target.value)}
          className={selectClass}
        />
      </DetailField>

      {/* Created / Updated */}
      {issue?.createdAt && (
        <DetailField label="Created" icon={CalendarDays}>
          <p className="text-sm text-foreground pt-1">{new Date(issue.createdAt).toLocaleDateString()}</p>
        </DetailField>
      )}
      {issue?.updatedAt && (
        <DetailField label="Updated" icon={CalendarDays}>
          <p className="text-sm text-foreground pt-1">{new Date(issue.updatedAt).toLocaleDateString()}</p>
        </DetailField>
      )}
    </div>
  );
}
