import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

/**
 * AssigneeSelect - Dropdown select with avatar display
 * Shows member avatars and names in both trigger and dropdown options
 */
export default function AssigneeSelect({
  members = [],
  value = '',
  onChange,
  placeholder,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // Find selected member
  const selectedMember = members.find(m => m.userId === value);

  const handleSelect = (memberId) => {
    onChange(memberId);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border',
          'border-border bg-background text-foreground text-sm',
          'hover:bg-muted/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedMember ? (
            <>
              <Avatar
                user={selectedMember}
                src={selectedMember.avatar || selectedMember.image}
                name={selectedMember.userName || selectedMember.email}
                size="xs"
              />
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-medium truncate text-foreground">
                  {selectedMember.userName || selectedMember.email}
                </div>
                {selectedMember.userEmail && (
                  <div className="text-xs truncate text-muted-foreground">
                    {selectedMember.userEmail}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || t("issues.form.selectAssignee", "Select assignee")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedMember && (
            <button
              onClick={handleClear}
              className="p-0 hover:text-destructive transition-colors"
              title={t("ui.common.clear", "Clear")}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn(
              'transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-1 z-50',
          'rounded-md border border-border bg-background shadow-lg',
          'max-h-64 overflow-y-auto'
        )}>
          {/* Empty option */}
          <button
            onClick={() => handleSelect('')}
            className={cn(
              'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors',
              !value && 'bg-muted'
            )}
          >
            <span className="text-muted-foreground">
              {t("ui.common.none", "None")}
            </span>
          </button>

          {/* Member options */}
          {members.map(member => (
            <button
              key={member.userId}
              onClick={() => handleSelect(member.userId)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                value === member.userId && 'bg-muted'
              )}
            >
              <Avatar
                user={member}
                src={member.avatar || member.image}
                name={member.userName || member.email}
                size="xs"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-foreground">
                  {member.userName || member.email}
                </div>
                {member.userEmail && (
                  <div className="text-xs truncate text-muted-foreground">
                    {member.userEmail}
                  </div>
                )}
              </div>
              {value === member.userId && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full ml-auto flex-shrink-0" />
              )}
            </button>
          ))}

          {members.length === 0 && (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">
              {t("ui.common.noOptions", "No options available")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
