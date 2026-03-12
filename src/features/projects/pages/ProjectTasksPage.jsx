import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/select";
import Tasks from "@/features/projects/components/Tasks";
import { useProject } from "@/features/projects/context/ProjectContext";
import { translatePriority, translateStatus } from "@/lib/i18n";

export default function ProjectTasksPage() {
    const { t } = useTranslation();
    
    // Get tasks and phases from context instead of loading
    const { tasks, tasksLoading, phases, refreshTasks } = useProject();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        status: "",
        assignee: "",
        priority: "",
        phase: "",
    });
    const [sortBy, setSortBy] = useState("title");
    const [sortOrder, setSortOrder] = useState("asc");

    // Get unique values for filters
    const statuses = [...new Set(tasks.map(t => translateStatus(t.status)).filter(Boolean))];
    const assignees = [...new Set(tasks.map(t => t.assignedTo?.fullName || t.assignedTo?.email || "").filter(Boolean))];
    const priorities = [...new Set(tasks.map(t => translatePriority(t.priority)).filter(Boolean))];

    // Create a map of phase IDs to phase names for display
    const phaseMap = phases.reduce((acc, phase) => {
        acc[phase.id] = phase.name;
        return acc;
    }, {});

    // Filter and sort tasks
    const filteredAndSortedTasks = React.useMemo(() => {
        let result = [...tasks];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(task =>
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (filters.status) {
            result = result.filter(task => translateStatus(task.status) === filters.status);
        }

        // Assignee filter
        if (filters.assignee) {
            result = result.filter(task =>
                task.assignedTo?.fullName === filters.assignee ||
                task.assignedTo?.email === filters.assignee
            );
        }

        // Priority filter
        if (filters.priority) {
            result = result.filter(task => translatePriority(task.priority) === filters.priority);
        }

        // Phase filter
        if (filters.phase) {
            result = result.filter(task => task.phaseId === filters.phase);
        }

        // Sort
        result.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case "title":
                    aVal = a.title || "";
                    bVal = b.title || "";
                    break;
                case "status":
                    aVal = translateStatus(a.status) || "";
                    bVal = translateStatus(b.status) || "";
                    break;
                case "priority":
                    aVal = translatePriority(a.priority) || "";
                    bVal = translatePriority(b.priority) || "";
                    break;
                case "dueDate":
                    aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    break;
                default:
                    aVal = a.title || "";
                    bVal = b.title || "";
            }

            if (typeof aVal === "string") {
                return sortOrder === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            }
        });

        return result;
    }, [tasks, searchQuery, filters, sortBy, sortOrder]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setSearchQuery("");
        setFilters({ status: "", assignee: "", priority: "", phase: "" });
        setSortBy("title");
        setSortOrder("asc");
    };

    const hasActiveFilters = filters.status || filters.assignee || filters.priority || filters.phase || searchQuery;

    return (
        <div className="space-y-6">
            {/* Compact Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('projects.detail.tasks.search')}
                    className="flex-1 min-w-[200px] border-border bg-background text-foreground"
                />
                <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-auto min-w-[130px] border-border bg-background text-foreground"
                >
                    <option value="">{t('projects.detail.tasks.filters.status')}</option>
                    {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </Select>
                <Select
                    value={filters.assignee}
                    onChange={(e) => handleFilterChange("assignee", e.target.value)}
                    className="w-auto min-w-[150px] border-border bg-background text-foreground"
                >
                    <option value="">{t('projects.detail.tasks.filters.assignee')}</option>
                    {assignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                </Select>
                <Select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                    className="w-auto min-w-[120px] border-border bg-background text-foreground"
                >
                    <option value="">{t('projects.detail.tasks.filters.priority')}</option>
                    {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                    ))}
                </Select>
                <Select
                    value={filters.phase}
                    onChange={(e) => handleFilterChange("phase", e.target.value)}
                    className="w-auto min-w-[130px] border-border bg-background text-foreground"
                >
                    <option value="">{t('projects.detail.tasks.filters.phase')}</option>
                    {phases.map(phase => (
                        <option key={phase.id} value={phase.id}>{phase.name}</option>
                    ))}
                </Select>
                <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-auto min-w-[140px] border-border bg-background text-foreground"
                >
                    <option value="title">{t('projects.detail.tasks.sort.label')}: {t('projects.detail.tasks.sort.title')}</option>
                    <option value="status">{t('projects.detail.tasks.sort.label')}: {t('projects.detail.tasks.sort.status')}</option>
                    <option value="priority">{t('projects.detail.tasks.sort.label')}: {t('projects.detail.tasks.sort.priority')}</option>
                    <option value="dueDate">{t('projects.detail.tasks.sort.label')}: {t('projects.detail.tasks.sort.dueDate')}</option>
                </Select>
                <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-auto min-w-[100px] border-border bg-background text-foreground"
                >
                    <option value="asc">↑ {t('projects.detail.tasks.sort.ascending')}</option>
                    <option value="desc">↓ {t('projects.detail.tasks.sort.descending')}</option>
                </Select>
                {hasActiveFilters && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={clearFilters}
                    >
                        {t('projects.detail.tasks.actions.clearFilters')}
                    </Button>
                )}
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredAndSortedTasks.length} / {tasks.length}
                </div>
            </div>

            {/* Tasks Table */}
            <Tasks
                tasks={filteredAndSortedTasks}
                tasksLoading={tasksLoading}
                onTasksChange={refreshTasks}
            />
        </div>
    );
}

