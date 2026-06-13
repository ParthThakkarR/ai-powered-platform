import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      console.error("----- EXACT 422 ERROR FROM BACKEND -----");
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error("PAYLOAD SENT:", error.config.data);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== Organization API =====
export const orgApi = {
  list: () => api.get('/orgs/'),
  get: (orgId: number) => api.get(`/orgs/${orgId}`),
  create: (data: { name: string; description?: string }) => api.post('/orgs/', data),
  update: (orgId: number, data: { name?: string; description?: string }) => api.put(`/orgs/${orgId}`, data),
  delete: (orgId: number) => api.delete(`/orgs/${orgId}`),
};

// ===== Project API =====
export const projectApi = {
  list: () => api.get('/projects/'),
  get: (projectId: number) => api.get(`/projects/${projectId}`),
  create: (data: { name: string; description?: string; organization_id: number; status?: string }) =>
    api.post('/projects/', data),
  update: (projectId: number, data: { name?: string; description?: string; status?: string }) =>
    api.put(`/projects/${projectId}`, data),
  delete: (projectId: number) => api.delete(`/projects/${projectId}`),
};

// ===== Task API =====
export const taskApi = {
  listByProject: (projectId: number) => api.get(`/tasks/project/${projectId}`),
  get: (taskId: number) => api.get(`/tasks/${taskId}`),
  create: (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    project_id: number;
    assignee_id?: number;
    due_date?: string;
  }) => api.post('/tasks/', data),
  update: (taskId: number, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: number;
    due_date?: string;
  }) => api.put(`/tasks/${taskId}`, data),
  delete: (taskId: number) => api.delete(`/tasks/${taskId}`),
};

// ===== AI API =====
export const aiApi = {
  generateTasks: (projectId: number, description: string) =>
    api.post('/ai/generate-tasks', { project_id: projectId, description }),
  analyzeBug: (errorLog: string) =>
    api.post('/ai/analyze-bug', { error_log: errorLog }),
  getStatus: (taskId: string) => api.get(`/ai/status/${taskId}`),
};

// ===== Analytics API =====
export const analyticsApi = {
  get: () => api.get('/analytics/'),
};
