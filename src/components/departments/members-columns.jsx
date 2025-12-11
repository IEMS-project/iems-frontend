"use client"

import { ArrowUpDown, Eye, Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import Avatar from "@/components/ui/Avatar"

export const createMemberColumns = (onView, onEdit, onDelete) => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const { t } = useTranslation()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          {t('departments.columns.name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const member = row.original
      const fullName = member.firstName && member.lastName
        ? `${member.firstName} ${member.lastName}`
        : `User ID: ${member.userId}`
      return (
        <div className="flex items-center gap-3">
          <Avatar user={member} size="sm" />
          <div>
            <div className="font-medium text-foreground">{fullName}</div>
            {member.email && (
              <div className="text-sm text-muted-foreground">{member.email}</div>
            )}
          </div>
        </div>
      )
    },
    filterFn: (row, columnId, filterValue) => {
      const member = row.original
      const searchValue = filterValue.toLowerCase()
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase()
      return (
        fullName.includes(searchValue) ||
        (member.email && member.email.toLowerCase().includes(searchValue)) ||
        (member.phone && member.phone.toLowerCase().includes(searchValue))
      )
    },
  },
  {
    accessorKey: "role",
    header: () => {
      const { t } = useTranslation()
      return t('departments.columns.role')
    },
    cell: ({ row }) => {
      return (
        <div className="text-foreground">{row.getValue("role") || "N/A"}</div>
      )
    },
  },
  {
    accessorKey: "contractType",
    header: () => {
      const { t } = useTranslation()
      return t('departments.columns.contractType')
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      const type = row.getValue("contractType")
      const typeStyles = {
        FULLTIME: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        PARTTIME: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        REMOTE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        CONTRACT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyles[type] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
          {type || "N/A"}
        </span>
      )
    },
  },
  {
    accessorKey: "dob",
    header: () => {
      const { t } = useTranslation()
      return t('departments.columns.dob')
    },
    cell: ({ row }) => {
      const date = row.getValue("dob")
      return (
        <div className="text-foreground">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"}
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: () => {
      const { t } = useTranslation()
      return t('departments.columns.address')
    },
    cell: ({ row }) => {
      return (
        <div className="max-w-[150px] truncate text-foreground">
          {row.getValue("address") || "N/A"}
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: () => {
      const { t } = useTranslation()
      return t('departments.columns.phone')
    },
    cell: ({ row }) => {
      return (
        <div className="text-foreground">{row.getValue("phone") || "N/A"}</div>
      )
    },
  },
  {
    id: "actions",
    header: () => {
      const { t } = useTranslation()
      return <div className="text-center">{t('departments.columns.actions')}</div>
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      const member = row.original
      return (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(member)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(member)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(member)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
