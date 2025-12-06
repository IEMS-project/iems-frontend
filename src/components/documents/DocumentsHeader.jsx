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
import { ChevronDownIcon, LayoutGrid, List } from "lucide-react";

export default function DocumentsHeader({
  search,
  setSearch,
  onSortChange,
  getSortLabel,
  viewMode,
  setViewMode,
}) {
  const { t } = useTranslation();

  return (
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
  );
}





