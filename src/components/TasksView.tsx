import { useState, useEffect, useMemo } from 'react';
import { taskStorage } from '../services/storage';
import type { TaskItem } from '../services/storage';
import { AddTaskModal } from './AddTaskModal';
import { 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  Brain, 
  Stethoscope, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Search, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

type FilterType = 'all' | 'therapy' | 'medical' | 'personal' | 'completed';

export function TasksView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);

  // Quick notes editing state
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    const data = await taskStorage.getAll();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    const todayCreated = tasks.filter(t => (t.timestamp || t.createdAt || '').startsWith(todayStr));
    const therapy = tasks.filter(t => !t.completed && t.category === 'therapy');
    const medical = tasks.filter(t => !t.completed && t.category === 'medical');

    return {
      pending: pending.length,
      completed: completed.length,
      today: todayCreated.length,
      therapy: therapy.length,
      medical: medical.length,
    };
  }, [tasks]);

  // Filtered & Searched tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Category / Status Filter
      if (activeFilter === 'completed' && !task.completed) return false;
      if (activeFilter !== 'completed') {
        if (task.completed) return false; // In active tabs, hide completed tasks
        if (activeFilter !== 'all' && task.category !== activeFilter) return false;
      }

      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes) return false;
      }

      return true;
    });
  }, [tasks, activeFilter, searchQuery]);

  // Toggle completion
  const handleToggleComplete = async (task: TaskItem) => {
    const newStatus = !task.completed;
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { 
      ...t, 
      completed: newStatus, 
      completedAt: newStatus ? new Date().toISOString() : null 
    } : t));

    await taskStorage.toggleComplete(task.id, newStatus);
  };

  // Delete task
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('האם למחוק משימה זו?')) return;
    
    setTasks(prev => prev.filter(t => t.id !== id));
    await taskStorage.delete(id);
  };

  // Edit task
  const handleOpenEdit = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Quick notes saving
  const handleSaveNotes = async (id: string) => {
    setIsSavingNotes(true);
    await taskStorage.update(id, { notes: tempNotes.trim() });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: tempNotes.trim() } : t));
    setIsSavingNotes(false);
    setEditingNotesId(null);
  };

  // Automatic Date & Time Formatter
  const formatAutoDate = (task: TaskItem) => {
    if (task.displayDate && task.displayTime) {
      return `${task.displayDate} · ${task.displayTime}`;
    }
    const raw = task.timestamp || task.createdAt;
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;

    const todayStr = new Date().toLocaleDateString('he-IL');
    const dateStr = d.toLocaleDateString('he-IL');
    const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    if (dateStr === todayStr) {
      return `היום · ${timeStr}`;
    }
    return `${dateStr} · ${timeStr}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Top Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <span>משימות ותזכורות</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold">
              {stats.pending} פתוחות
            </span>
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            מעקב ותיעוד מסודר אחר תרגולים מטיפול, בדיקות רפואיות ומשימות אישיות
          </p>
        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full font-medium hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20 self-start md:self-auto"
        >
          <Plus size={18} />
          <span>משימה חדשה</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        <div 
          onClick={() => setActiveFilter('all')}
          className={clsx(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeFilter === 'all' 
              ? "bg-card border-accent shadow-md shadow-accent/5 ring-1 ring-accent" 
              : "bg-card border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">סה״כ פתוחות</span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.pending}</div>
          <div className="text-xs text-foreground/50 mt-0.5">
            {stats.today > 0 ? `נוספו היום: ${stats.today}` : 'הכל מעודכן'}
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('therapy')}
          className={clsx(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeFilter === 'therapy' 
              ? "bg-card border-accent shadow-md shadow-accent/5 ring-1 ring-accent" 
              : "bg-card border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 flex items-center gap-1.5">
              <Brain size={14} className="text-accent" />
              <span>טיפול ופסיכולוג</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.therapy}</div>
          <div className="text-xs text-foreground/50 mt-0.5">תרגולים ושיעורי בית</div>
        </div>

        <div 
          onClick={() => setActiveFilter('medical')}
          className={clsx(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeFilter === 'medical' 
              ? "bg-card border-emerald-500 shadow-md ring-1 ring-emerald-500" 
              : "bg-card border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 flex items-center gap-1.5">
              <Stethoscope size={14} className="text-emerald-500" />
              <span>רפואי ובריאות</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.medical}</div>
          <div className="text-xs text-foreground/50 mt-0.5">בדיקות, תורים ומרשמים</div>
        </div>

        <div 
          onClick={() => setActiveFilter('completed')}
          className={clsx(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeFilter === 'completed' 
              ? "bg-card border-accent shadow-md shadow-accent/5 ring-1 ring-accent" 
              : "bg-card border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-accent" />
              <span>הושלמו</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.completed}</div>
          <div className="text-xs text-foreground/50 mt-0.5">משימות שבוצעו</div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2 rounded-2xl border border-border">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              activeFilter === 'all'
                ? "bg-accent text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            הכל ({stats.pending})
          </button>

          <button
            onClick={() => setActiveFilter('therapy')}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              activeFilter === 'therapy'
                ? "bg-accent text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Brain size={13} />
            <span>טיפול ({stats.therapy})</span>
          </button>

          <button
            onClick={() => setActiveFilter('medical')}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              activeFilter === 'medical'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Stethoscope size={13} />
            <span>רפואי ({stats.medical})</span>
          </button>

          <button
            onClick={() => setActiveFilter('personal')}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              activeFilter === 'personal'
                ? "bg-amber-600 text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <User size={13} />
            <span>אישי</span>
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              activeFilter === 'completed'
                ? "bg-foreground/80 text-background shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <CheckCircle2 size={13} />
            <span>הושלמו ({stats.completed})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-foreground/40" size={15} />
          <input
            type="text"
            placeholder="חיפוש משימה או הערה..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-xs text-foreground placeholder:text-foreground/40"
          />
        </div>

      </div>

      {/* Task List Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
          <Loader2 size={36} className="animate-spin text-accent mb-3 opacity-60" />
          <p className="text-sm">טוען משימות...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-3">
            {activeFilter === 'completed' ? <CheckCircle2 size={28} /> : <Sparkles size={28} />}
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {activeFilter === 'completed' ? 'אין משימות שהושלמו עדיין' : 'אין משימות להצגה'}
          </h3>
          <p className="text-sm text-foreground/50 max-w-md mb-5">
            {activeFilter === 'therapy' 
              ? 'אין משימות או תרגולים מטיפול כרגע. נשימה עמוקה והמשך יום רגוע!'
              : activeFilter === 'medical'
              ? 'אין בדיקות או משימות רפואיות פתוחות כעת.'
              : activeFilter === 'completed'
              ? 'סמן משימות כבוצעו כדי לראות אותן כאן.'
              : 'אין משימות ברשימה זו. לחץ על הכפתור למטה כדי להוסיף משימה ראשונה.'}
          </p>
          {activeFilter !== 'completed' && (
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full font-medium text-xs hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
            >
              <Plus size={16} />
              <span>הוסף משימה ראשונה</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const autoDate = formatAutoDate(task);
            const isNotesExpanded = expandedNotesId === task.id || editingNotesId === task.id;

            return (
              <div 
                key={task.id}
                className={clsx(
                  "bg-card rounded-2xl border transition-all hover:border-accent/40 shadow-sm overflow-hidden",
                  task.completed ? "opacity-75 border-border bg-border/10" : "border-border"
                )}
              >
                {/* Main Task Row */}
                <div className="p-4 flex items-start sm:items-center justify-between gap-3.5">
                  
                  {/* Right side: Checkbox + Title + Meta */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    
                    {/* Custom Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={clsx(
                        "mt-0.5 sm:mt-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0",
                        task.completed 
                          ? "bg-accent border-accent text-white shadow-sm" 
                          : "border-border hover:border-accent text-transparent hover:bg-accent/10"
                      )}
                      title={task.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
                    >
                      <Check size={14} className={task.completed ? "stroke-[3]" : "opacity-0"} />
                    </button>

                    {/* Task Title & Tags */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={clsx(
                          "font-semibold text-sm transition-all",
                          task.completed ? "line-through text-foreground/45" : "text-foreground"
                        )}>
                          {task.title}
                        </span>

                        {/* Priority Badge if high */}
                        {task.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                            <AlertCircle size={10} />
                            <span>דחוף</span>
                          </span>
                        )}

                        {/* Category Badge */}
                        {task.category === 'therapy' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                            <Brain size={11} />
                            <span>טיפול</span>
                          </span>
                        )}
                        {task.category === 'medical' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <Stethoscope size={11} />
                            <span>רפואי</span>
                          </span>
                        )}
                        {task.category === 'personal' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <User size={11} />
                            <span>אישי</span>
                          </span>
                        )}
                      </div>

                      {/* Auto Recorded Date Indicator */}
                      {autoDate && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-foreground/55">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{autoDate}</span>
                          </span>
                          {task.completed && task.completedAt && (
                            <span className="text-accent/80 text-[11px]">
                              · הושלם ב-{new Date(task.completedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Left side: Notes trigger & actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    
                    {/* Notes Toggle */}
                    <button
                      onClick={() => {
                        if (expandedNotesId === task.id) {
                          setExpandedNotesId(null);
                          setEditingNotesId(null);
                        } else {
                          setExpandedNotesId(task.id);
                        }
                      }}
                      className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors",
                        task.notes || isNotesExpanded 
                          ? "bg-accent/10 text-accent hover:bg-accent/20" 
                          : "text-foreground/40 hover:text-foreground hover:bg-border/40"
                      )}
                      title="תיעוד והערות לביצוע"
                    >
                      <MessageSquare size={13} />
                      <span className="hidden sm:inline">
                        {task.notes ? 'תיעוד' : '+ הערה'}
                      </span>
                      {isNotesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={e => handleOpenEdit(task, e)}
                      className="p-1.5 rounded-xl text-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors"
                      title="ערוך משימה"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={e => handleDelete(task.id, e)}
                      className="p-1.5 rounded-xl text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="מחק משימה"
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </div>

                {/* Collapsible Notes / Documentation Area */}
                {isNotesExpanded && (
                  <div className="border-t border-border/60 bg-background/50 p-4 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-foreground/70 flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-accent" />
                        <span>תיעוד, הנחיות ורשמים מהביצוע</span>
                      </span>

                      {editingNotesId !== task.id && (
                        <button
                          onClick={() => {
                            setEditingNotesId(task.id);
                            setTempNotes(task.notes || '');
                          }}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          {task.notes ? 'ערוך תיעוד' : 'הוסף תיעוד עכשיו'}
                        </button>
                      )}
                    </div>

                    {editingNotesId === task.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          autoFocus
                          value={tempNotes}
                          onChange={e => setTempNotes(e.target.value)}
                          placeholder="רשום כאן איך היה התרגיל, מה אמר הרופא, או תובנות לפגישה הבאה..."
                          className="w-full p-2.5 rounded-xl border border-accent bg-background text-foreground text-xs focus:outline-none resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            disabled={isSavingNotes}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-foreground/70 hover:bg-border/50"
                          >
                            ביטול
                          </button>
                          <button
                            onClick={() => handleSaveNotes(task.id)}
                            disabled={isSavingNotes}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
                          >
                            {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            <span>שמור תיעוד</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {task.notes || (
                          <span className="text-foreground/40 italic">אין עדיין תיעוד או הערות למשימה זו.</span>
                        )}
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <AddTaskModal
          taskToEdit={taskToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setTaskToEdit(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setTaskToEdit(null);
            fetchTasks();
          }}
        />
      )}

    </div>
  );
}
