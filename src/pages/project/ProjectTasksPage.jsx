import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/select";
import Tasks from "../../components/project/Tasks";
import { taskService } from "../../services/taskService";
import { translatePriority, translateStatus } from "../../lib/i18n";

export default function ProjectTasksPage() {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        status: "",
        assignee: "",
        priority: "",
    });
    const [sortBy, setSortBy] = useState("title");
    const [sortOrder, setSortOrder] = useState("asc");

    useEffect(() => {
        const load = async () => {
            try {
                setTasksLoading(true);
                const data = await taskService.getTasksByProject(projectId);
                setTasks(Array.isArray(data) ? data : []);
            } catch (_e) {
                setTasks([]);
            } finally {
                setTasksLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId]);

    // Get unique values for filters
    const statuses = [...new Set(tasks.map(t => translateStatus(t.status)).filter(Boolean))];
    const assignees = [...new Set(tasks.map(t => t.assignedTo?.fullName || t.assignedTo?.email || "").filter(Boolean))];
    const priorities = [...new Set(tasks.map(t => translatePriority(t.priority)).filter(Boolean))];

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
        setFilters({ status: "", assignee: "", priority: "" });
        setSortBy("title");
        setSortOrder("asc");
    };

    const hasActiveFilters = filters.status || filters.assignee || filters.priority || searchQuery;

    return (
        <div className="space-y-6">
            {/* Compact Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="flex-1 min-w-[200px]"
                />
                <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-auto min-w-[130px]"
                >
                    <option value="">Trạng thái</option>
                    {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </Select>
                <Select
                    value={filters.assignee}
                    onChange={(e) => handleFilterChange("assignee", e.target.value)}
                    className="w-auto min-w-[150px]"
                >
                    <option value="">Người phụ trách</option>
                    {assignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                </Select>
                <Select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                    className="w-auto min-w-[120px]"
                >
                    <option value="">Ưu tiên</option>
                    {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                    ))}
                </Select>
                <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-auto min-w-[140px]"
                >
                    <option value="title">Sắp xếp: Tiêu đề</option>
                    <option value="status">Sắp xếp: Trạng thái</option>
                    <option value="priority">Sắp xếp: Ưu tiên</option>
                    <option value="dueDate">Sắp xếp: Hạn</option>
                </Select>
                <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-auto min-w-[100px]"
                >
                    <option value="asc">↑ Tăng</option>
                    <option value="desc">↓ Giảm</option>
                </Select>
                {hasActiveFilters && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={clearFilters}
                    >
                        Xóa
                    </Button>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {filteredAndSortedTasks.length} / {tasks.length}
                </div>
            </div>

            {/* Tasks Table */}
            <Tasks
                tasks={filteredAndSortedTasks}
                tasksLoading={tasksLoading}
                onTasksChange={setTasks}
            />
        </div>
    );
}

