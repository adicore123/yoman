import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import type { JournalEntry } from '../services/storage';
import { Loader2, Edit2, Check, X, Calendar, Clock, Trash2, Smile, Brain, Wind, AlertCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const MoodIcon = ({ mood, className }: { mood?: JournalEntry['mood']; className?: string }) => {
  switch (mood) {
    case 'calm': return <Wind size={14} className={clsx("text-blue-500", className)} />;
    case 'reflective': return <Brain size={14} className={clsx("text-purple-500", className)} />;
    case 'overwhelmed': return <AlertCircle size={14} className={clsx("text-red-500", className)} />;
    case 'anxious': return <AlertCircle size={14} className={clsx("text-orange-500", className)} />;
    case 'hopeful': return <Sparkles size={14} className={clsx("text-amber-500", className)} />;
    default: return <Smile size={14} className={clsx("text-emerald-500", className)} />;
  }
};

const getMoodBadge = (mood?: JournalEntry['mood']) => {
  switch (mood) {
    case 'calm': 
      return { label: 'רוגע', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'reflective': 
      return { label: 'התבוננות', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    case 'overwhelmed': 
      return { label: 'הצפה', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    case 'anxious': 
      return { label: 'חרדה', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    case 'hopeful': 
      return { label: 'תקווה', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    default: 
      return { label: 'טוב', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  }
};

export function EntriesTable() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEntries = async () => {
      setLoading(true);
      const data = await storage.getAll();
      if (mounted) {
        setEntries(data);
        setLoading(false);
      }
    };
    fetchEntries();

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

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (id: string) => {
    setIsSaving(true);
    const updated = await storage.update(id, editContent);
    if (updated) {
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
    }
    setIsSaving(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    await storage.delete(id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
        <Loader2 size={40} className="mb-4 animate-spin text-accent opacity-50" />
        <h3 className="text-lg font-medium">טוען את היומן שלך...</h3>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center shadow-sm">
        <h3 className="text-xl font-bold text-foreground mb-2">אין רשומות עדיין</h3>
        <p className="text-sm text-foreground/50">היומן מחכה למחשבות שלך... לחץ על ״רשומה חדשה״ כדי להתחיל.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {entries.map(entry => {
          const date = new Date(entry.timestamp || entry.createdAt || new Date());
          const displayDate = entry.displayDate || date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const displayTime = entry.displayTime || date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
          const moodInfo = getMoodBadge(entry.mood);
          const isEditing = editingId === entry.id;

          return (
            <div key={entry.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-foreground/60">
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <Calendar size={13} className="text-accent" />
                    <span>{displayDate}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{displayTime}</span>
                  </span>

                  {entry.mood && (
                    <span className={clsx("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium", moodInfo.color)}>
                      <MoodIcon mood={entry.mood} />
                      <span>{moodInfo.label}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => handleSaveEdit(entry.id)} 
                        disabled={isSaving}
                        className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        title="שמור"
                      >
                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      </button>
                      <button 
                        onClick={handleCancelEdit} 
                        disabled={isSaving}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        title="ביטול"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEdit(entry)}
                        className="p-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
                        title="ערוך"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    disabled={isSaving}
                    className="w-full min-h-[110px] p-3 rounded-xl bg-background border border-accent focus:outline-none text-sm text-foreground resize-y disabled:opacity-50"
                  />
                ) : (
                  <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                    {entry.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop & Tablet Table View (>= md) */}
      <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-border/40 text-foreground/70 text-xs sm:text-sm">
                <th className="py-3 px-6 font-semibold w-48 border-b border-border">תאריך ושעה</th>
                <th className="py-3 px-6 font-semibold w-36 border-b border-border">מצב רוח</th>
                <th className="py-3 px-6 font-semibold border-b border-border">תוכן הרשומה</th>
                <th className="py-3 px-6 font-semibold w-24 border-b border-border text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map(entry => {
                const date = new Date(entry.timestamp || entry.createdAt || new Date());
                const displayDate = entry.displayDate || date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const displayTime = entry.displayTime || date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                const moodInfo = getMoodBadge(entry.mood);
                const isEditing = editingId === entry.id;

                return (
                  <tr key={entry.id} className="hover:bg-border/20 transition-colors">
                    <td className="py-4 px-6 text-sm text-foreground/70 align-top whitespace-nowrap">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar size={13} className="text-accent" />
                        <span>{displayDate}</span>
                      </div>
                      <div className="text-xs text-foreground/50 flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} />
                        <span>{displayTime}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top whitespace-nowrap">
                      {entry.mood ? (
                        <span className={clsx("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium", moodInfo.color)}>
                          <MoodIcon mood={entry.mood} />
                          <span>{moodInfo.label}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-foreground/40">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 align-top">
                      {isEditing ? (
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          disabled={isSaving}
                          className="w-full min-h-[100px] p-3 rounded-lg bg-background border border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground resize-y disabled:opacity-50 text-sm"
                        />
                      ) : (
                        <div className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 align-top text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleSaveEdit(entry.id)} 
                            disabled={isSaving}
                            className="p-1.5 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            title="שמור"
                          >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            disabled={isSaving}
                            className="p-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="ביטול"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 rounded-md text-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
                            title="ערוך"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-md text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="מחק"
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
  );
}
