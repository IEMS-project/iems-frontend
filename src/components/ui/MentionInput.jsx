import React, { useState, useRef, useEffect, useCallback } from "react";
import { projectService } from "@/features/projects/api/projectService";

/**
 * Textarea that supports @username mention.
 * Props:
 *   value, onChange(newValue) — controlled
 *   projectId — for fetching members
 *   placeholder, rows, className, disabled
 */
export default function MentionInput({
    value,
    onChange,
    projectId,
    placeholder = "Nhập nội dung...",
    rows = 3,
    className = "",
    disabled = false,
}) {
    const textareaRef = useRef(null);
    const [members, setMembers] = useState([]);
    const [query, setQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownIdx, setDropdownIdx] = useState(0);
    const [atPos, setAtPos] = useState(null); // cursor position of '@'

    // Load members on mount
    useEffect(() => {
        if (!projectId) return;
        projectService.getProjectMembers(projectId)
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setMembers(list);
            })
            .catch(() => {});
    }, [projectId]);

    const filtered = (members || []).filter(m => {
        if (!m) return false;
        const name = (m.userName || `${m.firstName || ""} ${m.lastName || ""}`).trim().toLowerCase();
        const email = (m.userEmail || m.email || "").toLowerCase();
        const q = (query || "").toLowerCase();
        return name.includes(q) || email.includes(q);
    }).slice(0, 6);

    function handleChange(e) {
        const text = e.target.value || "";
        const cursor = e.target.selectionStart;

        // Detect '@' trigger
        const before = text.slice(0, cursor);
        const match = before.match(/@(\w*)$/);
        if (match) {
            setAtPos(cursor - match[0].length);
            setQuery(match[1]);
            setShowDropdown(true);
            setDropdownIdx(0);
        } else {
            setShowDropdown(false);
            setQuery("");
        }

        onChange(text);
    }

    function insertMention(member) {
        if (!member) return;
        const name = (member.userName || `${member.firstName || ""} ${member.lastName || ""}`).trim() || member.userEmail || member.email || "user";
        const userId = member.userId || member.accountId || member.id;
        const safeValue = value || "";
        const before = safeValue.slice(0, atPos);
        const after = safeValue.slice(textareaRef.current?.selectionStart || atPos + query.length + 1);
        const newValue = `${before}@[${name}](${userId}) ${after}`;
        onChange(newValue);
        setShowDropdown(false);
        setQuery("");
        // Move cursor after mention
        setTimeout(() => {
            const newPos = (before + `@[${name}](${userId}) `).length;
            textareaRef.current?.setSelectionRange(newPos, newPos);
            textareaRef.current?.focus();
        }, 0);
    }

    function handleKeyDown(e) {
        if (!showDropdown) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setDropdownIdx(i => Math.min(i + 1, (filtered.length || 1) - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setDropdownIdx(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && filtered[dropdownIdx]) { e.preventDefault(); insertMention(filtered[dropdownIdx]); }
        if (e.key === "Escape") setShowDropdown(false);
    }

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value || ""}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                className={`w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${className}`}
            />

            {showDropdown && filtered.length > 0 && (
                <div className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Mention người dùng
                    </p>
                    {filtered.map((m, i) => {
                        const name = (m.userName || `${m.firstName || ""} ${m.lastName || ""}`).trim() || m.userEmail || m.email;
                        const email = m.userEmail || m.email;
                        return (
                            <button
                                key={m.userId || m.accountId || m.id || i}
                                onMouseDown={e => { e.preventDefault(); insertMention(m); }}
                                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${i === dropdownIdx ? "bg-indigo-50 dark:bg-indigo-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                                    {(name || "U").charAt(0).toUpperCase()}
                                </span>
                                <span>
                                    <span className="block font-medium text-gray-900 dark:text-gray-100">{name}</span>
                                    {email && <span className="block text-xs text-gray-400">{email}</span>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Renders comment content with @mentions highlighted.
 * Supports @[Name](userId) and @[Name] and @SimpleName formats.
 */
export function CommentContent({ content }) {
    if (typeof content !== 'string') return content || null;
    
    // Regex matches @[Name](userId) OR @[Name] OR @SimpleName
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\)|@\[[^\]]+\]|@\S+)/g);
    
    return (
        <span>
            {parts.map((part, i) => {
                if (!part) return null;
                
                // Case: @[Name](userId)
                const fullMentionMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
                if (fullMentionMatch) {
                    return <span key={i} className="font-semibold text-indigo-600 dark:text-indigo-400">@{fullMentionMatch[1]}</span>;
                }
                
                // Case: @[Name]
                if (part.startsWith("@[") && part.endsWith("]")) {
                    const name = part.slice(2, -1);
                    return <span key={i} className="font-semibold text-indigo-600 dark:text-indigo-400">@{name}</span>;
                }
                
                // Case: @SimpleName
                if (part.startsWith("@")) {
                    return <span key={i} className="font-semibold text-indigo-600 dark:text-indigo-400">{part}</span>;
                }
                
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}
