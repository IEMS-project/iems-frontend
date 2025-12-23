"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
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
  phaseId: string | null
  phaseName?: string
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
  "Cao nhất": { icon: ChevronsUp, label: "Cao nhất", color: "text-red-600 dark:text-red-400" },
  "Cao": { icon: ChevronUp, label: "Cao", color: "text-red-600 dark:text-red-400" },
  "Trung bình": { icon: Minus, label: "Trung bình", color: "text-yellow-600 dark:text-yellow-400" },
  "Thấp": { icon: ChevronDown, label: "Thấp", color: "text-blue-600 dark:text-blue-400" },
  "Thấp nhất": { icon: ChevronsDown, label: "Thấp nhất", color: "text-blue-600 dark:text-blue-400" },
  "Không ưu tiên": { icon: Circle, label: "Không ưu tiên", color: "text-muted-foreground" },
}

export const taskColumns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      const { t } = useTranslation()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('projects.detail.tasks.columns.title')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const task = row.original
      const TaskIcon = getTaskTypeIcon(task.taskType)
      const iconColor = getTaskTypeColor(task.taskType)
      return (
        <div className="w-[200px] flex items-center gap-2">
          <TaskIcon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
          <span className="text-foreground truncate">{row.getValue("title")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "assignedToName",
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.assignee')
    },
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
              <span className="font-medium truncate text-foreground">{assignedName || "-"}</span>
              <span className="text-sm text-muted-foreground truncate">
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
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.status')
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      const rawStatus = row.getValue("status") as string
      const statusTranslated = translateStatus(rawStatus)
      
      // Map Vietnamese status to i18n keys
      const statusMap: Record<string, string> = {
        'Đang chờ': 'pending',
        'Đang thực hiện': 'inProgress',
        'Đang duyệt': 'inReview',
        'Hoàn thành': 'completed',
        'Bị chặn': 'blocked',
        'Đã hủy': 'cancelled',
        'Tạm ngừng': 'onHold',
        'Chưa xác định': 'unknown'
      }
      
      const statusKey = statusMap[statusTranslated] || 'unknown'
      const statusLabel = t(`dashboard.status.${statusKey}`)
      
      return (
        <div className="min-w-[120px] whitespace-nowrap">
          <Badge variant={statusVariant(statusTranslated)}>{statusLabel}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.priority')
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      const rawPriority = row.getValue("priority") as string
      const priorityTranslated = translatePriority(rawPriority) || "Không ưu tiên"
      
      // Map Vietnamese priority to i18n keys
      const priorityMap: Record<string, string> = {
        'Cao nhất': 'highest',
        'Cao': 'high',
        'Trung bình': 'medium',
        'Thấp': 'low',
        'Thấp nhất': 'lowest',
        'Không ưu tiên': 'none'
      }
      
      const priorityKey = priorityMap[priorityTranslated] || 'medium'
      const priorityLabel = t(`dashboard.priority.${priorityKey}`)
      
      const display = priorityDisplayMap[priorityTranslated] || { icon: Circle, label: priorityLabel, color: "text-gray-500 dark:text-gray-400" }
      const Icon = display.icon || Circle
      
      return (
        <div className="min-w-[140px] whitespace-nowrap flex items-center gap-2 text-foreground">
          <Icon className={`h-4 w-4 ${display.color}`} aria-hidden />
          <span>{priorityLabel}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "phaseName",
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.phase')
    },
    cell: ({ row }) => {
      const task = row.original
      const phaseName = task.phaseName || ""
      return (
        <div className="min-w-[150px] whitespace-nowrap text-foreground">
          {phaseName || "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.startDate')
    },
    cell: ({ row }) => {
      const date = row.getValue("startDate") as string | null
      return (
        <div className="min-w-[110px] whitespace-nowrap text-foreground">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "dueDate",
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.dueDate')
    },
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as string | null
      return (
        <div className="min-w-[110px] whitespace-nowrap text-foreground">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "createdByName",
    header: () => {
      const { t } = useTranslation()
      return t('projects.detail.tasks.columns.createdBy')
    },
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
              <span className="font-medium truncate text-foreground">{createdName || "-"}</span>
              <span className="text-sm text-muted-foreground truncate">
                {createdEmail || ""}
              </span>
            </div>
          </div>
        </div>
      )
    },
  },
]

