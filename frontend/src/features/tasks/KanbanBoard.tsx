import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

const COLUMNS = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

export const KanbanBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      setTasks(response.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading tasks...</div>;

  return (
    <div className="p-8 h-screen flex flex-col bg-gray-50 overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Project Board (Static View)</h1>
      
      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col bg-gray-100 rounded-lg min-w-[320px] max-w-[320px]">
            <div className="p-4 font-semibold text-gray-700 border-b border-gray-200">
              {column.title}
              <span className="ml-2 text-sm text-gray-500">
                ({tasks.filter(t => t.status === column.id).length})
              </span>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {tasks
                .filter(t => t.status === column.id)
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 mb-3 rounded shadow-sm border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded font-medium 
                        ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
