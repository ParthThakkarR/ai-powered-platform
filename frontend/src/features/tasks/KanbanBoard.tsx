import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { taskApi, projectApi, teamApi } from '../../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import {
  Plus, X, Loader2, ArrowLeft, Trash2, Calendar,
  AlertCircle, Clock, GripVertical, Filter, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { TaskDetailPanel } from './TaskDetailPanel';
import { useAuthStore } from '../../stores/authStore';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: number;
  assignee_id: number | null;
  labels?: { id: number; name: string; color: string }[];
}

interface TeamMember {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
}

interface ProjectInfo {
  id: number;
  name: string;
  description: string;
}

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-500', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-500', dotColor: 'bg-amber-400' },
  { id: 'REVIEW', title: 'Review', color: 'bg-cyan-500', dotColor: 'bg-cyan-400' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-500', dotColor: 'bg-emerald-400' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Low' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Medium' },
  HIGH: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'High' },
  URGENT: { color: 'text-red-500', bg: 'bg-red-500/20', label: 'Urgent' },
};

export const KanbanBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Open task from URL query param (e.g., from search)
  useEffect(() => {
    const taskParam = searchParams.get('task');
    if (taskParam) {
      setSelectedTaskId(parseInt(taskParam));
    }
  }, [searchParams]);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formStatus, setFormStatus] = useState('TODO');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssigneeId, setFormAssigneeId] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [tasksRes, projectRes] = await Promise.all([
        taskApi.listByProject(parseInt(projectId)),
        projectApi.get(parseInt(projectId)),
      ]);
      setTasks(tasksRes.data);
      setProject(projectRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load board data.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    teamApi.listMembers().then(res => setTeamMembers(res.data)).catch(() => {});
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const taskId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await taskApi.update(taskId, { status: newStatus });
      toast.success(`Task moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`);
    } catch (err) {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
      toast.error('Failed to update task status.');
    }
  };

  const openCreateModal = (status: string = 'TODO') => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('MEDIUM');
    setFormStatus(status);
    setFormDueDate('');
    setFormAssigneeId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload: any = {
        title: formTitle,
        description: formDesc ? formDesc : null,
        priority: formPriority,
        status: formStatus,
        due_date: formDueDate ? `${formDueDate}T00:00:00Z` : null,
        assignee_id: formAssigneeId,
      };

      if (editingTask) {
        await taskApi.update(editingTask.id, payload);
        toast.success('Task updated!');
      } else {
        payload.project_id = parseInt(projectId!);
        await taskApi.create(payload);
        toast.success('Task created!');
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error(editingTask ? 'Failed to update task.' : 'Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (taskId: number, taskTitle: string) => {
    if (!confirm(`Delete task "${taskTitle}"?`)) return;
    try {
      await taskApi.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted.');
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = filterPriority === 'ALL'
    ? tasks
    : tasks.filter(t => t.priority === filterPriority);

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectAllTasks = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBulkMove = async (newStatus: string) => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    // Optimistic update
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: newStatus } : t));
    try {
      await Promise.all(ids.map(id => taskApi.update(id, { status: newStatus })));
      toast.success(`${ids.length} task(s) moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`);
      setSelectedTaskIds(new Set());
    } catch {
      fetchTasks();
      toast.error('Failed to move tasks');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} task(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(ids.map(id => taskApi.delete(id)));
      setTasks(prev => prev.filter(t => !ids.includes(t.id)));
      toast.success(`${ids.length} task(s) deleted`);
      setSelectedTaskIds(new Set());
    } catch {
      fetchTasks();
      toast.error('Failed to delete tasks');
    }
  };

  if (loading) {
    return (
      <div className="p-8 h-full bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-surface-0 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-glass-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{project?.name || 'Project Board'}</h1>
            {project?.description && (
              <p className="text-sm text-slate-400 mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Filter */}
          <div className="relative">
            <select
              id="priority-filter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 rounded-xl bg-surface-1 border border-glass-border text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          {/* Bulk Mode Toggle */}
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedTaskIds(new Set()); }}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              bulkMode
                ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                : 'bg-surface-1 border border-glass-border text-slate-300 hover:text-white'
            }`}
          >
            {bulkMode ? 'Exit Select' : 'Select'}
          </button>

          <Link
            to={`/projects/${projectId}/sprints`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-1 border border-glass-border text-slate-300 hover:text-white transition-all text-sm font-semibold"
          >
            <Target className="w-4 h-4" />
            Sprints
          </Link>

          <button
            id="add-task-btn"
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 gradient-brand text-white px-4 py-2 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && selectedTaskIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20 flex-shrink-0">
          <span className="text-sm text-brand-primary font-semibold">{selectedTaskIds.size} selected</span>
          <button onClick={selectAllTasks} className="text-xs text-slate-400 hover:text-white transition-colors">
            {selectedTaskIds.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="flex-1" />
          <span className="text-xs text-slate-500">Move to:</span>
          {COLUMNS.map(c => (
            <button
              key={c.id}
              onClick={() => handleBulkMove(c.id)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all bg-surface-1 border border-glass-border text-slate-300 hover:text-white hover:bg-glass-white`}
            >
              {c.title}
            </button>
          ))}
          <button
            onClick={handleBulkDelete}
            className="text-xs px-2.5 py-1 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            Delete
          </button>
        </div>
      )}

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(t => t.status === column.id);

            return (
              <div key={column.id} className="flex flex-col bg-surface-1/50 rounded-2xl min-w-[300px] w-[300px] flex-shrink-0 border border-glass-border">
                {/* Column Header */}
                <div className="p-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                    <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-glass-white text-xs font-medium text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreateModal(column.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-glass-white transition-all"
                    title={`Add task to ${column.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 px-3 pb-3 overflow-y-auto space-y-2.5 min-h-[100px] transition-colors rounded-b-2xl ${
                        snapshot.isDraggingOver ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => {
                        const pConfig = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                        const overdue = isOverdue(task.due_date, task.status);

                        return (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-surface-1 p-4 rounded-xl border transition-all group ${
                                  snapshot.isDragging
                                    ? 'border-brand-primary shadow-lg shadow-brand-primary/10 rotate-1'
                                    : 'border-glass-border hover:border-surface-3'
                                } ${overdue ? 'border-l-2 border-l-red-500' : ''}`}
                              >
                                {/* Drag Handle + Actions */}
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {bulkMode ? (
                                      <input
                                        type="checkbox"
                                        checked={selectedTaskIds.has(task.id)}
                                        onChange={() => toggleTaskSelection(task.id)}
                                        className="w-4 h-4 rounded border-glass-border text-brand-primary focus:ring-brand-primary/50 bg-surface-0 cursor-pointer"
                                      />
                                    ) : (
                                      <div
                                        {...provided.dragHandleProps}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-600 mt-0.5"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                    )}
                                    <h4
                                      className="font-medium text-white text-sm truncate cursor-pointer hover:text-brand-primary transition-colors"
                                      onClick={() => !bulkMode && setSelectedTaskId(task.id)}
                                    >
                                      {task.title}
                                    </h4>
                                  </div>
                                  {!bulkMode && (
                                    <button
                                      onClick={() => handleDelete(task.id, task.title)}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Description */}
                                {task.description && (
                                  <p className="text-xs text-slate-500 mb-3 line-clamp-2 pl-6">
                                    {task.description}
                                  </p>
                                )}

                                {/* Footer: Priority + Due Date + Assignee */}
                                <div className="flex items-center justify-between pl-6">
                                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${pConfig.bg} ${pConfig.color}`}>
                                    {pConfig.label}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {task.due_date && (
                                      <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                                        {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                    )}
                                    {task.assignee_id && (
                                      <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center" title={`Assigned to user #${task.assignee_id}`}>
                                        <span className="text-[9px] font-bold text-brand-primary">
                                          U{task.assignee_id}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Create/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay">
          <div className="bg-surface-1 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-glass-border modal-content">
            <div className="flex justify-between items-center p-6 border-b border-glass-border">
              <h2 className="text-lg font-bold text-white">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-glass-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
                  placeholder="e.g. Implement user authentication"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  id="task-desc-input"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm resize-none"
                  placeholder="Describe the task requirements..."
                />
              </div>

              {/* Priority + Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                  <select
                    id="task-priority-select"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none cursor-pointer"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    id="task-status-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none cursor-pointer"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="task-due-date"
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none"
                  />
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assignee</label>
                <select
                  id="task-assignee-select"
                  value={formAssigneeId ?? ''}
                  onChange={(e) => setFormAssigneeId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.user_name || m.user_email}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-glass-border text-slate-300 font-semibold hover:bg-glass-white transition text-sm"
                >
                  Cancel
                </button>
                <button
                  id="task-submit-btn"
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingTask ? (
                    'Update Task'
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Panel */}
      {selectedTaskId && user && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchTasks}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};
