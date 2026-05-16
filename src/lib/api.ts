/**
 * API client — all calls to the backend go through here.
 * Base URL is set via VITE_API_URL env variable.
 * Falls back to localhost:4000 for local dev.
 */

const BASE = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  return localStorage.getItem('tf_token');
}

export function setToken(token: string) {
  localStorage.setItem('tf_token', token);
}

export function clearToken() {
  localStorage.removeItem('tf_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (name: string, email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: ApiUser }>('/api/auth/me'),

  updateProfile: (data: { name?: string; jobTitle?: string }) =>
    request<{ user: ApiUser }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => request<ApiProject[]>('/api/projects'),

  get: (id: string) => request<ApiProject>(`/api/projects/${id}`),

  create: (data: {
    name: string; description?: string; color?: string;
    dueDate?: string | null; memberIds?: string[];
  }) => request<ApiProject>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<{
    name: string; description: string; status: string; color: string; dueDate: string | null;
  }>) => request<ApiProject>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) => request<{ message: string }>(`/api/projects/${id}`, { method: 'DELETE' }),

  addMember: (projectId: string, userId: string) =>
    request<ApiProject>(`/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeMember: (projectId: string, userId: string) =>
    request<ApiProject>(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (params?: { projectId?: string; status?: string; priority?: string }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)) as Record<string, string>
    ).toString() : '';
    return request<ApiTask[]>(`/api/tasks${qs}`);
  },

  get: (id: string) => request<ApiTask>(`/api/tasks/${id}`),

  create: (data: {
    title: string; description?: string; status?: string; priority?: string;
    assigneeId?: string | null; projectId: string; dueDate?: string | null; tags?: string[];
  }) => request<ApiTask>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<{
    title: string; description: string; status: string; priority: string;
    assigneeId: string | null; dueDate: string | null; tags: string[];
  }>) => request<ApiTask>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) => request<{ message: string }>(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => request<ApiTeamMember[]>('/api/users'),
  listAll: () => request<ApiTeamMember[]>('/api/users?all=true'),
  get: (id: string) => request<ApiTeamMember>(`/api/users/${id}`),
  updateRole: (id: string, role: 'admin' | 'project_lead' | 'quality_reviewer' | 'tasker') =>
    request<ApiTeamMember>(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => request<ApiDashboard>('/api/dashboard'),
};

// ─── Remarks ─────────────────────────────────────────────────────────────────

export const remarksApi = {
  list: (params?: { taskId?: string; projectId?: string }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)) as Record<string, string>
    ).toString() : '';
    return request<ApiRemark[]>(`/api/remarks${qs}`);
  },
  create: (data: { taskId: string; content: string; type?: string }) =>
    request<ApiRemark>('/api/remarks', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/remarks/${id}`, { method: 'DELETE' }),
};

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return request<ApiAttendance[]>(`/api/attendance${qs}`);
  },
  status: () => request<{ punchedIn: boolean; record: { id: string; punchIn: string } | null }>('/api/attendance/status'),
  punchIn: () => request<ApiPunchResponse>('/api/attendance/punch-in', { method: 'POST' }),
  punchOut: () => request<ApiPunchResponse>('/api/attendance/punch-out', { method: 'POST' }),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'project_lead' | 'quality_reviewer' | 'tasker';
  jobTitle: string;
  createdAt: string;
}

export interface ApiTeamMember extends ApiUser {
  tasksAssigned: number;
  tasksCompleted: number;
  status: 'online' | 'offline' | 'away';
  joinDate: string;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  progress: number;
  color: string;
  dueDate: string | null;
  taskCount: number;
  completedTasks: number;
  createdAt: string;
  creator: { id: string; name: string };
  members: ApiUser[];
}

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assignee: ApiUser | null;
  creator: ApiUser;
}

export interface ApiDashboard {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  backlogTasks: number;
  inReviewTasks: number;
  overdueTasks: number;
  totalProjects: number;
  totalMembers: number;
  tasksByStatus: Record<string, number>;
  tasksPerUser: { userId: string; name: string; count: number }[];
  recentActivities: {
    id: string; action: string; target: string; type: string;
    createdAt: string;
    user: { id: string; name: string; avatar: string };
  }[];
}

export interface ApiRemark {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
  author: { id: string; name: string; avatar: string; role: string };
}

export interface ApiAttendance {
  id: string;
  punchIn: string;
  punchOut: string | null;
  hours: number | null;
  userId: string;
  user: { id: string; name: string; avatar: string; role: string };
}

export interface ApiPunchResponse {
  id: string;
  punchIn: string;
  punchOut: string | null;
  hours: number | null;
  message: string;
}
