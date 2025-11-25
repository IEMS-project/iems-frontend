"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Minus, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Badge from "@/components/ui/Badge"
import Avatar from "@/components/ui/Avatar"
import { getStatusVariant, translatePriority, translateStatus } from "@/lib/i18n"
import { getTaskTypeIcon, getTaskTypeColor } from "@/lib/taskTypeUtils"

export type Task = {
  id: string
  title: string
  description: string
  assignedTo: string | { id: string; name: string; email: string } | null
  assignedToName?: string
  assignedToEmail?: string
  assigneeName?: string
  assigneeEmail?: string
  userName?: string
  status: string
  priority: string
  taskType: string
  parentTaskId: string | null
  startDate: string | null
  dueDate: string | null
  createdByName?: string
  createdByEmail?: string
  createdBy?: { id: string; name: string; email: string } | null
}

const statusVariant = (status: string) => getStatusVariant(status)
const priorityDisplayMap: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  "Cao nhất": { icon: ChevronsUp, label: "Cao nhất", color: "text-red-700 dark:text-red-400" },
  "Cao": { icon: ChevronUp, label: "Cao", color: "text-red-600 dark:text-red-400" },
  "Trung bình": { icon: Minus, label: "Trung bình", color: "text-yellow-600 dark:text-yellow-400" },
  "Thấp": { icon: ChevronDown, label: "Thấp", color: "text-blue-600 dark:text-blue-400" },
  "Thấp nhất": { icon: ChevronsDown, label: "Thấp nhất", color: "text-blue-700 dark:text-blue-400" },
  "Không ưu tiên": { icon: Circle, label: "Không ưu tiên", color: "text-gray-500 dark:text-gray-400" },
}

export const taskColumns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nhiệm vụ
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const task = row.original
      const TaskIcon = getTaskTypeIcon(task.taskType)
      const iconColor = getTaskTypeColor(task.taskType)
      return (
        <div className="min-w-[200px] whitespace-nowrap flex items-center gap-2">
          <TaskIcon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
          <span className="text-gray-900 dark:text-gray-100">{row.getValue("title")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "assignedToName",
    header: "Người thực hiện",
    cell: ({ row }) => {
      const task = row.original
      // Try multiple possible field names
      const assignedName = 
        task.assignedToName || 
        task.assigneeName || 
        task.userName ||
        (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name : null) ||
        task.assignedToEmail || 
        task.assigneeEmail ||
        ""
      const assignedEmail = 
        task.assignedToEmail || 
        task.assigneeEmail ||
        (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.email : null) ||
        ""
      return (
        <div className="min-w-[180px] whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Avatar
              user={task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo : { firstName: assignedName, email: assignedEmail }}
              size="xs"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate text-gray-900 dark:text-gray-100">{assignedName || "-"}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {assignedEmail || ""}
              </span>
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = translateStatus(row.getValue("status") as string)
      return (
        <div className="min-w-[120px] whitespace-nowrap">
          <Badge variant={statusVariant(status)}>{status || "Chưa xác định"}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Độ ưu tiên",
    cell: ({ row }) => {
      const priority = translatePriority(row.getValue("priority") as string) || "Không ưu tiên"
      const display = priorityDisplayMap[priority] || { icon: Circle, label: priority, color: "text-gray-500 dark:text-gray-400" }
      const Icon = display.icon || Circle
      return (
        <div className="min-w-[140px] whitespace-nowrap flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Icon className={`h-4 w-4 ${display.color}`} aria-hidden />
          <span>{display.label}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: "Bắt đầu",
    cell: ({ row }) => {
      const date = row.getValue("startDate") as string | null
      return (
        <div className="min-w-[110px] whitespace-nowrap text-gray-900 dark:text-gray-100">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "dueDate",
    header: "Kết thúc",
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as string | null
      return (
        <div className="min-w-[110px] whitespace-nowrap text-gray-900 dark:text-gray-100">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "createdByName",
    header: "Người tạo",
    cell: ({ row }) => {
      const task = row.original
      // Try multiple possible field names
      const createdName = 
        task.createdByName || 
        (task.createdBy && typeof task.createdBy === 'object' ? task.createdBy.name : null) ||
        task.createdByEmail || 
        ""
      const createdEmail = 
        task.createdByEmail ||
        (task.createdBy && typeof task.createdBy === 'object' ? task.createdBy.email : null) ||
        ""
      return (
        <div className="min-w-[180px] whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Avatar
              user={task.createdBy && typeof task.createdBy === 'object' ? task.createdBy : { firstName: createdName, email: createdEmail }}
              size="xs"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate text-gray-900 dark:text-gray-100">{createdName || "-"}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {createdEmail || ""}
              </span>
            </div>
          </div>
        </div>
      )
    },
  },
]

