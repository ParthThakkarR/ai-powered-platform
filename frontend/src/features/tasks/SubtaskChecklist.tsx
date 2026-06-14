import { useState, useEffect } from 'react';
import { subtaskApi } from '../../services/api';
import { toast } from 'sonner';
import { CheckSquare, Square, Plus, Trash2, Loader2 } from 'lucide-react';

interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  position: number;
}

interface SubtaskChecklistProps {
  taskId: number;
}

export const SubtaskChecklist = ({ taskId }: SubtaskChecklistProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const fetchSubtasks = async () => {
    try {
      const res = await subtaskApi.listByTask(taskId);
      setSubtasks(res.data);
    } catch {
      // silently fail
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await subtaskApi.create(taskId, { title: newTitle.trim(), position: subtasks.length });
      setNewTitle('');
      fetchSubtasks();
    } catch {
      toast.error('Failed to add subtask');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (subtask: Subtask) => {
    try {
      await subtaskApi.update(subtask.id, { is_completed: !subtask.is_completed });
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, is_completed: !s.is_completed } : s));
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleDelete = async (subtaskId: number) => {
    try {
      await subtaskApi.delete(subtaskId);
      setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    } catch {
      toast.error('Failed to delete subtask');
    }
  };

  const completed = subtasks.filter(s => s.is_completed).length;
  const total = subtasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{completed}/{total}</span>
          <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{progress}%</span>
        </div>
      )}

      {/* Subtask List */}
      <div className="space-y-1">
        {subtasks.map(subtask => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-0 group transition-colors"
          >
            <button
              onClick={() => handleToggle(subtask)}
              className="flex-shrink-0"
            >
              {subtask.is_completed ? (
                <CheckSquare className="w-4 h-4 text-brand-primary" />
              ) : (
                <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
              )}
            </button>
            <span className={`flex-1 text-sm ${subtask.is_completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
              {subtask.title}
            </span>
            <button
              onClick={() => handleDelete(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-600 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Subtask */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add subtask..."
          className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-surface-0 border border-glass-border text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-primary/50"
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-all disabled:opacity-30"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
