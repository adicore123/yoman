import { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import type { JournalEntry } from '../services/storage';
import { 
  Smile, 
  Brain, 
  Wind, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Table as TableIcon, 
  GitCommit 
} from 'lucide-react';
import clsx from 'clsx';

interface TimelineProps {
  onAddEntry?: () => void;
}

const MoodIcon = ({ mood, className }: { mood?: JournalEntry['mood']; className?: string }) => {
  switch (mood) {
    case 'calm': return <Wind size={16} className={clsx("text-blue-500", className)} />;
    case 'reflective': return <Brain size={16} className={clsx("text-purple-500", className)} />;
    case 'overwhelmed': return <AlertCircle size={16} className={clsx("text-red-500", className)} />;
    case 'anxious': return <AlertCircle size={16} className={clsx("text-orange-500", className)} />;
    case 'hopeful': return <Sparkles size={16} className={clsx("text-amber-500", className)} />;
    default: return <Smile size={16} className={clsx("text-emerald-500", className)} />;
  }
};

const getMoodBadge = (mood?: JournalEntry['mood']) => {
  switch (mood) {
    case 'calm': 
      return { label: 'רוגע ושלווה', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'reflective': 
      return { label: 'התבוננות ולמידה', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    case 'overwhelmed': 
      return { label: 'עומס והצפה', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    case 'anxious': 
      return { label: 'דריכות וחרדה', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    case 'hopeful': 
      return { label: 'תקווה ואופטימיות', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    default: 
      return { label: 'תחושה טובה', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  }
};

export function Timeline({ onAddEntry }: TimelineProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תובנה זו?')) return;
    setEntries(prev => prev.filter(item => item.id !== id));
    await storage.delete(id);
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setIsSavingEdit(true);
    const updated = await storage.update(id, editContent.trim());
    if (updated) {
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
    }
    setIsSavingEdit(false);
    setEditingId(null);
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
    const d = new Date(entry.timestamp || entry.createdAt || new Date());
    const displayDate = entry.displayDate || d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const displayTime = entry.displayTime || d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return { displayDate, displayTime };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50 py-20">
        <Loader2 size={40} className="mb-4 animate-spin text-accent opacity-60" />
        <h3 className="text-lg font-medium">טוען טבלת תובנות ומעקב מהענן...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <span>טבלת תובנות ומעקב רגשי</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold">
              {stats.total} תובנות שמורות
            </span>
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            מעקב ותיעוד מסודר של תובנות, שיעורים ומחשבות במחשב ובנייד
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Switcher: Table / Timeline */}
          <div className="bg-card p-1 rounded-xl border border-border flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'table'
                  ? "bg-accent text-white shadow-sm"
                  : "text-foreground/70 hover:bg-border/40"
              )}
              title="תצוגת טבלה מסודרת"
            >
              <TableIcon size={14} />
              <span>טבלה</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'timeline'
                  ? "bg-accent text-white shadow-sm"
                  : "text-foreground/70 hover:bg-border/40"
              )}
              title="תצוגת ציר זמן"
            >
              <GitCommit size={14} />
              <span>ציר זמן</span>
            </button>
          </div>

          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-accent text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20 text-xs sm:text-sm shrink-0"
            >
              <Plus size={17} />
              <span>תובנה חדשה</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">סה״כ תובנות</span>
            <Calendar size={14} className="text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.total}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">שמורות בענן (MongoDB)</div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">רוגע ותקווה</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.calmOrHopeful}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">רגעים מחזקים ושלווים</div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">התבוננות ולמידה</span>
            <Brain size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.reflective}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">עיבוד רגשי ותובנות</div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60">עיבוד עומס ודריכות</span>
            <AlertCircle size={14} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.challenging}</div>
          <div className="text-[11px] text-foreground/50 mt-0.5">רגשות שקיבלו ביטוי</div>
        </div>
      </div>

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Sparkles size={28} />
          </div>
          <h3 className="text-lg font-bold text-foreground">אין עדיין תובנות שמורות בטבלה</h3>
          <p className="text-xs sm:text-sm text-foreground/60 max-w-sm">
            הוסף תובנה או רשומה חדשה והיא תישמר באופן מיידי במסד הנתונים בענן ותוצג בטבלה זו במחשב ובמובייל.
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
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Desktop HTML Table + Mobile Card-Table) */
        <div className="space-y-3">
          
          {/* Mobile Card Table (< md) */}
          <div className="md:hidden space-y-3">
            {entries.map(entry => {
              const { displayDate, displayTime } = getEntryDateInfo(entry);
              const moodInfo = getMoodBadge(entry.mood);
              const isEditing = editingId === entry.id;

              return (
                <div key={entry.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
                  
                  {/* Top Header: Date, Mood & Action Buttons */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70 font-semibold">
                        <Calendar size={13} className="text-accent" />
                        <span>{displayDate}</span>
                        <span className="text-foreground/30">·</span>
                        <Clock size={12} className="text-foreground/40" />
                        <span className="text-foreground/50">{displayTime}</span>
                      </div>

                      {/* Mood Badge */}
                      <span className={clsx("flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium", moodInfo.color)}>
                        <MoodIcon mood={entry.mood} />
                        <span>{moodInfo.label}</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button 
                            onClick={() => handleSaveEdit(entry.id)} 
                            disabled={isSavingEdit}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            title="שמור שינויים"
                          >
                            {isSavingEdit ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            disabled={isSavingEdit}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="ביטול"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStartEdit(entry)}
                            className="p-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
                            title="ערוך תובנה"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(entry.id, e)}
                            className="p-1.5 rounded-lg text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="מחק תובנה"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div>
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        disabled={isSavingEdit}
                        className="w-full min-h-[110px] p-3 rounded-xl bg-background border border-accent focus:outline-none text-xs sm:text-sm text-foreground resize-y disabled:opacity-50 leading-relaxed"
                      />
                    ) : (
                      <p className="text-foreground/90 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                        {entry.content}
                      </p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table (>= md) */}
          <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-border/40 text-foreground/70 text-xs sm:text-sm">
                    <th className="py-3 px-5 font-semibold w-44 border-b border-border">תאריך ושעה</th>
                    <th className="py-3 px-5 font-semibold w-44 border-b border-border">מצב רוח והרגשה</th>
                    <th className="py-3 px-5 font-semibold border-b border-border">תובנה / תוכן</th>
                    <th className="py-3 px-5 font-semibold w-24 border-b border-border text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map(entry => {
                    const { displayDate, displayTime } = getEntryDateInfo(entry);
                    const moodInfo = getMoodBadge(entry.mood);
                    const isEditing = editingId === entry.id;

                    return (
                      <tr key={entry.id} className="hover:bg-border/20 transition-colors">
                        
                        {/* Date & Time */}
                        <td className="py-4 px-5 text-sm text-foreground/70 align-top whitespace-nowrap">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Calendar size={13} className="text-accent" />
                            <span>{displayDate}</span>
                          </div>
                          <div className="text-xs text-foreground/50 flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} />
                            <span>{displayTime}</span>
                          </div>
                        </td>

                        {/* Mood & Emotion */}
                        <td className="py-4 px-5 align-top whitespace-nowrap">
                          <span className={clsx("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium", moodInfo.color)}>
                            <MoodIcon mood={entry.mood} />
                            <span>{moodInfo.label}</span>
                          </span>
                        </td>

                        {/* Content */}
                        <td className="py-4 px-5 align-top">
                          {isEditing ? (
                            <textarea
                              autoFocus
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              disabled={isSavingEdit}
                              className="w-full min-h-[90px] p-2.5 rounded-xl bg-background border border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground text-sm resize-y disabled:opacity-50 leading-relaxed"
                            />
                          ) : (
                            <div className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                              {entry.content}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 align-top text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleSaveEdit(entry.id)} 
                                disabled={isSavingEdit}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                title="שמור"
                              >
                                {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              </button>
                              <button 
                                onClick={handleCancelEdit} 
                                disabled={isSavingEdit}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="ביטול"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleStartEdit(entry)}
                                className="p-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
                                title="ערוך תובנה"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={(e) => handleDelete(entry.id, e)}
                                className="p-1.5 rounded-lg text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="מחק תובנה"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* TIMELINE VIEW (Alternative visual graph) */
        <div className="relative pt-4 before:absolute before:inset-0 before:start-5 md:before:start-1/2 before:-translate-x-1/2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-accent/40 before:via-border before:to-transparent">
          <div className="space-y-6">
            {entries.map((entry, index) => {
              const isEven = index % 2 === 0;
              const { displayDate, displayTime } = getEntryDateInfo(entry);
              const moodInfo = getMoodBadge(entry.mood);

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
                    
                    {/* Header: Date, Mood Badge & Actions */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-accent">
                          {displayDate} · {displayTime}
                        </span>
                        <span className={clsx("text-[10px] px-2 py-0.5 rounded-md border font-medium", moodInfo.color)}>
                          {moodInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setViewMode('table');
                            handleStartEdit(entry);
                          }}
                          className="p-1 rounded-lg text-foreground/40 hover:text-accent hover:bg-accent/10 transition-all"
                          title="ערוך תובנה"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(entry.id, e)}
                          className="p-1 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="מחק תובנה"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                      {entry.content}
                    </p>

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
