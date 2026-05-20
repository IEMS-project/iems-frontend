import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PrioritySelect - Dropdown select for priorities with color/icon display
 */
export default function PrioritySelect({
  issuePriorities = [],
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

  // Find selected priority
  const selectedPriority = issuePriorities.find(p => p.id === value);

  const handleSelect = (priorityId) => {
    onChange(priorityId);
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
          {selectedPriority ? (
            <>
              {selectedPriority.iconUrl ? (
                <span className="text-lg flex-shrink-0">{selectedPriority.iconUrl}</span>
              ) : (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: selectedPriority.color || '#6B7280' }}
                />
              )}
              <span className="truncate text-foreground">
                {selectedPriority.name}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || t("issues.form.selectPriority", "Select priority")}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform flex-shrink-0',
            open && 'rotate-180'
          )}
        />
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

          {/* Priority options */}
          {issuePriorities.map(priority => (
            <button
              key={priority.id}
              onClick={() => handleSelect(priority.id)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                value === priority.id && 'bg-muted'
              )}
            >
              {priority.iconUrl ? (
                <span className="text-lg flex-shrink-0">{priority.iconUrl}</span>
              ) : (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: priority.color || '#6B7280' }}
                />
              )}
              <span className="flex-1 truncate font-medium text-foreground">
                {priority.name}
              </span>
              {value === priority.id && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
              )}
            </button>
          ))}

          {issuePriorities.length === 0 && (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">
              {t("ui.common.noOptions", "No options available")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
