export interface JournalEntry {
  id: string;
  timestamp: string;
  displayDate?: string;
  displayTime?: string;
  mood?: string;
  intensity?: number;
  title?: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskCategory = 'therapy' | 'medical' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  therapistOrDoctor?: string;
  dueDate?: string;
  dueTime?: string;
  displayDate?: string;
  displayTime?: string;
  timestamp?: string;
  completed: boolean;
  completedAt?: string | null;
  priority: TaskPriority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'other';
export type MediaCategory = 'inspiration' | 'calm' | 'motivation' | 'healing' | 'general';

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  platform: MediaPlatform;
  category: MediaCategory;
  notes?: string;
  isFavorite: boolean;
  displayDate?: string;
  displayTime?: string;
  timestamp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: 'user' | 'admin' | 'superadmin';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalEntries: number;
  totalTasks: number;
  totalMedia: number;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'disabled';
  createdAt: string;
  stats: {
    entries: number;
    tasks: number;
    media: number;
  };
}

const getBaseApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    // If running in production (e.g. Vercel) and envUrl is localhost, ignore it to prevent mobile errors!
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return ''; // Use relative /api path on production
      }
    }
    return envUrl.replace(/\/$/, '');
  }

  // If in browser on any non-localhost domain (Vercel, custom domain, etc.)
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return ''; // Relative path (/api)
    }
  }

  // Local development default (Vite proxy forwards /api to 5000, or direct 5000)
  return '';
};

const BASE_API_URL = getBaseApiUrl();
const TOKEN_KEY = 'wisecare_token';
const USER_KEY = 'wisecare_user';

// ==========================================
// Authentication Service
// ==========================================
export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser: (): UserProfile | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  getAuthHeaders: (): Record<string, string> => {
    const token = authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
  login: async (username: string, password: string): Promise<{ user: UserProfile; token: string }> => {
    let response: Response;
    try {
      response = await fetch(`${BASE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
    } catch (networkErr: any) {
      console.error('Network fetch error during login:', networkErr);
      throw new Error('שגיאת תקשורת עם השרת. ודא חיבור תקין לאינטרנט ונסה שוב.');
    }

    let data: any = {};
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('Non-JSON response received:', parseErr);
      throw new Error('השרת החזיר תשובה שאינה תקינה. אנא נסה שוב בעוד מספר רגעים.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'שם משתמש או סיסמה שגויים');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },
  register: async (username: string, password: string, displayName?: string): Promise<{ user: UserProfile; token: string }> => {
    let response: Response;
    try {
      response = await fetch(`${BASE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName })
      });
    } catch (networkErr: any) {
      console.error('Network fetch error during register:', networkErr);
      throw new Error('שגיאת תקשורת עם השרת. ודא חיבור תקין לאינטרנט ונסה שוב.');
    }

    let data: any = {};
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('Non-JSON response received:', parseErr);
      throw new Error('השרת החזיר תשובה שאינה תקינה. אנא נסה שוב בעוד מספר רגעים.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'שגיאה בהרשמה למערכת');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const token = authService.getToken();
    if (!token) return null;
    try {
      const response = await fetch(`${BASE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      authService.logout();
      return null;
    } catch {
      return authService.getUser();
    }
  }
};

// ==========================================
// Superadmin Management Service
// ==========================================
export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await fetch(`${BASE_API_URL}/api/admin/stats`, {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch admin stats');
    }
    return response.json();
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const response = await fetch(`${BASE_API_URL}/api/admin/users`, {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch users');
    }
    return response.json();
  },

  createUser: async (user: { username: string; password: string; displayName?: string; role?: string }): Promise<AdminUser> => {
    const response = await fetch(`${BASE_API_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      },
      body: JSON.stringify(user)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  },

  updateUser: async (id: string, updates: Partial<{ displayName: string; role: string; status: string; password?: string }>): Promise<AdminUser> => {
    const response = await fetch(`${BASE_API_URL}/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const response = await fetch(`${BASE_API_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        ...authService.getAuthHeaders()
      }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete user');
    }
    return true;
  }
};

// ==========================================
// Isolated Local Storage Cache Helpers
// ==========================================
const getCacheKey = (base: string) => {
  const user = authService.getUser();
  return user ? `${base}_${user.id}` : base;
};

const getCachedEntries = (): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(getCacheKey('yoman_entries_cache'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedEntries = (entries: JournalEntry[]) => {
  try {
    localStorage.setItem(getCacheKey('yoman_entries_cache'), JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save to local cache', e);
  }
};

// ==========================================
// Journal Entries Storage
// ==========================================
const API_URL = `${BASE_API_URL}/api/entries`;

export const storage = {
  getAll: async (): Promise<JournalEntry[]> => {
    try {
      const response = await fetch(API_URL, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data: JournalEntry[] = await response.json();
      setCachedEntries(data);
      return data;
    } catch (error) {
      console.warn('Backend server unreachable, falling back to local storage cache', error);
      return getCachedEntries();
    }
  },

  save: async (entry: { content: string; timestamp: string }): Promise<JournalEntry> => {
    const now = new Date().toISOString();
    const localEntry: JournalEntry = {
      id: 'entry_' + Date.now(),
      content: entry.content,
      timestamp: entry.timestamp || now,
      createdAt: now,
      updatedAt: now,
      tags: [],
      pinned: false
    };

    const existing = getCachedEntries();
    setCachedEntries([localEntry, ...existing]);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(entry)
      });
      
      if (response.ok) {
        const savedServerEntry: JournalEntry = await response.json();
        const updated = getCachedEntries().map(e => e.id === localEntry.id ? savedServerEntry : e);
        setCachedEntries(updated);
        return savedServerEntry;
      }
    } catch (error) {
      console.warn('Could not sync entry to MongoDB, persisted in local storage', error);
    }

    return localEntry;
  },

  update: async (id: string, content: string): Promise<JournalEntry | null> => {
    const existing = getCachedEntries();
    let updatedEntry: JournalEntry | null = null;
    const nextList = existing.map(e => {
      if (e.id === id) {
        updatedEntry = { ...e, content, updatedAt: new Date().toISOString() };
        return updatedEntry;
      }
      return e;
    });
    setCachedEntries(nextList);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        const serverDoc = await response.json();
        setCachedEntries(getCachedEntries().map(e => e.id === id ? serverDoc : e));
        return serverDoc;
      }
    } catch (error) {
      console.warn('Could not sync update to MongoDB, kept in local storage', error);
    }

    return updatedEntry;
  }
};

// ==========================================
// Tasks Storage
// ==========================================
const TASKS_API_URL = `${BASE_API_URL}/api/tasks`;

const getCachedTasks = (): TaskItem[] => {
  try {
    const raw = localStorage.getItem(getCacheKey('yoman_tasks_cache'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedTasks = (tasks: TaskItem[]) => {
  try {
    localStorage.setItem(getCacheKey('yoman_tasks_cache'), JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to local cache', e);
  }
};

export const taskStorage = {
  getAll: async (): Promise<TaskItem[]> => {
    try {
      const response = await fetch(TASKS_API_URL, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data: TaskItem[] = await response.json();
      setCachedTasks(data);
      return data;
    } catch (error) {
      console.warn('Backend server unreachable, falling back to local tasks cache', error);
      return getCachedTasks();
    }
  },

  create: async (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskItem> => {
    const now = new Date().toISOString();
    const localTask: TaskItem = {
      ...task,
      id: 'task_' + Date.now(),
      createdAt: now,
      updatedAt: now
    };

    const existing = getCachedTasks();
    setCachedTasks([localTask, ...existing]);

    try {
      const response = await fetch(TASKS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(task)
      });
      if (response.ok) {
        const savedServerTask: TaskItem = await response.json();
        const updated = getCachedTasks().map(t => t.id === localTask.id ? savedServerTask : t);
        setCachedTasks(updated);
        return savedServerTask;
      }
    } catch (error) {
      console.warn('Could not sync task to MongoDB, kept in local storage', error);
    }

    return localTask;
  },

  update: async (id: string, updates: Partial<TaskItem>): Promise<TaskItem | null> => {
    const existing = getCachedTasks();
    let updatedTask: TaskItem | null = null;
    const nextList = existing.map(t => {
      if (t.id === id) {
        updatedTask = { ...t, ...updates, updatedAt: new Date().toISOString() };
        return updatedTask;
      }
      return t;
    });
    setCachedTasks(nextList);

    try {
      const response = await fetch(`${TASKS_API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const serverDoc = await response.json();
        setCachedTasks(getCachedTasks().map(t => t.id === id ? serverDoc : t));
        return serverDoc;
      }
    } catch (error) {
      console.warn('Could not sync task update to MongoDB, kept in local storage', error);
    }

    return updatedTask;
  },

  toggleComplete: async (id: string, completed: boolean): Promise<TaskItem | null> => {
    return taskStorage.update(id, {
      completed,
      completedAt: completed ? new Date().toISOString() : null
    });
  },

  delete: async (id: string): Promise<boolean> => {
    const existing = getCachedTasks();
    setCachedTasks(existing.filter(t => t.id !== id));

    try {
      const response = await fetch(`${TASKS_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { ...authService.getAuthHeaders() }
      });
      return response.ok;
    } catch (error) {
      console.warn('Could not sync task deletion to MongoDB, removed locally', error);
      return true;
    }
  }
};

// ==========================================
// Media Storage
// ==========================================
export function detectMediaPlatform(url: string): MediaPlatform {
  if (!url) return 'other';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return 'other';
}

const MEDIA_API_URL = `${BASE_API_URL}/api/media`;

const getCachedMedia = (): MediaItem[] => {
  try {
    const raw = localStorage.getItem(getCacheKey('yoman_media_cache'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedMedia = (items: MediaItem[]) => {
  try {
    localStorage.setItem(getCacheKey('yoman_media_cache'), JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save media to local cache', e);
  }
};

export const mediaStorage = {
  getAll: async (): Promise<MediaItem[]> => {
    try {
      const response = await fetch(MEDIA_API_URL, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (!response.ok) throw new Error('Failed to fetch media');
      const data: MediaItem[] = await response.json();
      setCachedMedia(data);
      return data;
    } catch (error) {
      console.warn('Backend server unreachable, falling back to local media cache', error);
      return getCachedMedia();
    }
  },

  create: async (item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaItem> => {
    const now = new Date().toISOString();
    const localItem: MediaItem = {
      ...item,
      id: 'media_' + Date.now(),
      createdAt: now,
      updatedAt: now
    };

    const existing = getCachedMedia();
    setCachedMedia([localItem, ...existing]);

    try {
      const response = await fetch(MEDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(item)
      });
      if (response.ok) {
        const savedServerItem: MediaItem = await response.json();
        const updated = getCachedMedia().map(m => m.id === localItem.id ? savedServerItem : m);
        setCachedMedia(updated);
        return savedServerItem;
      }
    } catch (error) {
      console.warn('Could not sync media to MongoDB, kept in local storage', error);
    }

    return localItem;
  },

  update: async (id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> => {
    const existing = getCachedMedia();
    let updatedItem: MediaItem | null = null;
    const nextList = existing.map(m => {
      if (m.id === id) {
        updatedItem = { ...m, ...updates, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return m;
    });
    setCachedMedia(nextList);

    try {
      const response = await fetch(`${MEDIA_API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const serverDoc = await response.json();
        setCachedMedia(getCachedMedia().map(m => m.id === id ? serverDoc : m));
        return serverDoc;
      }
    } catch (error) {
      console.warn('Could not sync media update to MongoDB, kept in local storage', error);
    }

    return updatedItem;
  },

  toggleFavorite: async (id: string, isFavorite: boolean): Promise<MediaItem | null> => {
    return mediaStorage.update(id, { isFavorite });
  },

  delete: async (id: string): Promise<boolean> => {
    const existing = getCachedMedia();
    setCachedMedia(existing.filter(m => m.id !== id));

    try {
      const response = await fetch(`${MEDIA_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { ...authService.getAuthHeaders() }
      });
      return response.ok;
    } catch (error) {
      console.warn('Could not sync media deletion to MongoDB, removed locally', error);
      return true;
    }
  }
};
