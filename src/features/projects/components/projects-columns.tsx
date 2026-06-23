"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Avatar from "@/components/ui/Avatar"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"

export type Project = {
  id: string
  name: string
  description: string
  avatarUrl?: string | null
  status: string
  startDate: string | null
  endDate: string | null
  managerId: string
  managerName: string
  managerEmail: string
  managerImage: string | null
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const { t } = useTranslation()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('projects.columns.name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const project = row.original
      return (
        <Link
          to={`/projects/${project.id}/overview`}
          className="flex items-center gap-2 font-bold text-foreground hover:underline"
        >
          <ProjectAvatar project={project} size="xs" />
          <span>{project.name}</span>
        </Link>
      )
    },
  },
  {
    accessorKey: "description",
    header: () => {
      const { t } = useTranslation()
      return t('projects.columns.description')
    },
    cell: ({ row }) => {
      return (
        <div className="max-w-xs truncate text-foreground/90">{row.getValue("description")}</div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => {
      const { t } = useTranslation()
      return t('projects.columns.status')
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      const status = row.getValue("status") as string
      const statusMap = {
        // API values (uppercase with underscores)
        "PLANNING": "planning",
        "IN_PROGRESS": "inProgress",
        "ON_HOLD": "onHold",
        "COMPLETED": "completed",
        "CANCELLED": "cancelled",
        // Vietnamese display names
        "Đang chờ": "pending",
        "Đang thực hiện": "inProgress",
        "Đang đánh giá": "inReview",
        "Hoàn thành": "completed",
        "Đã hoàn thành": "done",
        "Tạm dừng": "onHold",
        "Bị chặn": "blocked",
        "Đã hủy": "cancelled",
        // English display names
        "Pending": "pending",
        "Planning": "planning",
        "In Progress": "inProgress",
        "In Review": "inReview",
        "Completed": "completed",
        "Done": "done",
        "On Hold": "onHold",
        "Blocked": "blocked",
        "Cancelled": "cancelled"
      }
      const key = statusMap[status] || "unknown"
      return <div className="text-foreground">{t(`dashboard.status.${key}`)}</div>
    },
  },
  {
    accessorKey: "startDate",
    header: () => {
      const { t } = useTranslation()
      return t('projects.columns.startDate')
    },
    cell: ({ row }) => {
      const date = row.getValue("startDate") as string | null
      if (!date) return <div className="text-foreground">-</div>
      const [y, m, d] = date.split("T")[0].split("-").map(Number)
      return (
        <div className="text-foreground">
          {new Date(y, m - 1, d).toLocaleDateString("vi-VN")}
        </div>
      )
    },
  },
  {
    accessorKey: "endDate",
    header: () => {
      const { t } = useTranslation()
      return t('projects.columns.endDate')
    },
    cell: ({ row }) => {
      const date = row.getValue("endDate") as string | null
      if (!date) return <div className="text-foreground">-</div>
      const [y, m, d] = date.split("T")[0].split("-").map(Number)
      return (
        <div className="text-foreground">
          {new Date(y, m - 1, d).toLocaleDateString("vi-VN")}
        </div>
      )
    },
  },
  {
    accessorKey: "managerName",
    header: () => {
      const { t } = useTranslation()
      return t('projects.columns.manager')
    },
    cell: ({ row }) => {
      const project = row.original
      return (
        <div className="flex items-center gap-2">
          <Avatar src={project.managerImage || project.manager_image} name={project.managerName || project.managerName} size="xs" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium truncate text-foreground">
              {project.managerName || project.managerEmail || project.managerId}
            </span>
            <span className="text-sm text-muted-foreground truncate">
              {project.managerEmail}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const { t } = useTranslation()
      const project = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t('projects.actions.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('projects.columns.actions')}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={`/projects/${project.id}/overview`}>{t('projects.actions.view')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const onEdit = (table.options.meta as any)?.onEdit
                if (onEdit) onEdit(project)
              }}
            >
              {t('projects.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const onDelete = (table.options.meta as any)?.onDelete
                if (onDelete) onDelete(project)
              }}
              className="text-red-600 focus:text-red-600"
            >
              {t('projects.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]



