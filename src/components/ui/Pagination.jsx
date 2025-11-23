import React from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import {
    Pagination as ShadcnPagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "./pagination";
import Select from "./Select.jsx";
import { cn } from "@/lib/utils";

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20, 50],
    showPageSizeSelector = true,
    pageSizeLabel = "Số dòng trên trang:",
    className = ""
}) => {
    const handleFirstPage = () => {
        if (currentPage > 1) {
            onPageChange(1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handleLastPage = () => {
        if (currentPage < totalPages) {
            onPageChange(totalPages);
        }
    };

    const handlePageSizeChange = (e) => {
        const newPageSize = Number(e.target.value);
        onPageSizeChange(newPageSize);
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (currentPage <= 3) {
                // Near the start
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                pages.push("ellipsis");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // In the middle
                pages.push("ellipsis");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={cn("flex items-center justify-between", className)}>
            {/* Số dòng trên trang - bên trái */}
            {showPageSizeSelector && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {pageSizeLabel}
                    </span>
                    <Select
                        className="h-8 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                    >
                        {pageSizeOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </Select>
                </div>
            )}

            {/* Thông tin trang và điều hướng - bên phải */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Trang {currentPage} / {totalPages} • Tổng {totalItems}
                </span>
                
                <ShadcnPagination>
                    <PaginationContent>
                        {/* First page button */}
                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleFirstPage();
                                }}
                                className={cn(
                                    currentPage <= 1 && "pointer-events-none opacity-50"
                                )}
                                aria-label="Trang đầu"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </PaginationLink>
                        </PaginationItem>

                        {/* Previous page button */}
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePreviousPage();
                                }}
                                className={cn(
                                    currentPage <= 1 && "pointer-events-none opacity-50"
                                )}
                            />
                        </PaginationItem>

                        {/* Page numbers */}
                        {pageNumbers.map((page, index) => {
                            if (page === "ellipsis") {
                                return (
                                    <PaginationItem key={`ellipsis-${index}`}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }
                            
                            return (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onPageChange(page);
                                        }}
                                        isActive={currentPage === page}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}

                        {/* Next page button */}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNextPage();
                                }}
                                className={cn(
                                    currentPage >= totalPages && "pointer-events-none opacity-50"
                                )}
                            />
                        </PaginationItem>

                        {/* Last page button */}
                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleLastPage();
                                }}
                                className={cn(
                                    currentPage >= totalPages && "pointer-events-none opacity-50"
                                )}
                                aria-label="Trang cuối"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </ShadcnPagination>
            </div>
        </div>
    );
};

export default Pagination;
