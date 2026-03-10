"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Search, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Avatar from "@/components/ui/Avatar"
import { cn } from "@/lib/utils"

export function ManagerSelector({ 
  value, 
  users = [], 
  onChange,
  disabled = false 
}) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Find selected user
  const selectedUser = React.useMemo(() => {
    if (!value) return null
    return users.find(u => u.id === value || u.userId === value)
  }, [value, users])

  // Filter users based on search
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(u => 
      u.fullName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const handleSelect = (userId) => {
    onChange(userId)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button 
          variant="outline" 
          className="w-[200px] justify-between gap-2 font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedUser ? (
              <>
                <Avatar user={selectedUser} size="xs" />
                <span className="truncate">{selectedUser.fullName}</span>
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("departments.notAssigned")}</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[280px] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t("departments.searchMember")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Options */}
        <div className="max-h-[300px] overflow-y-auto p-1">
          {/* Not Assigned option */}
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleSelect(null)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <UserX className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="flex-1">{t("departments.notAssigned")}</span>
            {!value && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* User list */}
          {filteredUsers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("departments.noMembersFound")}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleSelect(user.id)}
              >
                <Avatar user={user} size="sm" />
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{user.fullName}</div>
                  {user.email && (
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  )}
                </div>
                {(value === user.id || value === user.userId) && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ManagerSelector
