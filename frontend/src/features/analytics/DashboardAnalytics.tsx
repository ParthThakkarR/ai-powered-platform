import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BarChart3, Target, LayoutTemplate, Activity } from 'lucide-react';

interface AnalyticsData {
  total_projects: number;
  total_tasks: number;
  task_breakdown: Record<string, number>;
  completion_rate: number;
}

export const DashboardAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/');
      setData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Projects</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_projects}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-purple-50 rounded-lg text-purple-600 mr-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_tasks}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-green-50 rounded-lg text-green-600 mr-4">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{data.completion_rate}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-orange-50 rounded-lg text-orange-600 mr-4">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {(data.task_breakdown['TODO'] || 0) + (data.task_breakdown['IN_PROGRESS'] || 0)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Breakdown</h2>
        <div className="space-y-4">
          {Object.entries(data.task_breakdown).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-gray-600">{status}</span>
                <span className="text-gray-900">{count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: `${(count / data.total_tasks) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
