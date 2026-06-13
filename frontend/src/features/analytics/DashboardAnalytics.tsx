import { useEffect, useState } from 'react';
import { analyticsApi } from '../../services/api';
import { BarChart3, Target, LayoutTemplate, Activity, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  total_projects: number;
  total_tasks: number;
  task_breakdown: Record<string, number>;
  completion_rate: number;
}

const statusColors: Record<string, { bar: string; dot: string; label: string }> = {
  TODO: { bar: 'from-slate-500 to-slate-400', dot: 'bg-slate-400', label: 'To Do' },
  IN_PROGRESS: { bar: 'from-amber-500 to-orange-400', dot: 'bg-amber-400', label: 'In Progress' },
  REVIEW: { bar: 'from-cyan-500 to-blue-400', dot: 'bg-cyan-400', label: 'In Review' },
  DONE: { bar: 'from-emerald-500 to-teal-400', dot: 'bg-emerald-400', label: 'Done' },
};

export const DashboardAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsApi.get();
      setData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-1 rounded-2xl border border-glass-border p-6">
              <div className="skeleton h-5 w-5 mb-3" />
              <div className="skeleton h-8 w-16 mb-1" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (data.completion_rate / 100) * circumference;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Platform Analytics</h1>
        <p className="text-slate-400">Real-time insights into your engineering workflow.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Projects',
            value: data.total_projects,
            icon: LayoutTemplate,
            gradient: 'from-indigo-500/20 to-violet-500/20',
            iconColor: 'text-indigo-400',
            iconBg: 'bg-indigo-500/10',
          },
          {
            label: 'Total Tasks',
            value: data.total_tasks,
            icon: BarChart3,
            gradient: 'from-violet-500/20 to-purple-500/20',
            iconColor: 'text-violet-400',
            iconBg: 'bg-violet-500/10',
          },
          {
            label: 'Completion Rate',
            value: `${data.completion_rate}%`,
            icon: Target,
            gradient: 'from-emerald-500/20 to-teal-500/20',
            iconColor: 'text-emerald-400',
            iconBg: 'bg-emerald-500/10',
          },
          {
            label: 'Active Tasks',
            value: (data.task_breakdown['TODO'] || 0) + (data.task_breakdown['IN_PROGRESS'] || 0),
            icon: Activity,
            gradient: 'from-amber-500/20 to-orange-500/20',
            iconColor: 'text-amber-400',
            iconBg: 'bg-amber-500/10',
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 border border-glass-border animate-slide-up`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Ring */}
        <div className="bg-surface-1 rounded-2xl border border-glass-border p-6 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 self-start">Completion</h2>
          <div className="relative w-36 h-36 mb-4">
            <svg className="completion-ring w-full h-full" viewBox="0 0 128 128">
              {/* Background ring */}
              <circle
                cx="64" cy="64" r="58"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <circle
                cx="64" cy="64" r="58"
                fill="none"
                stroke="url(#completion-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
              <defs>
                <linearGradient id="completion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{data.completion_rate}%</span>
              <span className="text-xs text-slate-500">Complete</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium">{data.task_breakdown['DONE'] || 0} of {data.total_tasks} tasks done</span>
          </div>
        </div>

        {/* Task Breakdown */}
        <div className="lg:col-span-2 bg-surface-1 rounded-2xl border border-glass-border p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Task Breakdown</h2>
          <div className="space-y-5">
            {Object.entries(data.task_breakdown).map(([status, count]) => {
              const config = statusColors[status] || statusColors.TODO;
              const percentage = data.total_tasks > 0 ? Math.round((count / data.total_tasks) * 100) : 0;

              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                      <span className="text-sm font-medium text-slate-300">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{count}</span>
                      <span className="text-xs text-slate-500 w-10 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${config.bar} transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {data.total_tasks === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">No tasks yet. Create a project and start adding tasks to see analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
