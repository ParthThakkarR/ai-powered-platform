import { useState, useEffect } from 'react';
import { activityApi } from '../../services/api';
import { toast } from 'sonner';
import {
  Activity, User, Folder, CheckSquare, MessageSquare,
  UserPlus, Settings, Loader2,
} from 'lucide-react';

interface ActivityEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  created_at: string | null;
  user_name: string | null;
}

const actionConfig: Record<string, { icon: typeof Activity; color: string; bg: string; label: string }> = {
  TASK_CREATED: { icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Created task' },
  TASK_UPDATED: { icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Updated task' },
  TASK_COMPLETED: { icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed task' },
  COMMENT_ADDED: { icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Added comment' },
  MEMBER_INVITED: { icon: UserPlus, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Invited member' },
  PROJECT_CREATED: { icon: Folder, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Created project' },
  PROJECT_UPDATED: { icon: Folder, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Updated project' },
  ASSIGNEE_CHANGED: { icon: User, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Reassigned task' },
  STATUS_CHANGED: { icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Changed status' },
};

const getDefaultConfig = (action: string) => ({
  icon: Activity,
  color: 'text-slate-400',
  bg: 'bg-slate-500/10',
  label: action.replace(/_/g, ' ').toLowerCase(),
});

export const ActivityLog = () => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await activityApi.list({ limit: 50 });
      setActivities(res.data);
    } catch {
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Activity Log</h1>
        <p className="text-slate-400">Recent actions across your projects.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 bg-surface-1 rounded-2xl border border-glass-border">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-glass-border" />

          <div className="space-y-1">
            {activities.map((entry) => {
              const config = actionConfig[entry.action] || getDefaultConfig(entry.action);
              const Icon = config.icon;

              return (
                <div key={entry.id} className="relative flex items-start gap-4 py-3 px-2 rounded-xl hover:bg-surface-1/50 transition-colors group">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 border border-glass-border`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-white">{entry.user_name || `User #${entry.user_id}`}</span>
                      {' '}
                      <span className={config.color}>{config.label}</span>
                      {entry.entity_type && (
                        <span className="text-slate-500">
                          {' '}{entry.entity_type.toLowerCase()}
                          {entry.entity_id && <span className="text-slate-600"> #{entry.entity_id}</span>}
                        </span>
                      )}
                    </p>
                    {entry.details && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{entry.details}</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-xs text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors">
                    {formatTime(entry.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
