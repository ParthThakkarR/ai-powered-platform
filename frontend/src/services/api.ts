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

// ===== Comments API =====
export const commentApi = {
  listByTask: (taskId: number, skip = 0, limit = 50) =>
    api.get(`/tasks/${taskId}/comments`, { params: { skip, limit } }),
  create: (taskId: number, content: string) =>
    api.post(`/tasks/${taskId}/comments`, { content }),
  delete: (commentId: number) => api.delete(`/tasks/comments/${commentId}`),
};

// ===== Labels API =====
export const labelApi = {
  list: () => api.get('/labels/'),
  create: (data: { name: string; color: string }) => api.post('/labels/', data),
  delete: (labelId: number) => api.delete(`/labels/${labelId}`),
  addToTask: (taskId: number, labelId: number) =>
    api.post(`/labels/tasks/${taskId}/labels/${labelId}`),
  removeFromTask: (taskId: number, labelId: number) =>
    api.delete(`/labels/tasks/${taskId}/labels/${labelId}`),
};

// ===== Search API =====
export const searchApi = {
  search: (params: { q?: string; status?: string; priority?: string; project_id?: number; limit?: number }) =>
    api.get('/search/', { params }),
};

// ===== Teams API =====
export const teamApi = {
  listMembers: () => api.get('/teams/members'),
  invite: (data: { email: string; role: string }) => api.post('/teams/invite', data),
  updateRole: (memberId: number, role: string) => api.put(`/teams/members/${memberId}`, { role }),
  removeMember: (memberId: number) => api.delete(`/teams/members/${memberId}`),
};

// ===== Notifications API =====
export const notificationApi = {
  list: (params?: { unread_only?: boolean; limit?: number }) =>
    api.get('/notifications/', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (notifId: number) => api.put(`/notifications/${notifId}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ===== Analytics API =====
export const analyticsApi = {
  get: () => api.get('/analytics/'),
  getProject: (projectId: number) => api.get(`/analytics/project/${projectId}`),
  getBurndown: (sprintId: number) => api.get(`/analytics/sprint/${sprintId}/burndown`),
  getVelocity: (sprintId: number) => api.get(`/analytics/sprint/${sprintId}/velocity`),
};

// ===== Activity API =====
export const activityApi = {
  list: (params?: { project_id?: number; task_id?: number; limit?: number }) =>
    api.get('/activity/', { params }),
};

// ===== User Profile API =====
export const userProfileApi = {
  get: () => api.get('/auth/me'),
  update: (data: { full_name?: string; email?: string; password?: string }) =>
    api.put('/auth/me', data),
};

// ===== Password Reset API =====
export const passwordResetApi = {
  forgot: (email: string) => api.post('/auth/forgot-password', { email }),
  reset: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, new_password: newPassword }),
};

// ===== Google Auth API =====
export const googleAuthApi = {
  login: (data: { id_token: string }) =>
    api.post('/auth/google-login', data),
};

// ===== GitHub Auth API =====
export const githubAuthApi = {
  login: (code: string) =>
    api.post('/auth/github', { code }),
};

// ===== Sprint API =====
export const sprintApi = {
  listByProject: (projectId: number) => api.get(`/sprints/project/${projectId}`),
  create: (projectId: number, data: { name: string; goal?: string; start_date: string; end_date: string; is_active?: boolean }) =>
    api.post(`/sprints/project/${projectId}`, data),
  update: (sprintId: number, data: { name?: string; goal?: string; start_date?: string; end_date?: string; is_active?: boolean }) =>
    api.put(`/sprints/${sprintId}`, data),
  delete: (sprintId: number) => api.delete(`/sprints/${sprintId}`),
  addTask: (sprintId: number, taskId: number) => api.post(`/sprints/${sprintId}/tasks/${taskId}`),
  removeTask: (sprintId: number, taskId: number) => api.delete(`/sprints/${sprintId}/tasks/${taskId}`),
};

// ===== Attachment API =====
export const attachmentApi = {
  listByTask: (taskId: number) => api.get(`/attachments/task/${taskId}`),
  upload: (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/attachments/task/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (attachmentId: number) => {
    const token = localStorage.getItem('token');
    window.open(
      `${api.defaults.baseURL}/attachments/download/${attachmentId}?token=${token}`,
      '_blank'
    );
  },
  delete: (attachmentId: number) => api.delete(`/attachments/${attachmentId}`),
};

// ===== Subtask API =====
export const subtaskApi = {
  listByTask: (taskId: number) => api.get(`/subtasks/task/${taskId}`),
  create: (taskId: number, data: { title: string; position?: number }) =>
    api.post(`/subtasks/task/${taskId}`, data),
  update: (subtaskId: number, data: { title?: string; is_completed?: boolean; position?: number }) =>
    api.put(`/subtasks/${subtaskId}`, data),
  delete: (subtaskId: number) => api.delete(`/subtasks/${subtaskId}`),
};
