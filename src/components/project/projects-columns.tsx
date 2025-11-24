"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import UserAvatar from "@/components/ui/UserAvatar"
import { translateStatus } from "@/lib/i18n"

export type Project = {
  id: string
  name: string
  description: string
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
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const project = row.original
      return (
        <Link
          to={`/projects/${project.id}/overview`}
          className="font-bold text-foreground hover:underline"
        >
          {project.name}
        </Link>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => {
      return (
        <div className="max-w-xs truncate text-foreground/90">{row.getValue("description")}</div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = translateStatus(row.getValue("status") as string)
      return <div className="text-foreground">{status || "Chưa xác định"}</div>
    },
  },
  {
    accessorKey: "startDate",
    header: "Ngày bắt đầu",
    cell: ({ row }) => {
      const date = row.getValue("startDate") as string | null
      return (
        <div className="text-foreground">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "endDate",
    header: "Ngày kết thúc",
    cell: ({ row }) => {
      const date = row.getValue("endDate") as string | null
      return (
        <div className="text-foreground">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "managerName",
    header: "Quản lý",
    cell: ({ row }) => {
      const project = row.original
      return (
        <div className="flex items-center gap-2">
          <UserAvatar user={project} size="xs" />
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
    cell: ({ row }) => {
      const project = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu hành động</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(project.id)}
            >
              Sao chép ID dự án
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/projects/${project.id}/overview`}>Xem dự án</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]



