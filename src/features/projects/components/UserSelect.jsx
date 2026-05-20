import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar.jsx';
import { X } from 'lucide-react';

const MIN_QUERY_LENGTH = 1;
const PAGE_SIZE = 20;

/**
 * UserSelect — single or multi-select user picker.
 *
 * Single mode (default):
 *   value: string (userId)
 *   onChange(id, userObj)
 *
 * Multi mode (multiple={true}):
 *   value: string[] (array of userIds)
 *   onChange(ids, userObjArray)
 */
export default function UserSelect({
  assignableUsers = [],
  value = '',
  onChange,
  searchUsers,
  multiple = false,
}) {
  const { t } = useTranslation();
  const isRemoteMode = typeof searchUsers === 'function';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  // For single mode: keep track of selected user object
  const [selectedUser, setSelectedUser] = useState(null);
  // For multi mode: keep user objects for display
  const [selectedUsers, setSelectedUsers] = useState([]);
  const ref = useRef();
  const listRef = useRef();

  // Normalise value to array for multi-mode
  const selectedIds = useMemo(() => {
    if (!multiple) return [];
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [multiple, value]);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    if (!isRemoteMode) return;
    if (!open) {
      setQuery('');
      setOptions([]);
      setPage(0);
      setHasMore(false);
    }
  }, [isRemoteMode, open]);

  // Single mode: resolve displayed user
  const selected = useMemo(() => {
    if (multiple) return null;
    const source = isRemoteMode ? options : assignableUsers;
    return source.find((u) => (u.userId || u.id) === value) || selectedUser;
  }, [multiple, isRemoteMode, options, assignableUsers, selectedUser, value]);

  const filteredLocalOptions = useMemo(() => {
    if (isRemoteMode) return [];
    const q = query.trim().toLowerCase();
    if (!q) return assignableUsers;
    return assignableUsers.filter((u) => {
      const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim().toLowerCase();
      return fullName.includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [assignableUsers, isRemoteMode, query]);

  const runSearch = useCallback(async (keyword, nextPage, append = false) => {
    if (typeof searchUsers !== 'function') return;
    if (keyword.trim().length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setHasMore(false);
      setPage(0);
      return;
    }

    setLoading(true);
    try {
      const result = await searchUsers(keyword, nextPage, PAGE_SIZE);
      const incoming = Array.isArray(result?.items) ? result.items : [];
      const normalized = incoming.map((u) => ({
        ...u,
        id: u.id || u.userId,
        userId: u.userId || u.id,
      }));

      setOptions((prev) => {
        if (!append) return normalized;
        const byId = new Map(prev.map((item) => [item.id || item.userId, item]));
        normalized.forEach((item) => byId.set(item.id || item.userId, item));
        return Array.from(byId.values());
      });
      setPage(nextPage);
      setHasMore(Boolean(result?.hasMore));
    } catch (error) {
      console.error('User search failed:', error);
      if (!append) setOptions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchUsers]);

  useEffect(() => {
    if (!isRemoteMode) return;
    if (!open) return;
    const timer = setTimeout(() => {
      runSearch(query, 0, false);
      if (listRef.current) listRef.current.scrollTop = 0;
    }, 350);
    return () => clearTimeout(timer);
  }, [isRemoteMode, open, query, runSearch]);

  const handleScroll = (e) => {
    if (!isRemoteMode) return;
    if (!hasMore || loading) return;
    const target = e.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (nearBottom) runSearch(query, page + 1, true);
  };

  const handleSelectUser = (u) => {
    const id = u.userId || u.id;
    if (multiple) {
      const alreadySelected = selectedIds.includes(id);
      let nextIds;
      let nextUsers;
      if (alreadySelected) {
        nextIds = selectedIds.filter((x) => x !== id);
        nextUsers = selectedUsers.filter((x) => (x.userId || x.id) !== id);
      } else {
        nextIds = [...selectedIds, id];
        nextUsers = [...selectedUsers, u];
      }
      setSelectedUsers(nextUsers);
      onChange && onChange(nextIds, nextUsers);
      // Keep dropdown open for multi-select
    } else {
      onChange && onChange(id, u);
      setSelectedUser(u);
      setOpen(false);
      setQuery('');
    }
  };

  const handleRemoveSelected = (id) => {
    const nextIds = selectedIds.filter((x) => x !== id);
    const nextUsers = selectedUsers.filter((x) => (x.userId || x.id) !== id);
    setSelectedUsers(nextUsers);
    onChange && onChange(nextIds, nextUsers);
  };

  const renderEmptyState = () => {
    if (!isRemoteMode) {
      return <div className="p-3 text-sm text-muted-foreground">{t('select.noResults')}</div>;
    }
    if (query.trim().length < MIN_QUERY_LENGTH) {
      return (
        <div className="p-3 text-sm text-muted-foreground">
          {t('projects.detail.members.form.searchMinChars', {
            count: MIN_QUERY_LENGTH,
            defaultValue: `Type at least ${MIN_QUERY_LENGTH} characters to search`,
          })}
        </div>
      );
    }
    if (loading) {
      return <div className="p-3 text-sm text-muted-foreground">{t('ui.common.loading', { defaultValue: 'Loading...' })}</div>;
    }
    return <div className="p-3 text-sm text-muted-foreground">{t('select.noResults')}</div>;
  };

  const displayList = isRemoteMode ? options : filteredLocalOptions;

  return (
    <div className="relative" ref={ref}>
      {/* ── Selected tags (multi mode) ── */}
      {multiple && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((u) => {
            const id = u.userId || u.id;
            const name = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim() || u.email;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs px-2.5 py-1 font-medium"
              >
                <Avatar user={u} size={4} />
                {name}
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(id)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm flex items-center gap-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {!multiple && <Avatar user={selected || {}} size={8} />}
        <div className="flex-1 min-w-0">
          {multiple ? (
            <div className="truncate text-muted-foreground">
              {selectedIds.length === 0
                ? 'Search and select users...'
                : `${selectedIds.length} user${selectedIds.length > 1 ? 's' : ''} selected`}
            </div>
          ) : (
            <>
              <div className="truncate font-medium text-foreground">
                {selected ? (selected.fullName || selected.email) : t('projects.detail.tasks.form.selectMember')}
              </div>
              <div className="text-xs text-muted-foreground truncate">{selected ? selected.email : ''}</div>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-400">▾</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-md border border-input bg-popover text-popover-foreground shadow-md max-h-72 overflow-hidden">
          <div className="p-2 border-b border-border/70">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('select.search')}
              className="w-full rounded-md border border-input px-2 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div ref={listRef} onScroll={handleScroll} className="max-h-56 overflow-auto">
            {displayList.map((u) => {
              const id = u.userId || u.id;
              const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
              const isDisabled = Boolean(u.alreadyMember);
              const isChecked = multiple && selectedIds.includes(id);
              return (
                <div
                  key={id}
                  onClick={() => { if (!isDisabled) handleSelectUser(u); }}
                  className={`flex items-center gap-3 p-2 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'} ${isChecked ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  {multiple && (
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-muted-foreground'}`}>
                      {isChecked && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                  )}
                  <Avatar user={u} size={7} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-foreground">{fullName || u.email}</div>
                    <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                    {isDisabled && (
                      <div className="text-xs text-amber-600 dark:text-amber-400">Already in project</div>
                    )}
                  </div>
                </div>
              );
            })}

            {displayList.length === 0 && renderEmptyState()}

            {isRemoteMode && options.length > 0 && loading && (
              <div className="p-3 text-sm text-muted-foreground border-t border-border/70">
                {t('ui.common.loading', { defaultValue: 'Loading...' })}
              </div>
            )}
          </div>
          {multiple && (
            <div className="p-2 border-t border-border/70 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
