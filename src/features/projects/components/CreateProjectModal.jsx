import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { projectService } from "@/features/projects/api/projectService";
import { workflowService } from "@/features/projects/api/workflowService";
import { toast } from "sonner";
import { validateDates, todayStr } from "@/features/projects/utils/dateValidation";

const STEP_TITLES = ["Basic Information", "Workflow", "Priority", "Issue Types"];

const ISSUE_TYPE_ICONS = [
    "🐛", "✨", "📋", "🔥", "🔧", "📝", "🚀", "💡",
    "⚠️", "🎯", "🔍", "💬", "🧪", "🔒", "🎨", "📊",
    "⭐", "❌", "📦", "🏷️", "🔗", "📌", "🛠️", "🌟",
];

const INITIAL_BASIC_INFO = {
    name: "",
    projectKey: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "PLANNING",
};

// item._removed = true  → DELETE  (only if item.id exists)
// item.id exists        → PATCH
// no item.id            → POST (new item added by user)

export default function CreateProjectModal({ open, onClose, onCreated }) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [createdProjectId, setCreatedProjectId] = useState(null);
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

    const [basicInfo, setBasicInfo] = useState({ ...INITIAL_BASIC_INFO });

    // workflowData.id = existing workflow id from backend (null if none)
    const [workflowData, setWorkflowData] = useState({ id: null, name: "", statuses: [] });

    // each priority may have { id, name, color, level, _removed }
    const [priorities, setPriorities] = useState([]);

    // each issue type may have { id, name, description, iconUrl, _removed }
    const [issueTypes, setIssueTypes] = useState([]);
    const [activeIconPicker, setActiveIconPicker] = useState(null); // index of open picker

    const handleClose = () => {
        setStep(0);
        setCreatedProjectId(null);
        setKeyManuallyEdited(false);
        setBasicInfo({ ...INITIAL_BASIC_INFO });
        setWorkflowData({ id: null, name: "", statuses: [] });
        setPriorities([]);
        setIssueTypes([]);
        setActiveIconPicker(null);
        onClose();
    };

    const handleNameChange = (value) => {
        const autoKey = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
        setBasicInfo(prev => ({
            ...prev,
            name: value,
            projectKey: keyManuallyEdited ? prev.projectKey : autoKey,
        }));
    };

    const handleKeyChange = (value) => {
        setKeyManuallyEdited(true);
        setBasicInfo(prev => ({
            ...prev,
            projectKey: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
        }));
    };

    // ── Step 1: create project, then load backend defaults ────────
    const handleStep1Next = async () => {
        if (!basicInfo.name.trim()) { toast.warning("Project name is required"); return; }
        if (!basicInfo.projectKey.trim()) { toast.warning("Project key is required"); return; }
        if (!basicInfo.startDate) { toast.warning("Start date is required"); return; }
        const dateError = validateDates({ startDate: basicInfo.startDate, endDate: basicInfo.endDate });
        if (dateError) { toast.warning(dateError); return; }

        setLoading(true);
        try {
            const projectData = {
                ...basicInfo,
                startDate: new Date(basicInfo.startDate).toISOString(),
                endDate: basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : null,
            };
            const created = await projectService.createProject(projectData);
            const projectId = created.id;
            setCreatedProjectId(projectId);

            // Load backend-seeded defaults in parallel
            const [workflows, priorList, issueTypeList] = await Promise.all([
                workflowService.getWorkflows(projectId),
                projectService.getIssuePriorities(projectId),
                projectService.getIssueTypes(projectId),
            ]);

            // Populate workflow step with existing data
            if (workflows.length > 0) {
                const wf = workflows[0];
                const statuses = await workflowService.getStatuses(projectId, wf.id);
                setWorkflowData({
                    id: wf.id,
                    name: wf.name || "Default Workflow",
                    statuses: statuses.map(s => ({ id: s.id, name: s.name, color: s.color || "#6B7280" })),
                });
            } else {
                setWorkflowData({ id: null, name: "Default Workflow", statuses: [] });
            }

            // Populate priority step with existing data
            if (priorList.length > 0) {
                setPriorities(priorList.map((p, i) => ({
                    id: p.id,
                    name: p.name,
                    color: p.color || "#6B7280",
                    level: p.level ?? i + 1,
                })));
            } else {
                setPriorities([]);
            }

            // Populate issue types step with existing data
            if (issueTypeList.length > 0) {
                setIssueTypes(issueTypeList.map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description || "",
                    iconUrl: t.iconUrl || "",
                })));
            } else {
                setIssueTypes([]);
            }

            setStep(1);
        } catch (error) {
            toast.error(error?.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: reconcile workflow changes ────────────────────────
    const handleStep2Next = async () => {
        setLoading(true);
        try {
            if (workflowData.id) {
                // Update workflow name
                await workflowService.updateWorkflow(createdProjectId, workflowData.id, {
                    name: workflowData.name,
                });
                for (const status of workflowData.statuses) {
                    if (status._removed && status.id) {
                        await workflowService.deleteStatus(createdProjectId, workflowData.id, status.id);
                    } else if (status.id && !status._removed) {
                        await workflowService.updateStatus(createdProjectId, workflowData.id, status.id, {
                            name: status.name,
                            color: status.color,
                        });
                    } else if (!status.id && !status._removed && status.name.trim()) {
                        await workflowService.createStatus(createdProjectId, workflowData.id, {
                            name: status.name,
                            color: status.color,
                        });
                    }
                }
            } else if (workflowData.name.trim()) {
                // No backend workflow was seeded — create from scratch
                const wf = await workflowService.createWorkflow(createdProjectId, { name: workflowData.name });
                for (const status of workflowData.statuses) {
                    if (!status._removed && status.name.trim()) {
                        await workflowService.createStatus(createdProjectId, wf.id, {
                            name: status.name,
                            color: status.color,
                        });
                    }
                }
            }
            setStep(2);
        } catch (error) {
            toast.error(error?.message || "Failed to save workflow");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: reconcile priority changes ────────────────────────
    const handleStep3Next = async () => {
        setLoading(true);
        try {
            let levelCounter = 1;
            for (const priority of priorities) {
                if (priority._removed && priority.id) {
                    await projectService.deleteIssuePriority(createdProjectId, priority.id);
                } else if (priority.id && !priority._removed) {
                    await projectService.updateIssuePriority(createdProjectId, priority.id, {
                        name: priority.name,
                        color: priority.color,
                        level: levelCounter++,
                    });
                } else if (!priority.id && !priority._removed && priority.name.trim()) {
                    await projectService.createIssuePriority(createdProjectId, {
                        name: priority.name,
                        color: priority.color,
                        level: levelCounter++,
                    });
                }
            }
            setStep(3);
        } catch (error) {
            toast.error(error?.message || "Failed to save priorities");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 4: reconcile issue type changes ──────────────────────
    const handleStep4Finish = async () => {
        setLoading(true);
        try {
            for (const issueType of issueTypes) {
                if (issueType._removed && issueType.id) {
                    await projectService.deleteIssueType(createdProjectId, issueType.id);
                } else if (issueType.id && !issueType._removed) {
                    await projectService.updateIssueType(createdProjectId, issueType.id, {
                        name: issueType.name,
                        description: issueType.description,
                        iconUrl: issueType.iconUrl || null,
                    });
                } else if (!issueType.id && !issueType._removed && issueType.name.trim()) {
                    await projectService.createIssueType(createdProjectId, {
                        name: issueType.name,
                        description: issueType.description,
                        iconUrl: issueType.iconUrl || null,
                    });
                }
            }
            toast.success("Project created successfully");
            onCreated?.();
            handleClose();
        } catch (error) {
            toast.error(error?.message || "Failed to save issue types");
        } finally {
            setLoading(false);
        }
    };

    const handleSkipToFinish = () => {
        toast.success("Project created successfully");
        onCreated?.();
        handleClose();
    };

    // ── Workflow helpers ──────────────────────────────────────────
    const addStatus = () =>
        setWorkflowData(prev => ({ ...prev, statuses: [...prev.statuses, { name: "", color: "#6B7280" }] }));

    const removeStatus = (index) =>
        setWorkflowData(prev => {
            const updated = [...prev.statuses];
            if (updated[index].id) {
                updated[index] = { ...updated[index], _removed: true };
            } else {
                updated.splice(index, 1);
            }
            return { ...prev, statuses: updated };
        });

    const updateStatus = (index, field, value) =>
        setWorkflowData(prev => {
            const updated = [...prev.statuses];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, statuses: updated };
        });

    // ── Priority helpers ──────────────────────────────────────────
    const addPriority = () =>
        setPriorities(prev => [...prev, { name: "", color: "#6B7280" }]);

    const removePriority = (index) =>
        setPriorities(prev => {
            const updated = [...prev];
            if (updated[index].id) {
                updated[index] = { ...updated[index], _removed: true };
            } else {
                updated.splice(index, 1);
            }
            return updated;
        });

    const updatePriority = (index, field, value) =>
        setPriorities(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });

    // ── Issue type helpers ────────────────────────────────────────
    const addIssueType = () =>
        setIssueTypes(prev => [...prev, { name: "", description: "", iconUrl: "" }]);

    const removeIssueType = (index) =>
        setIssueTypes(prev => {
            const updated = [...prev];
            if (updated[index].id) {
                updated[index] = { ...updated[index], _removed: true };
            } else {
                updated.splice(index, 1);
            }
            return updated;
        });

    const updateIssueType = (index, field, value) =>
        setIssueTypes(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });

    // ── Step indicator ────────────────────────────────────────────
    const stepIndicator = (
        <div className="flex items-center gap-0 mt-2">
            {STEP_TITLES.map((title, i) => (
                <React.Fragment key={i}>
                    <div className={`flex items-center gap-1.5 text-xs ${i <= step ? "text-blue-500" : "text-muted-foreground"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < step ? "bg-blue-500 text-white" : i === step ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                            }`}>
                            {i < step ? "✓" : i + 1}
                        </div>
                        <span className={`font-medium whitespace-nowrap ${i === step ? "text-blue-500" : ""}`}>{title}</span>
                    </div>
                    {i < STEP_TITLES.length - 1 && (
                        <div className={`flex-1 h-px mx-2 min-w-[16px] ${i < step ? "bg-blue-500" : "bg-border"}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    // ── Footer ────────────────────────────────────────────────────
    const footer = (
        <div className="flex justify-end gap-2">
            {step === 0 ? (
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleStep1Next} disabled={loading}>
                        {loading ? "Creating…" : "Next →"}
                    </Button>
                </>
            ) : step === 1 ? (
                <>
                    <Button variant="secondary" onClick={() => setStep(2)} disabled={loading}>Skip</Button>
                    <Button onClick={handleStep2Next} disabled={loading}>
                        {loading ? "Saving…" : "Next →"}
                    </Button>
                </>
            ) : step === 2 ? (
                <>
                    <Button variant="secondary" onClick={() => setStep(3)} disabled={loading}>Skip</Button>
                    <Button onClick={handleStep3Next} disabled={loading}>
                        {loading ? "Saving…" : "Next →"}
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="secondary" onClick={handleSkipToFinish} disabled={loading}>Skip</Button>
                    <Button onClick={handleStep4Finish} disabled={loading}>
                        {loading ? "Saving…" : "Finish"}
                    </Button>
                </>
            )}
        </div>
    );

    const inputCls = "w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30";
    const labelCls = "block text-sm font-medium text-foreground mb-1";

    // visible = not _removed
    const visibleStatuses = workflowData.statuses.filter(s => !s._removed);
    const visiblePriorities = priorities.filter(p => !p._removed);
    const visibleIssueTypes = issueTypes.filter(t => !t._removed);

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={<div><span>Create New Project</span>{stepIndicator}</div>}
            footer={footer}
        >
            {/* ── Step 1: Basic Information ── */}
            {step === 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Project Name *</label>
                        <Input value={basicInfo.name} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="My Awesome Project" />
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelCls}>Project Key *</label>
                        <Input value={basicInfo.projectKey} onChange={e => handleKeyChange(e.target.value)} className={inputCls} placeholder="MAP" maxLength={10} />
                        <p className="text-xs text-muted-foreground mt-1">Unique identifier (max 10 chars, letters &amp; numbers only)</p>
                    </div>

                    <div>
                        <label className={labelCls}>Start Date *</label>
                        <Input type="date" min={todayStr()} value={basicInfo.startDate} onChange={e => setBasicInfo(prev => ({ ...prev, startDate: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>End Date</label>
                        <Input type="date" min={basicInfo.startDate || todayStr()} value={basicInfo.endDate} onChange={e => setBasicInfo(prev => ({ ...prev, endDate: e.target.value }))} className={inputCls} />
                    </div>

                    <div>
                        <label className={labelCls}>Status</label>
                        <select value={basicInfo.status} onChange={e => setBasicInfo(prev => ({ ...prev, status: e.target.value }))} className={inputCls}>
                            <option value="PLANNING">Planning</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelCls}>Description</label>
                        <Textarea value={basicInfo.description} onChange={e => setBasicInfo(prev => ({ ...prev, description: e.target.value }))} rows={3} className={inputCls} placeholder="Describe your project…" />
                    </div>
                </div>
            )}

            {/* ── Step 2: Workflow ── */}
            {step === 1 && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Review and customize the default workflow. You can change this later in project settings.
                    </p>

                    <div>
                        <label className={labelCls}>Workflow Name</label>
                        <Input value={workflowData.name} onChange={e => setWorkflowData(prev => ({ ...prev, name: e.target.value }))} className={inputCls} placeholder="Default Workflow" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelCls + " mb-0"}>Statuses</label>
                            <button onClick={addStatus} className="text-xs text-blue-500 hover:text-blue-600 font-medium">+ Add Status</button>
                        </div>
                        <div className="space-y-2">
                            {visibleStatuses.map((status, visibleIdx) => {
                                const realIdx = workflowData.statuses.indexOf(status);
                                return (
                                    <div key={status.id ?? visibleIdx} className="flex items-center gap-2">
                                        <input type="color" value={status.color} onChange={e => updateStatus(realIdx, "color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                                        <Input value={status.name} onChange={e => updateStatus(realIdx, "name", e.target.value)} className={inputCls + " flex-1"} placeholder="Status name" />
                                        <button onClick={() => removeStatus(realIdx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1">✕</button>
                                    </div>
                                );
                            })}
                            {visibleStatuses.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
                                    No statuses. Click "+ Add Status" to add one.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 3: Priority ── */}
            {step === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Review and customize priority levels. Higher level number = lower priority.
                    </p>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelCls + " mb-0"}>Priorities</label>
                            <button onClick={addPriority} className="text-xs text-blue-500 hover:text-blue-600 font-medium">+ Add Priority</button>
                        </div>
                        <div className="space-y-2">
                            {visiblePriorities.map((priority, visibleIdx) => {
                                const realIdx = priorities.indexOf(priority);
                                return (
                                    <div key={priority.id ?? visibleIdx} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{visibleIdx + 1}</span>
                                        <input type="color" value={priority.color} onChange={e => updatePriority(realIdx, "color", e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                                        <Input value={priority.name} onChange={e => updatePriority(realIdx, "name", e.target.value)} className={inputCls + " flex-1"} placeholder="Priority name" />
                                        <button onClick={() => removePriority(realIdx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1">✕</button>
                                    </div>
                                );
                            })}
                            {visiblePriorities.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
                                    No priorities. Click "+ Add Priority" to add one.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 4: Issue Types ── */}
            {step === 3 && (
                <div className="space-y-4">
                    {activeIconPicker !== null && (
                        <div className="fixed inset-0 z-40" onClick={() => setActiveIconPicker(null)} />
                    )}
                    <p className="text-sm text-muted-foreground">
                        Choose which issue types your project will use. You can add, remove, or rename them later in settings.
                    </p>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelCls + " mb-0"}>Issue Types</label>
                            <button onClick={addIssueType} className="text-xs text-blue-500 hover:text-blue-600 font-medium">+ Add Issue Type</button>
                        </div>
                        <div className="space-y-2">
                            {visibleIssueTypes.map((issueType, visibleIdx) => {
                                const realIdx = issueTypes.indexOf(issueType);
                                const pickerOpen = activeIconPicker === realIdx;
                                return (
                                    <div key={issueType.id ?? visibleIdx} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            {/* Icon picker button */}
                                            <div className="relative shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveIconPicker(pickerOpen ? null : realIdx)}
                                                    className="w-9 h-9 rounded border border-border bg-muted flex items-center justify-center text-lg hover:bg-accent transition-colors"
                                                    title="Pick an icon"
                                                >
                                                    {issueType.iconUrl || "＋"}
                                                </button>
                                                {pickerOpen && (
                                                    <div className="absolute z-50 top-10 left-0 bg-popover border border-border rounded-lg shadow-lg p-2 w-52">
                                                        <div className="grid grid-cols-8 gap-1">
                                                            {ISSUE_TYPE_ICONS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        updateIssueType(realIdx, "iconUrl", emoji);
                                                                        setActiveIconPicker(null);
                                                                    }}
                                                                    className={`w-6 h-6 flex items-center justify-center rounded text-base hover:bg-accent transition-colors ${issueType.iconUrl === emoji ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {issueType.iconUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    updateIssueType(realIdx, "iconUrl", "");
                                                                    setActiveIconPicker(null);
                                                                }}
                                                                className="mt-1 w-full text-xs text-muted-foreground hover:text-destructive text-center"
                                                            >
                                                                Remove icon
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Input
                                                value={issueType.name}
                                                onChange={e => updateIssueType(realIdx, "name", e.target.value)}
                                                className={inputCls + " flex-1"}
                                                placeholder="Issue type name (e.g. BUG)"
                                            />
                                            <Input
                                                value={issueType.description}
                                                onChange={e => updateIssueType(realIdx, "description", e.target.value)}
                                                className={inputCls + " flex-1"}
                                                placeholder="Description (optional)"
                                            />
                                            <button onClick={() => removeIssueType(realIdx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1">✕</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {visibleIssueTypes.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
                                    No issue types. Click "+ Add Issue Type" to add one.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
