import React, { useState, useMemo, useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';

export default function UserSelect({ assignableUsers = [], value = '', onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const selected = useMemo(() => {
    return assignableUsers.find(u => (u.userId || u.id) === value) || null;
  }, [assignableUsers, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignableUsers;
    return assignableUsers.filter(u => {
      const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim().toLowerCase();
      return fullName.includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [assignableUsers, query]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(s => !s)}
        className="w-full rounded border bg-white px-3 py-2 text-left text-sm flex items-center gap-2"
      >
        <Avatar name={selected ? (selected.fullName || selected.email) : ''} size={8} />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">{selected ? (selected.fullName || selected.email) : 'Chọn thành viên'}</div>
          <div className="text-xs text-gray-500 truncate">{selected ? selected.email : ''}</div>
        </div>
        <span className="text-xs text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded border bg-white shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên hoặc email..."
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            {filtered.map(u => {
              const id = u.userId || u.id;
              const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim();
              return (
                <div
                  key={id}
                  onClick={() => { onChange && onChange(id); setOpen(false); setQuery(''); }}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <Avatar name={fullName || u.email} size={7} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{fullName || u.email}</div>
                    <div className="text-sm text-gray-500 truncate">{u.email}</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-3 text-sm text-gray-500">Không tìm thấy người dùng</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
