"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Badge from "@/components/ui/Badge"
import UserAvatar from "@/components/ui/UserAvatar"

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

function statusVariant(status: string) {
  switch (status) {
    case "Hoàn thành":
      return "green"
    case "Đang làm":
      return "blue"
    case "Chờ":
      return "yellow"
    default:
      return "gray"
  }
}

function priorityVariant(priority: string) {
  switch (priority) {
    case "Cao":
      return "red"
    case "Trung bình":
      return "yellow"
    case "Thấp":
      return "blue"
    default:
      return "gray"
  }
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
      return <div className="min-w-[200px] whitespace-nowrap text-gray-900 dark:text-gray-100">{row.getValue("title")}</div>
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
            <UserAvatar
              user={{ firstName: assignedName, email: assignedEmail }}
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
      const status = row.getValue("status") as string
      return (
        <div className="min-w-[120px] whitespace-nowrap">
          <Badge variant={statusVariant(status)}>{status}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Độ ưu tiên",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <div className="min-w-[120px] whitespace-nowrap">
          <Badge variant={priorityVariant(priority)}>{priority}</Badge>
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
            <UserAvatar
              user={{ firstName: createdName, email: createdEmail }}
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

