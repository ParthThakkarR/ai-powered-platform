import { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { labelApi } from '../../services/api';
import { toast } from 'sonner';

interface Label {
  id: number;
  name: string;
  color: string;
  organization_id: number | null;
}

interface LabelsMultiSelectProps {
  taskId: number;
  selectedLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  readOnly?: boolean;
}

export const LabelsMultiSelect = ({ taskId, selectedLabels, onLabelsChange, readOnly }: LabelsMultiSelectProps) => {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const res = await labelApi.list();
      setAllLabels(res.data);
    } catch {
      toast.error('Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (labelId: number) => selectedLabels.some(l => l.id === labelId);

  const toggleLabel = async (label: Label) => {
    try {
      if (isAssigned(label.id)) {
        await labelApi.removeFromTask(taskId, label.id);
        onLabelsChange(selectedLabels.filter(l => l.id !== label.id));
      } else {
        await labelApi.addToTask(taskId, label.id);
        onLabelsChange([...selectedLabels, label]);
      }
    } catch {
      toast.error('Failed to update label');
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await labelApi.create({ name: newName.trim(), color: newColor });
      setAllLabels(prev => [...prev, res.data]);
      setNewName('');
      setNewColor('#6366f1');
      toast.success('Label created');
    } catch {
      toast.error('Failed to create label');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => !readOnly && setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-0 border border-glass-border text-sm transition-all w-full ${readOnly ? 'text-slate-400 cursor-default' : 'text-slate-300 hover:border-brand-primary/50'}`}
      >
        <Tag className="w-4 h-4 text-slate-500" />
        <span>{selectedLabels.length > 0 ? `${selectedLabels.length} label(s)` : 'Labels'}</span>
      </button>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map(label => (
            <span
              key={label.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${readOnly ? '' : 'cursor-pointer hover:opacity-80'} transition`}
              style={{ backgroundColor: label.color }}
              onClick={() => !readOnly && toggleLabel(label)}
            >
              {label.name}
              {!readOnly && <X className="w-3 h-3" />}
            </span>
          ))}
        </div>
      )}

      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-1 border border-glass-border rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 max-h-48 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-500 text-center py-4">Loading...</p>
            ) : allLabels.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No labels yet</p>
            ) : (
              allLabels.map(label => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-glass-white transition-all"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                  <span className="flex-1 text-left">{label.name}</span>
                  {isAssigned(label.id) && <Check className="w-4 h-4 text-brand-primary" />}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-glass-border p-2">
            <div className="flex gap-1 mb-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-all ${newColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-1' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New label..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-surface-0 border border-glass-border text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
