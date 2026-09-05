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

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_API_URL}/api/entries`;
const ENTRIES_CACHE_KEY = 'yoman_entries_cache';

const getCachedEntries = (): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(ENTRIES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedEntries = (entries: JournalEntry[]) => {
  try {
    localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save to local cache', e);
  }
};

export const storage = {
  getAll: async (): Promise<JournalEntry[]> => {
    try {
      const response = await fetch(API_URL);
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

    // Save to local cache first so it appears immediately
    const existing = getCachedEntries();
    setCachedEntries([localEntry, ...existing]);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      if (response.ok) {
        const savedServerEntry: JournalEntry = await response.json();
        // Replace temporary local entry with the real MongoDB Atlas entry
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
    // Update local cache first
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
        headers: { 'Content-Type': 'application/json' },
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

const TASKS_API_URL = `${BASE_API_URL}/api/tasks`;
const TASKS_CACHE_KEY = 'yoman_tasks_cache';

const getCachedTasks = (): TaskItem[] => {
  try {
    const raw = localStorage.getItem(TASKS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedTasks = (tasks: TaskItem[]) => {
  try {
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to local cache', e);
  }
};

export const taskStorage = {
  getAll: async (): Promise<TaskItem[]> => {
    try {
      const response = await fetch(TASKS_API_URL);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.warn('Could not sync task deletion to MongoDB, removed locally', error);
      return true;
    }
  }
};

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
const MEDIA_CACHE_KEY = 'yoman_media_cache';

const getCachedMedia = (): MediaItem[] => {
  try {
    const raw = localStorage.getItem(MEDIA_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedMedia = (items: MediaItem[]) => {
  try {
    localStorage.setItem(MEDIA_CACHE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save media to local cache', e);
  }
};

export const mediaStorage = {
  getAll: async (): Promise<MediaItem[]> => {
    try {
      const response = await fetch(MEDIA_API_URL);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.warn('Could not sync media deletion to MongoDB, removed locally', error);
      return true;
    }
  }
};

