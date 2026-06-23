import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, FolderKanban, Loader2, ArrowRight } from "lucide-react";
import { searchService } from "@/features/search/api/searchService";
import { cn } from "@/lib/utils";

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function CommandPalette({ open, onClose }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const abortRef = useRef(null);

    const [query, setQuery] = useState("");
    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);

    const debouncedQuery = useDebounce(query, 280);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 60);
            setQuery("");
            setIssues([]);
            setProjects([]);
            setActiveIdx(0);
        }
    }, [open]);

    // Search
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.trim().length < 2) {
            setIssues([]);
            setProjects([]);
            setLoading(false);
            return;
        }

        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setLoading(true);
        Promise.all([
            searchService.searchIssues(debouncedQuery, ctrl.signal),
            searchService.searchProjects(debouncedQuery),
        ])
            .then(([iss, projs]) => {
                if (ctrl.signal.aborted) return;
                setIssues(iss || []);
                setProjects(projs || []);
                setActiveIdx(0);
            })
            .catch(() => {})
            .finally(() => {
                if (!ctrl.signal.aborted) setLoading(false);
            });
    }, [debouncedQuery]);

    // Build flat results list for keyboard nav
    const allResults = [
        ...issues.map(i => ({ type: "issue", item: i })),
        ...projects.map(p => ({ type: "project", item: p })),
    ];

    function handleSelect(result) {
        if (result.type === "issue") {
            const { projectId } = result.item;
            navigate(`/projects/${projectId}/backlog`);
        } else {
            const id = result.item.id || result.item.projectId;
            navigate(`/projects/${id}/overview`);
        }
        onClose();
    }

    // Keyboard navigation
    function handleKeyDown(e) {
        if (e.key === "Escape") { onClose(); return; }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, allResults.length - 1));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        }
        if (e.key === "Enter" && allResults[activeIdx]) {
            handleSelect(allResults[activeIdx]);
        }
    }

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIdx]);

    if (!open) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Palette */}
            <div className="fixed left-1/2 top-[12%] z-[1001] w-full max-w-xl -translate-x-1/2 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                    {loading
                        ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                        : <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                    }
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tìm nhiệm vụ, dự án..."
                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-y-auto pb-2">
                    {!debouncedQuery || debouncedQuery.trim().length < 2 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Gõ ít nhất 2 ký tự để tìm kiếm...</p>
                    ) : allResults.length === 0 && !loading ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy kết quả nào.</p>
                    ) : (
                        <>
                            {issues.length > 0 && (
                                <Section label="Nhiệm vụ">
                                    {issues.map((issue, i) => {
                                        const globalIdx = i;
                                        return (
                                            <ResultRow
                                                key={issue.id}
                                                dataIdx={globalIdx}
                                                active={activeIdx === globalIdx}
                                                icon={<FileText className="h-4 w-4 text-primary" />}
                                                primary={`${issue.issueKey ? issue.issueKey + " - " : ""}${issue.title}`}
                                                secondary={issue.projectName || ""}
                                                onSelect={() => handleSelect({ type: "issue", item: issue })}
                                                onHover={() => setActiveIdx(globalIdx)}
                                            />
                                        );
                                    })}
                                </Section>
                            )}
                            {projects.length > 0 && (
                                <Section label="Dự án">
                                    {projects.map((proj, i) => {
                                        const globalIdx = issues.length + i;
                                        return (
                                            <ResultRow
                                                key={proj.id || proj.projectId}
                                                dataIdx={globalIdx}
                                                active={activeIdx === globalIdx}
                                                icon={<FolderKanban className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
                                                primary={proj.name || proj.title}
                                                secondary={proj.status || ""}
                                                onSelect={() => handleSelect({ type: "project", item: proj })}
                                                onHover={() => setActiveIdx(globalIdx)}
                                            />
                                        );
                                    })}
                                </Section>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↑↓</kbd> điều hướng
                        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↵</kbd> chọn
                    </span>
                    <span>{allResults.length} kết quả</span>
                </div>
            </div>
        </>,
        document.body
    );
}

function Section({ label, children }) {
    return (
        <div className="pt-2">
            <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            {children}
        </div>
    );
}

function ResultRow({ dataIdx, active, icon, primary, secondary, onSelect, onHover }) {
    return (
        <button
            data-idx={dataIdx}
            onClick={onSelect}
            onMouseEnter={onHover}
            className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <span className="shrink-0">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{primary}</span>
                {secondary && <span className="block truncate text-xs text-muted-foreground">{secondary}</span>}
            </span>
            {active && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </button>
    );
}
