import React, { useEffect, useState } from 'react';
import { projectApi, taskApi, orgApi } from '../../services/api';
import { Link } from 'react-router-dom';
import { Folder, Plus, X, Loader2, Trash2, BarChart3, CheckCircle, Clock, AlertTriangle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '../../hooks/useUserRole';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  organization_id: number;
}

interface TaskSummary {
  total: number;
  done: number;
  in_progress: number;
  overdue: number;
}

export const ProjectDashboard = () => {
  const { canEdit, canDelete } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [taskSummaries, setTaskSummaries] = useState<Record<number, TaskSummary>>({});

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDescription] = useState('');

  // Edit Project Form State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.list();
      setProjects(response.data);

      // Fetch task summaries for each project
      const summaries: Record<number, TaskSummary> = {};
      await Promise.all(
        response.data.map(async (project: Project) => {
          try {
            const tasksRes = await taskApi.listByProject(project.id);
            const tasks = tasksRes.data;
            const now = new Date();
            summaries[project.id] = {
              total: tasks.length,
              done: tasks.filter((t: any) => t.status === 'DONE').length,
              in_progress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
              overdue: tasks.filter((t: any) => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length,
            };
          } catch {
            summaries[project.id] = { total: 0, done: 0, in_progress: 0, overdue: 0 };
          }
        })
      );
      setTaskSummaries(summaries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ensureOrgExists = async (): Promise<number> => {
    try {
      const orgsRes = await orgApi.list();
      if (orgsRes.data.length > 0) return orgsRes.data[0].id;
      const newOrg = await orgApi.create({ name: 'Default Organization', description: 'Auto-created organization' });
      return newOrg.data.id;
    } catch {
      return 1;
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const orgId = await ensureOrgExists();
      await projectApi.create({
        name: newName,
        description: newDesc,
        organization_id: orgId,
        status: 'ACTIVE'
      });
      setNewName('');
      setNewDescription('');
      setIsModalOpen(false);
      toast.success('Project created successfully!');
      fetchProjects();
    } catch (err) {
      console.error("Failed to create project", err);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(project.description || '');
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;
    setUpdating(true);
    try {
      await projectApi.update(editingProject.id, { name: editName.trim(), description: editDesc.trim() || undefined });
      toast.success('Project updated!');
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to update project.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: number, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${projectName}" and all its tasks? This cannot be undone.`)) return;

    try {
      await projectApi.delete(projectId);
      toast.success(`Project "${projectName}" deleted.`);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project.');
    }
  };

  const getHealthColor = (summary: TaskSummary) => {
    if (!summary || summary.total === 0) return 'border-surface-2';
    if (summary.overdue > 0) return 'border-red-500/50';
    if (summary.done / summary.total > 0.7) return 'border-emerald-500/50';
    return 'border-amber-500/50';
  };

  const getProgress = (summary: TaskSummary) => {
    if (!summary || summary.total === 0) return 0;
    return Math.round((summary.done / summary.total) * 100);
  };

  // Aggregate stats
  const totalTasks = Object.values(taskSummaries).reduce((a, s) => a + s.total, 0);
  const totalDone = Object.values(taskSummaries).reduce((a, s) => a + s.done, 0);
  const totalInProgress = Object.values(taskSummaries).reduce((a, s) => a + s.in_progress, 0);
  const totalOverdue = Object.values(taskSummaries).reduce((a, s) => a + s.overdue, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
          <p className="text-slate-400">Manage your engineering workflows and team goals.</p>
        </div>
        {canEdit && (
          <button
            id="new-project-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 gradient-brand text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Stat Cards */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: totalTasks, icon: BarChart3, gradient: 'from-indigo-500/20 to-violet-500/20', iconColor: 'text-indigo-400' },
            { label: 'In Progress', value: totalInProgress, icon: Clock, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
            { label: 'Completed', value: totalDone, icon: CheckCircle, gradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
            { label: 'Overdue', value: totalOverdue, icon: AlertTriangle, gradient: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-400' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 border border-glass-border`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-1 rounded-2xl border border-glass-border p-6">
              <div className="skeleton h-6 w-3/4 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-1/2 mb-6" />
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Project Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => {
            const summary = taskSummaries[project.id] || { total: 0, done: 0, in_progress: 0, overdue: 0 };
            const progress = getProgress(summary);

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}/board`}
                className={`group bg-surface-1 p-6 rounded-2xl border-l-4 ${getHealthColor(summary)} border border-glass-border hover:border-brand-primary/50 transition-all card-lift animate-slide-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:gradient-brand group-hover:text-white transition-all">
                      <Folder className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{project.name}</h2>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {canEdit && (
                      <button
                        onClick={(e) => openEditModal(e, project)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                        title="Edit project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-5 line-clamp-2 min-h-[40px]">
                  {project.description || 'No description provided.'}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className="text-xs font-semibold text-white">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-success transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{summary.total} tasks</span>
                    {summary.in_progress > 0 && <span className="text-amber-400">• {summary.in_progress} active</span>}
                  </div>
                  <span className="text-xs text-slate-500 font-medium group-hover:text-brand-primary transition-colors">
                    Open →
                  </span>
                </div>
              </Link>
            );
          })}

          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center bg-surface-1 rounded-2xl border-2 border-dashed border-surface-2">
              <div className="mx-auto w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mb-4">
                <Folder className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-6">Create your first project to start optimizing your workflow.</p>
              {canEdit && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-secondary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay">
          <div className="bg-surface-1 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-glass-border modal-content">
            <div className="flex justify-between items-center p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-glass-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input
                  id="edit-project-name-input"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  id="edit-project-desc-input"
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm resize-none"
                  placeholder="Describe the project..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-glass-border text-slate-300 font-semibold hover:bg-glass-white transition text-sm"
                >
                  Cancel
                </button>
                <button
                  id="edit-project-submit"
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm"
                >
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay">
          <div className="bg-surface-1 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-glass-border modal-content">
            <div className="flex justify-between items-center p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-glass-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input
                  id="project-name-input"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
                  placeholder="e.g. E-commerce API"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  id="project-desc-input"
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm resize-none"
                  placeholder="Briefly describe the goals of this project..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-glass-border text-slate-300 font-semibold hover:bg-glass-white transition text-sm"
                >
                  Cancel
                </button>
                <button
                  id="create-project-submit"
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
