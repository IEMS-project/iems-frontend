import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({ breadcrumbs = [], onCrumbClick }) {
    const hasCrumbs = Array.isArray(breadcrumbs) && breadcrumbs.length > 0;
    // If the breadcrumbs already include a home link (to: '/') or a 'Trang chủ' label,
    // don't render the static home link to avoid duplication.
    const breadcrumbsHaveHome = hasCrumbs && breadcrumbs.some(b => (b.to && b.to === "/") || (b.label && String(b.label).trim() === "Trang chủ"));

    return (
        <div className="-mx-4 px-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <nav className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100" aria-label="Breadcrumb">
                        <ol className="flex items-center gap-1">
                            {/* Optional static home link (skip if breadcrumbs already include home) */}
                            {!breadcrumbsHaveHome && (
                                <li className="flex items-center">
                                    <Link to="/" className="text-gray-500 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300">
                                        Trang chủ
                                    </Link>
                                    {hasCrumbs && <span className="mx-2 text-gray-400">›</span>}
                                </li>
                            )}

                            {/* Breadcrumb động */}
                            {hasCrumbs &&
                                breadcrumbs.map((item, index) => {
                                    const isLast = index === breadcrumbs.length - 1;
                                    let content;
                                    if (onCrumbClick) {
                                        // Render as clickable anchor that calls the provided callback
                                        content = (
                                            <a href="#" onClick={(e) => { e.preventDefault(); onCrumbClick(item, index); }} className="text-gray-500 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300">
                                                {item.label}
                                            </a>
                                        );
                                    } else {
                                        content = item.to ? (
                                            <Link to={item.to} className="text-gray-500 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300">
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-900 dark:text-gray-200">{item.label}</span>
                                        );
                                    }

                                    return (
                                        <li key={index} className="flex items-center">
                                            {content}
                                            {!isLast && <span className="mx-2 text-gray-400">›</span>}
                                        </li>
                                    );
                                })}
                        </ol>
                    </nav>
                </div>
            </div>
        </div>
    );
}
