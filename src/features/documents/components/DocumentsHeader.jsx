import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, LayoutGrid, List, Star, FolderOpen, Trash2 } from "lucide-react";

export default function DocumentsHeader({
  search,
  setSearch,
  onSortChange,
  getSortLabel,
  viewMode,
  setViewMode,
  filterMode,
  setFilterMode,
  onEmptyTrash,
  hasTrashItems,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={filterMode === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterMode("all")}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            {t('documents.filter.all')}
          </Button>
          <Button
            variant={filterMode === "favorites" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterMode("favorites")}
            className="gap-2"
          >
            <Star className="h-4 w-4" />
            {t('documents.filter.favorites')}
          </Button>
          <Button
            variant={filterMode === "trash" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterMode("trash")}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t('documents.filter.trash')}
          </Button>
        </div>
        {filterMode === "trash" && hasTrashItems && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEmptyTrash}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t('documents.trash.emptyTrash')}
          </Button>
        )}
      </div>

      {/* Search and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder={t('documents.header.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {t('documents.header.sort')}: {getSortLabel()} <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange("name")}>
                {t('documents.header.sortByName')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("date")}>
                {t('documents.header.sortByDate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("size")}>
                {t('documents.header.sortBySize')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center rounded-md border border-input">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 rounded-r-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 rounded-l-none border-l"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}





