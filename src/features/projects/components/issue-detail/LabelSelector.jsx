import React, { useState, useEffect } from "react";
import { Tag, Plus, Check, Search, Settings2, Loader2, X } from "lucide-react";
import { labelService } from "../../api/labelService";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", 
  "#10b981", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", 
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b"
];

export default function LabelSelector({ projectId, selectedLabels = [], onChange }) {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: "", color: PRESET_COLORS[10] });

  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen, projectId]);

  const loadLabels = async () => {
    try {
      const data = await labelService.getLabelsByProject(projectId);
      setLabels(data);
    } catch (e) {
      toast.error("Không thể tải danh sách nhãn");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLabel = (label) => {
    const isSelected = selectedLabels.some(l => l.id === label.id);
    let newSelection;
    if (isSelected) {
      newSelection = selectedLabels.filter(l => l.id !== label.id);
    } else {
      newSelection = [...selectedLabels, label];
    }
    onChange(newSelection);
  };

  const handleCreateLabel = async () => {
    if (!newLabel.name.trim()) return;
    try {
      const created = await labelService.createLabel({
        projectId,
        name: newLabel.name,
        color: newLabel.color
      });
      setLabels([...labels, created]);
      handleToggleLabel(created);
      setIsCreating(false);
      setNewLabel({ name: "", color: PRESET_COLORS[10] });
    } catch (e) {
      toast.error("Không thể tạo nhãn");
    }
  };

  const filteredLabels = labels.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Plus className="h-3 w-3" />
        Labels
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Labels</span>
                <button onClick={() => setIsCreating(!isCreating)} className="text-indigo-500 hover:text-indigo-600 transition-colors">
                  {isCreating ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                </button>
              </div>

              {!isCreating ? (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search labels..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Label name..."
                    value={newLabel.name}
                    onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewLabel({ ...newLabel, color: c })}
                        className={`h-5 w-5 rounded-full transition-all hover:scale-110 ${newLabel.color === c ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateLabel}
                    disabled={!newLabel.name.trim()}
                    className="w-full py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    Create Label
                  </button>
                </div>
              )}
            </div>

            {!isCreating && (
              <div className="max-h-60 overflow-y-auto p-1.5">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : filteredLabels.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-500">No labels found</p>
                ) : (
                  filteredLabels.map(label => {
                    const isSelected = selectedLabels.some(l => l.id === label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => handleToggleLabel(label)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{label.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
