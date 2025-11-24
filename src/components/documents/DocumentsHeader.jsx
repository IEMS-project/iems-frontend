import React from "react";
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
  return (
    <div className="flex items-center gap-4">
      <Input
        type="text"
        placeholder="Tìm kiếm tệp và thư mục..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sắp xếp: {getSortLabel()} <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortChange("name")}>
            Theo tên
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("date")}>
            Theo ngày
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("size")}>
            Theo dung lượng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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





