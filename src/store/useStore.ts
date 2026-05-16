import { create } from 'zustand';
import {
  authApi, projectsApi, tasksApi, usersApi, dashboardApi, remarksApi, attendanceApi,
  setToken, clearToken,
  type ApiUser, type ApiProject, type ApiTask, type ApiTeamMember, type ApiDashboard,
} from '@/lib/api';

// ─── Re-export types used across the app ─────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';
export type UserRole = 'admin' | 'project_lead' | 'quality_reviewer' | 'tasker';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  jobTitle: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: User | null;
  projectId: string;
  dueDate: string | null;
  createdAt: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  members: User[];
  color: string;
  dueDate: string | null;
  taskCount: number;
  completedTasks: number;
}

export interface TeamMember extends User {
  status: 'online' | 'offline' | 'away';
  tasksAssigned: number;
  tasksCompleted: number;
  joinDate: string;
}

export interface Activity {
  id: string;
  user: User;
  action: string;
  target: string;
  timestamp: string;
  type: 'task' | 'project' | 'comment' | 'member';
}

export interface Remark {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
  author: { id: string; name: string; avatar: string; role: string };
}

export interface AttendanceRecord {
  id: string;
  punchIn: string;
  punchOut: string | null;
  hours: number | null;
  userId: string;
  user: { id: string; name: string; avatar: string; role: string };
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type: 'punch_in' | 'punch_out' | 'info';
}

// ─── Helper: map API types to store types ────────────────────────────────────

function mapUser(u: ApiUser): User {
  return { id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, jobTitle: u.jobTitle };
}

function mapProject(p: ApiProject): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as ProjectStatus,
    progress: p.progress,
    members: p.members.map(mapUser),
    color: p.color,
    dueDate: p.dueDate,
    taskCount: p.taskCount,
    completedTasks: p.completedTasks,
  };
}

function mapTask(t: ApiTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as Status,
    priority: t.priority as Priority,
    assignee: t.assignee ? mapUser(t.assignee) : null,
    projectId: t.projectId,
    dueDate: t.dueDate,
    createdAt: t.createdAt,
    tags: t.tags,
  };
}

function mapTeamMember(u: ApiTeamMember): TeamMember {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    jobTitle: u.jobTitle,
    status: u.status,
    tasksAssigned: u.tasksAssigned,
    tasksCompleted: u.tasksCompleted,
    joinDate: u.joinDate,
  };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  initAuth: () => Promise<void>;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCommandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  // Data
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  activities: Activity[];
  remarks: Remark[];
  dashboardData: ApiDashboard | null;

  // Loading states
  projectsLoading: boolean;
  tasksLoading: boolean;
  teamLoading: boolean;

  // Data fetchers
  fetchProjects: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchRemarks: (params?: { taskId?: string; projectId?: string }) => Promise<void>;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'> & { memberIds?: string[] }) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  addMemberToProject: (projectId: string, userId: string) => Promise<void>;
  removeMemberFromProject: (projectId: string, userId: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  addRemark: (data: { taskId: string; content: string; type?: string }) => Promise<void>;
  deleteRemark: (id: string) => Promise<void>;

  // Attendance
  isPunchedIn: boolean;
  punchRecord: { id: string; punchIn: string } | null;
  attendanceRecords: AttendanceRecord[];
  notifications: Notification[];
  fetchAttendanceStatus: () => Promise<void>;
  fetchAttendance: (date?: string) => Promise<void>;
  punchIn: () => Promise<void>;
  punchOut: () => Promise<void>;
  addNotification: (msg: string, type: Notification['type']) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  user: null,
  authLoading: false,

  initAuth: async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) return;
    try {
      const { user } = await authApi.me();
      set({ isAuthenticated: true, user: mapUser(user) });
    } catch {
      clearToken();
    }
  },

  login: async (email, password) => {
    try {
      const { token, user } = await authApi.login(email, password);
      setToken(token);
      set({ isAuthenticated: true, user: mapUser(user) });
      // Kick off data loading
      await Promise.all([
        get().fetchProjects(),
        get().fetchTasks(),
        get().fetchTeamMembers(),
        get().fetchDashboard(),
        get().fetchAttendanceStatus(),
      ]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  },

  logout: () => {
    clearToken();
    set({
      isAuthenticated: false, user: null,
      projects: [], tasks: [], teamMembers: [], activities: [], dashboardData: null,
    });
  },

  signup: async (name, email, password) => {
    try {
      const { token, user } = await authApi.signup(name, email, password);
      setToken(token);
      set({ isAuthenticated: true, user: mapUser(user) });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Signup failed' };
    }
  },

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isCommandOpen: false,
  setCommandOpen: (open) => set({ isCommandOpen: open }),

  // Data
  projects: [],
  tasks: [],
  teamMembers: [],
  activities: [],
  remarks: [],
  dashboardData: null,
  projectsLoading: false,
  tasksLoading: false,
  teamLoading: false,

  // Fetchers
  fetchProjects: async () => {
    set({ projectsLoading: true });
    try {
      const data = await projectsApi.list();
      set({ projects: data.map(mapProject) });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      set({ projectsLoading: false });
    }
  },

  fetchTasks: async () => {
    set({ tasksLoading: true });
    try {
      const data = await tasksApi.list();
      set({ tasks: data.map(mapTask) });
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      set({ tasksLoading: false });
    }
  },

  fetchTeamMembers: async () => {
    set({ teamLoading: true });
    try {
      // Admin/Project Lead sees all users (needed for task assignment); others see only project teammates
      const canSeeAll = ['admin', 'project_lead'].includes(get().user?.role || '');
      const data = canSeeAll ? await usersApi.listAll() : await usersApi.list();
      set({ teamMembers: data.map(mapTeamMember) });
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      set({ teamLoading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const data = await dashboardApi.get();
      // Map activities from dashboard response
      const activities: Activity[] = data.recentActivities.map(a => ({
        id: a.id,
        user: { id: a.user.id, name: a.user.name, email: '', avatar: a.user.avatar, role: 'member' as UserRole, jobTitle: '' },
        action: a.action,
        target: a.target,
        timestamp: a.createdAt,
        type: a.type as Activity['type'],
      }));
      set({ dashboardData: data, activities });
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  },

  fetchRemarks: async (params) => {
    try {
      const data = await remarksApi.list(params);
      set({ remarks: data });
    } catch (err) {
      console.error('Failed to fetch remarks:', err);
    }
  },

  // Actions
  addTask: async (taskData) => {
    try {
      const created = await tasksApi.create({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assigneeId: taskData.assignee?.id ?? null,
        projectId: taskData.projectId,
        dueDate: taskData.dueDate,
        tags: taskData.tags,
      });
      set((state) => ({ tasks: [mapTask(created), ...state.tasks] }));
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const updated = await tasksApi.update(id, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assigneeId: updates.assignee !== undefined ? (updates.assignee?.id ?? null) : undefined,
        dueDate: updates.dueDate,
        tags: updates.tags,
      });
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? mapTask(updated) : t),
      }));
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  },

  deleteTask: async (id) => {
    try {
      await tasksApi.delete(id);
      set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  },

  addProject: async (projectData) => {
    try {
      const created = await projectsApi.create({
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        dueDate: projectData.dueDate,
        memberIds: projectData.memberIds,
      });
      set((state) => ({ projects: [mapProject(created), ...state.projects] }));
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const updated = await projectsApi.update(id, {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        color: updates.color,
        dueDate: updates.dueDate,
      });
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? mapProject(updated) : p),
      }));
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  },

  addMemberToProject: async (projectId, userId) => {
    try {
      const updated = await projectsApi.addMember(projectId, userId);
      if (updated) {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? mapProject(updated) : p),
        }));
      }
    } catch (err) {
      console.error('Failed to add member:', err);
      throw err;
    }
  },

  removeMemberFromProject: async (projectId, userId) => {
    try {
      const updated = await projectsApi.removeMember(projectId, userId);
      if (updated) {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? mapProject(updated) : p),
        }));
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      throw err;
    }
  },

  deleteProject: async (id) => {
    try {
      await projectsApi.delete(id);
      set((state) => ({ projects: state.projects.filter(p => p.id !== id) }));
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      await usersApi.updateRole(userId, role);
      set((state) => ({
        teamMembers: state.teamMembers.map(m =>
          m.id === userId ? { ...m, role } : m
        ),
      }));
    } catch (err) {
      console.error('Failed to update user role:', err);
      throw err;
    }
  },

  addRemark: async (data) => {
    try {
      const created = await remarksApi.create(data);
      set((state) => ({ remarks: [created, ...state.remarks] }));
    } catch (err) {
      console.error('Failed to create remark:', err);
      throw err;
    }
  },

  deleteRemark: async (id) => {
    try {
      await remarksApi.delete(id);
      set((state) => ({ remarks: state.remarks.filter(r => r.id !== id) }));
    } catch (err) {
      console.error('Failed to delete remark:', err);
      throw err;
    }
  },

  // Attendance
  isPunchedIn: false,
  punchRecord: null,
  attendanceRecords: [],
  notifications: [],

  fetchAttendanceStatus: async () => {
    try {
      const data = await attendanceApi.status();
      set({ isPunchedIn: data.punchedIn, punchRecord: data.record });
    } catch (err) {
      console.error('Failed to fetch attendance status:', err);
    }
  },

  fetchAttendance: async (date) => {
    try {
      const data = await attendanceApi.list(date);
      set({ attendanceRecords: data });
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  },

  punchIn: async () => {
    try {
      const data = await attendanceApi.punchIn();
      set({ isPunchedIn: true, punchRecord: { id: data.id, punchIn: data.punchIn } });
      get().addNotification(data.message, 'punch_in');
    } catch (err) {
      console.error('Failed to punch in:', err);
      throw err;
    }
  },

  punchOut: async () => {
    try {
      const data = await attendanceApi.punchOut();
      set({ isPunchedIn: false, punchRecord: null });
      get().addNotification(data.message, 'punch_out');
    } catch (err) {
      console.error('Failed to punch out:', err);
      throw err;
    }
  },

  addNotification: (message, type) => {
    const notif: Notification = { id: Date.now().toString(), message, timestamp: new Date().toISOString(), type };
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 20) }));
  },
}));
