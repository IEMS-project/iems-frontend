import React from "react";
import Button from "./Button";
import Select from "./Select";

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

    return (
        <div className={`flex items-center justify-between ${className}`}>
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
                <div className="flex items-center gap-1">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleFirstPage}
                        disabled={currentPage <= 1}
                        title="Trang đầu"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1}
                        title="Trang trước"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        title="Trang sau"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLastPage}
                        disabled={currentPage >= totalPages}
                        title="Trang cuối"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
