import { useState, useEffect } from 'react';
import {
  X, Calendar, MessageSquare,
  ChevronRight, AlertCircle, Trash2,
} from 'lucide-react';
import { taskApi } from '../../services/api';
import { CommentsSection } from './CommentsSection';
import { LabelsMultiSelect } from './LabelsMultiSelect';
import { toast } from 'sonner';

interface Label {
  id: number;
  name: string;
  color: string;
  organization_id: number | null;
}

interface TaskDetail {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  project_id: number;
  assignee_id: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  labels: Label[];
}

interface TaskDetailPanelProps {
  taskId: number;
  onClose: () => void;
  onUpdate: () => void;
  currentUserId: number;
}

const STATUSES = [
  { id: 'TODO', label: 'To Do', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500' },
  { id: 'REVIEW', label: 'Review', color: 'bg-cyan-500' },
  { id: 'DONE', label: 'Done', color: 'bg-emerald-500' },
];

const PRIORITIES = [
  { id: 'LOW', label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'MEDIUM', label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'HIGH', label: 'High', color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'URGENT', label: 'Urgent', color: 'text-red-500', bg: 'bg-red-500/20' },
];

export const TaskDetailPanel = ({ taskId, onClose, onUpdate, currentUserId }: TaskDetailPanelProps) => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'details'>('comments');

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await taskApi.get(taskId);
      setTask(res.data);
      setEditTitle(res.data.title);
      setEditDesc(res.data.description || '');
    } catch {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    try {
      await taskApi.update(taskId, { title: editTitle.trim(), description: editDesc.trim() || undefined });
      onUpdate();
      fetchTask();
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task || task.status === newStatus) return;
    try {
      await taskApi.update(taskId, { status: newStatus });
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
      onUpdate();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!task) return;
    try {
      await taskApi.update(taskId, { priority: newPriority });
      setTask(prev => prev ? { ...prev, priority: newPriority } : null);
      onUpdate();
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskApi.delete(taskId);
      toast.success('Task deleted');
      onUpdate();
      onClose();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const isOverdue = task?.due_date && task.status !== 'DONE' && new Date(task.due_date) < new Date();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-surface-1 border-l border-glass-border flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-surface-1 border-l border-glass-border overflow-hidden animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">TASK-{task.id}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              task.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
              task.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
              task.status === 'REVIEW' ? 'bg-cyan-500/20 text-cyan-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-glass-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title */}
          <div className="px-4 pt-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-lg font-bold text-white bg-transparent border-none outline-none focus:ring-0 placeholder-slate-500"
              placeholder="Task title..."
            />
          </div>

          {/* Description */}
          <div className="px-4 py-3">
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleSave}
              rows={3}
              className="w-full text-sm text-slate-300 bg-transparent border border-glass-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none placeholder-slate-500 transition-all"
              placeholder="Add a description..."
            />
          </div>

          {/* Quick Actions */}
          <div className="px-4 space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-16 flex-shrink-0">Status</span>
              <div className="flex gap-1.5 flex-wrap">
                {STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleStatusChange(s.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      task.status === s.id
                        ? `${s.color} text-white`
                        : 'bg-surface-0 text-slate-400 hover:text-white hover:bg-glass-white border border-glass-border'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-16 flex-shrink-0">Priority</span>
              <div className="flex gap-1.5 flex-wrap">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePriorityChange(p.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      task.priority === p.id
                        ? `${p.bg} ${p.color}`
                        : 'bg-surface-0 text-slate-400 hover:text-white hover:bg-glass-white border border-glass-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-16 flex-shrink-0">Due</span>
              {task.due_date ? (
                <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                  {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {isOverdue && <span className="text-red-400 font-medium">(overdue)</span>}
                </div>
              ) : (
                <span className="text-xs text-slate-600">No due date</span>
              )}
            </div>

            {/* Labels */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-slate-500 w-16 flex-shrink-0 pt-1">Labels</span>
              <LabelsMultiSelect
                taskId={taskId}
                selectedLabels={task.labels}
                onLabelsChange={(labels) => setTask(prev => prev ? { ...prev, labels } : null)}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 my-4 border-t border-glass-border" />

          {/* Tabs */}
          <div className="px-4">
            <div className="flex gap-1 mb-4 bg-surface-0 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'comments' ? 'gradient-brand text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comments
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'details' ? 'gradient-brand text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Details
              </button>
            </div>

            {activeTab === 'comments' ? (
              <div className="pb-4" style={{ minHeight: 300 }}>
                <CommentsSection taskId={taskId} currentUserId={currentUserId} />
              </div>
            ) : (
              <div className="pb-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-300">{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
                {task.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Updated</span>
                    <span className="text-slate-300">{new Date(task.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Project ID</span>
                  <span className="text-slate-300">{task.project_id}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
