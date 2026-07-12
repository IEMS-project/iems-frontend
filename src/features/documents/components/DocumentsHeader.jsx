import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  typeFilter,
  setTypeFilter,
  ownerFilter,
  setOwnerFilter,
  modifiedFilter,
  setModifiedFilter,
  ownerOptions,
  onEmptyTrash,
  hasTrashItems,
}) {
  const { t } = useTranslation();

  const getTypeLabel = () => {
    switch (typeFilter) {
      case "folder":
        return t("documents.header.typeFolder");
      case "doc":
        return t("documents.header.typeDoc");
      case "excel":
        return t("documents.header.typeExcel");
      case "pdf":
        return t("documents.header.typePdf");
      case "image":
        return t("documents.header.typeImage");
      case "other":
        return t("documents.header.typeOther");
      default:
        return t("documents.header.typeAll");
    }
  };

  const getModifiedLabel = () => {
    switch (modifiedFilter) {
      case "today":
        return t("documents.header.modifiedToday");
      case "last7days":
        return t("documents.header.modifiedLast7Days");
      case "last30days":
        return t("documents.header.modifiedLast30Days");
      case "thisYear":
        return t("documents.header.modifiedThisYear");
      case "lastYear":
        return t("documents.header.modifiedLastYear");
      default:
        return t("documents.header.modifiedAll");
    }
  };

  const selectedOwner = (ownerOptions || []).find((owner) => String(owner.id) === String(ownerFilter));
  const hasAdvancedFilter = typeFilter !== "all" || ownerFilter !== "all" || modifiedFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between rounded-xl border border-[#e4e8ee] dark:border-border bg-[#f8fafd] dark:bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={filterMode === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterMode("all")}
            className="gap-2 rounded-full"
          >
            <FolderOpen className="h-4 w-4" />
            {t('documents.filter.all')}
          </Button>
          <Button
            variant={filterMode === "favorites" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterMode("favorites")}
            className="gap-2 rounded-full"
          >
            <Star className="h-4 w-4" />
            {t('documents.filter.favorites')}
          </Button>
          <Button
            variant={filterMode === "trash" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterMode("trash")}
            className="gap-2 rounded-full"
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
            className="gap-2 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
            {t('documents.trash.emptyTrash')}
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl border-[#d0d7e2] dark:border-border bg-white dark:bg-secondary/40">
              {t("documents.header.type")}: {getTypeLabel()} <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuRadioGroup value={typeFilter} onValueChange={setTypeFilter}>
              <DropdownMenuRadioItem value="all">{t("documents.header.typeAll")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="folder">{t("documents.header.typeFolder")}</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="doc">{t("documents.header.typeDoc")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="excel">{t("documents.header.typeExcel")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="pdf">{t("documents.header.typePdf")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="image">{t("documents.header.typeImage")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="other">{t("documents.header.typeOther")}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-[260px] rounded-xl border-[#d0d7e2] dark:border-border bg-white dark:bg-secondary/40">
              <span className="truncate">
                {t("documents.header.owner")}: {selectedOwner?.name || t("documents.header.ownerAll")}
              </span>
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuRadioGroup value={String(ownerFilter)} onValueChange={setOwnerFilter}>
              <DropdownMenuRadioItem value="all">{t("documents.header.ownerAll")}</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {(ownerOptions || []).map((owner) => (
                <DropdownMenuRadioItem key={owner.id} value={String(owner.id)}>
                  {owner.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl border-[#d0d7e2] dark:border-border bg-white dark:bg-secondary/40">
              {t("documents.header.modified")}: {getModifiedLabel()} <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuRadioGroup value={modifiedFilter} onValueChange={setModifiedFilter}>
              <DropdownMenuRadioItem value="all">{t("documents.header.modifiedAll")}</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="today">{t("documents.header.modifiedToday")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="last7days">{t("documents.header.modifiedLast7Days")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="last30days">{t("documents.header.modifiedLast30Days")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="thisYear">{t("documents.header.modifiedThisYear")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lastYear">{t("documents.header.modifiedLastYear")}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasAdvancedFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setTypeFilter("all");
              setOwnerFilter("all");
              setModifiedFilter("all");
            }}
          >
            {t("documents.header.clearFilters")}
          </Button>
        )}
      </div>

      {/* Search and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Input
            type="text"
            placeholder={t('documents.header.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-xl rounded-full border-[#d0d7e2] dark:border-border bg-[#f8fafd] dark:bg-[#181d2a]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-[#d0d7e2] dark:border-border bg-white dark:bg-secondary/40">
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
        <div className="flex items-center rounded-full border border-[#d0d7e2] dark:border-border bg-white dark:bg-[#181d2a] p-0.5">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 rounded-full"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 rounded-full"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}





