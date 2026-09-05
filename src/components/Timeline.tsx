import { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import type { JournalEntry } from '../services/storage';
import { Smile, Brain, Wind, AlertCircle, Sparkles, Loader2, Plus, Calendar, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface TimelineProps {
  onAddEntry?: () => void;
}

const MoodIcon = ({ mood, className }: { mood?: JournalEntry['mood']; className?: string }) => {
  switch (mood) {
    case 'calm': return <Wind size={18} className={clsx("text-blue-500", className)} />;
    case 'reflective': return <Brain size={18} className={clsx("text-purple-500", className)} />;
    case 'overwhelmed': return <AlertCircle size={18} className={clsx("text-red-500", className)} />;
    case 'anxious': return <AlertCircle size={18} className={clsx("text-orange-500", className)} />;
    case 'hopeful': return <Sparkles size={18} className={clsx("text-amber-500", className)} />;
    default: return <Smile size={18} className={clsx("text-emerald-500", className)} />;
  }
};

const getMoodLabel = (mood?: JournalEntry['mood']) => {
  switch (mood) {
    case 'calm': return 'רוגע';
    case 'reflective': return 'התבוננות';
    case 'overwhelmed': return 'הצפה';
    case 'anxious': return 'חרדה';
    case 'hopeful': return 'תקווה';
    default: return 'טוב';
  }
};

export function Timeline({ onAddEntry }: TimelineProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const data = await storage.getAll();
      if (mounted) {
        setEntries(data);
        setLoading(false);
      }
    };
    load();

    const handleUpdate = () => {
      storage.getAll().then(data => {
        if (mounted) setEntries(data);
      });
    };

    window.addEventListener('wisecare:entry-updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('wisecare:entry-updated', handleUpdate);
    };
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) return;
    setEntries(prev => prev.filter(item => item.id !== id));
    await storage.delete(id);
  };

  // Metrics calculation
  const stats = useMemo(() => {
    const total = entries.length;
    const calmOrHopeful = entries.filter(e => e.mood === 'calm' || e.mood === 'hopeful' || !e.mood).length;
    const reflective = entries.filter(e => e.mood === 'reflective').length;
    const challenging = entries.filter(e => e.mood === 'overwhelmed' || e.mood === 'anxious').length;

    return {
      total,
      calmOrHopeful,
      reflective,
      challenging
    };
  }, [entries]);

  // Safe date/time formatting
  const getEntryDateInfo = (entry: JournalEntry) => {
    if (entry.displayDate && entry.displayTime) {
      return `${entry.displayDate} · ${entry.displayTime}`;
    }
    const d = new Date(entry.timestamp || entry.createdAt || new Date());
    const displayDate = entry.displayDate || d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const displayTime = entry.displayTime || d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return `${displayDate} · ${displayTime}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50 py-20">
        <Loader2 size={40} className="mb-4 animate-spin text-accent opacity-60" />
        <h3 className="text-lg font-medium">טוען תובנות ורשומות מהענן...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* Top Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <span>תובנות ומעקב רגשי</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold">
              {stats.total} רשומות
            </span>
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            מעקב אחר מחשבות, תובנות מטיפול, תהליכים אישיים והתפתחות לאורך זמן
          </p>
        </div>

        {onAddEntry && (
          <button
            onClick={onAddEntry}
            className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full font-medium hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20 self-start sm:self-auto text-sm shrink-0"
          >
            <Plus size={18} />
            <span>תובנה / רשומה חדשה</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">סה״כ תובנות</span>
            <Calendar size={14} className="text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.total}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">רשומות שנשמרו בענן</div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">רוגע ותקווה</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.calmOrHopeful}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">רגעים מחזקים ומרגיעים</div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">התבוננות ושיעורים</span>
            <Brain size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.reflective}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">עיבוד רגשי ולמידה</div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">עיבוד עומס/חרדה</span>
            <AlertCircle size={14} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.challenging}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">רגשות שקיבלו מקום ופריקה</div>
        </div>
      </div>

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Sparkles size={28} />
          </div>
          <h3 className="text-lg font-bold text-foreground">אין עדיין רשומות או תובנות</h3>
          <p className="text-xs sm:text-sm text-foreground/60 max-w-sm">
            כשתכתוב רשומות ביומן, הן יישמרו במסד הנתונים בענן ויופיעו כאן בציר זמן מסודר ומעוצב.
          </p>
          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="mt-2 flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
            >
              <Plus size={16} />
              <span>הוסף תובנה ראשונה</span>
            </button>
          )}
        </div>
      ) : (
        /* Timeline View */
        <div className="relative pt-4 before:absolute before:inset-0 before:start-5 md:before:start-1/2 before:-translate-x-1/2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-accent/40 before:via-border before:to-transparent">
          <div className="space-y-6">
            {entries.map((entry, index) => {
              const isEven = index % 2 === 0;
              return (
                <div 
                  key={entry.id} 
                  className={clsx(
                    "relative flex items-start gap-4 md:gap-8",
                    "md:flex-row",
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  )}
                >
                  
                  {/* Timeline Mood Pin */}
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-card shadow-sm flex items-center justify-center shrink-0 z-10 md:absolute md:start-1/2 md:-translate-x-1/2">
                    <MoodIcon mood={entry.mood} />
                  </div>

                  {/* Entry Content Card */}
                  <div className={clsx(
                    "flex-1 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all relative group",
                    "md:w-[calc(50%-2rem)] md:flex-none",
                    isEven ? "md:me-auto" : "md:ms-auto"
                  )}>
                    
                    {/* Header: Date, Mood Badge & Delete */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-accent">
                          {getEntryDateInfo(entry)}
                        </span>
                        {entry.mood && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/10 text-accent font-medium">
                            {getMoodLabel(entry.mood)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="מחק רשומה"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Content */}
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                      {entry.content}
                    </p>

                    {/* Tags or Additional metadata */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2 border-t border-border/40">
                        {entry.tags.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-background border border-border text-foreground/60">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
