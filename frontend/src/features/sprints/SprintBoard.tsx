import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { sprintApi, analyticsApi } from '../../services/api';
import { toast } from 'sonner';
import {
  Plus, X, Loader2, Calendar, Target, BarChart3,
  Trash2, Play, Pause, CheckCircle, Clock,
} from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';

interface Sprint {
  id: number;
  project_id: number;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface BurndownData {
  total_tasks: number;
  done: number;
  in_progress: number;
  todo: number;
  review: number;
  remaining: number;
  ideal_remaining: number;
  progress_pct: number;
  velocity: number;
  days_total: number;
  days_elapsed: number;
}

export const SprintBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { canEdit, canDelete } = useUserRole();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [burndown, setBurndown] = useState<BurndownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formName, setFormName] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await sprintApi.listByProject(parseInt(projectId));
      setSprints(res.data);
      const active = res.data.find((s: Sprint) => s.is_active);
      if (active) setSelectedSprint(active);
      else if (res.data.length > 0) setSelectedSprint(res.data[0]);
    } catch {
      toast.error('Failed to load sprints');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  useEffect(() => {
    if (selectedSprint) {
      analyticsApi.getBurndown(selectedSprint.id).then(res => setBurndown(res.data)).catch(() => setBurndown(null));
    }
  }, [selectedSprint]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !formName.trim() || !formStart || !formEnd) return;
    setCreating(true);
    try {
      await sprintApi.create(parseInt(projectId), {
        name: formName.trim(),
        goal: formGoal.trim() || undefined,
        start_date: `${formStart}T00:00:00Z`,
        end_date: `${formEnd}T23:59:59Z`,
      });
      toast.success('Sprint created!');
      setShowCreate(false);
      setFormName('');
      setFormGoal('');
      setFormStart('');
      setFormEnd('');
      fetchSprints();
    } catch {
      toast.error('Failed to create sprint');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (sprint: Sprint) => {
    try {
      await sprintApi.update(sprint.id, { is_active: !sprint.is_active });
      fetchSprints();
    } catch {
      toast.error('Failed to update sprint');
    }
  };

  const handleDelete = async (sprint: Sprint) => {
    if (!confirm(`Delete sprint "${sprint.name}"?`)) return;
    try {
      await sprintApi.delete(sprint.id);
      if (selectedSprint?.id === sprint.id) setSelectedSprint(null);
      fetchSprints();
      toast.success('Sprint deleted');
    } catch {
      toast.error('Failed to delete sprint');
    }
  };

  const isUpcoming = (s: Sprint) => new Date(s.start_date) > new Date();
  const isActive = (s: Sprint) => s.is_active;
  const isCompleted = (s: Sprint) => new Date(s.end_date) < new Date() && !s.is_active;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Sprints</h1>
          <p className="text-slate-400">Manage sprints and track burndown progress.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 gradient-brand text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> New Sprint
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-20 bg-surface-1 rounded-2xl border-2 border-dashed border-surface-2">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No sprints yet</h3>
          <p className="text-slate-400 mb-6">Create your first sprint to start tracking progress.</p>
          {canEdit && (
            <button onClick={() => setShowCreate(true)} className="text-brand-primary font-semibold hover:text-brand-secondary">
              <Plus className="w-4 h-4 inline mr-1" /> Create Sprint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sprint List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Sprints</h2>
            {sprints.map(sprint => (
              <div
                key={sprint.id}
                onClick={() => setSelectedSprint(sprint)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedSprint?.id === sprint.id
                    ? 'bg-brand-primary/10 border-brand-primary/30'
                    : 'bg-surface-1 border-glass-border hover:border-surface-3'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm">{sprint.name}</h3>
                  <div className="flex items-center gap-1">
                    {isActive(sprint) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">Active</span>}
                    {isUpcoming(sprint) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Upcoming</span>}
                    {isCompleted(sprint) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-medium">Done</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                {sprint.goal && <p className="text-xs text-slate-500 mt-2 line-clamp-1">{sprint.goal}</p>}
                <div className="flex items-center gap-2 mt-3">
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleActivate(sprint); }}
                      className={`p-1 rounded-lg text-xs transition-all ${sprint.is_active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                      title={sprint.is_active ? 'Pause' : 'Activate'}
                    >
                      {sprint.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(sprint); }}
                      className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Burndown / Stats */}
          <div className="lg:col-span-2">
            {selectedSprint && burndown ? (
              <div className="bg-surface-1 rounded-2xl border border-glass-border p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-primary" />
                  {selectedSprint.name} — Burndown
                </h2>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total', value: burndown.total_tasks, icon: Target, color: 'text-indigo-400' },
                    { label: 'Done', value: burndown.done, icon: CheckCircle, color: 'text-emerald-400' },
                    { label: 'In Progress', value: burndown.in_progress, icon: Clock, color: 'text-amber-400' },
                    { label: 'Remaining', value: burndown.remaining, icon: Target, color: 'text-red-400' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-surface-0 rounded-xl p-4 border border-glass-border text-center">
                      <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-semibold">{burndown.progress_pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-0 rounded-full overflow-hidden">
                    <div className="h-full rounded-full gradient-brand transition-all" style={{ width: `${burndown.progress_pct}%` }} />
                  </div>
                </div>

                {/* Burndown Chart (CSS-based) */}
                <div className="bg-surface-0 rounded-xl p-4 border border-glass-border">
                  <h3 className="text-sm font-semibold text-white mb-3">Burndown Chart</h3>
                  <div className="flex items-end gap-2 h-40">
                    {/* Ideal line */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full relative">
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-full border-t-2 border-dashed border-slate-600 absolute" style={{
                          height: `${burndown.total_tasks > 0 ? ((burndown.ideal_remaining / burndown.total_tasks) * 100) : 0}%`,
                          bottom: 0,
                        }} />
                      </div>
                      <span className="text-[10px] text-slate-600">Ideal</span>
                    </div>
                    {/* Actual */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="w-full rounded-t-lg gradient-brand transition-all" style={{
                        height: `${burndown.total_tasks > 0 ? ((burndown.remaining / burndown.total_tasks) * 100) : 0}%`,
                        minHeight: burndown.remaining > 0 ? '4px' : '0',
                      }} />
                      <span className="text-[10px] text-slate-400 mt-1">{burndown.remaining}</span>
                    </div>
                    {/* Done */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="w-full rounded-t-lg bg-emerald-500 transition-all" style={{
                        height: `${burndown.total_tasks > 0 ? ((burndown.done / burndown.total_tasks) * 100) : 0}%`,
                        minHeight: burndown.done > 0 ? '4px' : '0',
                      }} />
                      <span className="text-[10px] text-slate-400 mt-1">{burndown.done}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>Day {burndown.days_elapsed}</span>
                    <span>Day {burndown.days_total}</span>
                  </div>
                </div>

                {/* Days Info */}
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                  <span>Days elapsed: <span className="text-white font-semibold">{burndown.days_elapsed}/{burndown.days_total}</span></span>
                  <span>Velocity: <span className="text-white font-semibold">{burndown.velocity} tasks</span></span>
                </div>
              </div>
            ) : selectedSprint ? (
              <div className="bg-surface-1 rounded-2xl border border-glass-border p-6 text-center py-20">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Loading burndown data...</p>
              </div>
            ) : (
              <div className="bg-surface-1 rounded-2xl border border-glass-border p-6 text-center py-20">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Select a sprint to view burndown</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Sprint Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-1 rounded-2xl shadow-2xl w-full max-w-md border border-glass-border">
            <div className="flex justify-between items-center p-6 border-b border-glass-border">
              <h2 className="text-lg font-bold text-white">Create Sprint</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-glass-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sprint Name</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 outline-none text-sm"
                  placeholder="e.g. Sprint 1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goal</label>
                <textarea rows={2} value={formGoal} onChange={e => setFormGoal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 outline-none text-sm resize-none"
                  placeholder="What should this sprint achieve?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input type="date" required value={formStart} onChange={e => setFormStart(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input type="date" required value={formEnd} onChange={e => setFormEnd(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-glass-border text-slate-300 font-semibold hover:bg-glass-white transition text-sm">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
