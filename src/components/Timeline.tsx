import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import type { JournalEntry } from '../services/storage';
import { Smile, Brain, Wind, AlertCircle, Sparkles, Pin, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const MoodIcon = ({ mood, className }: { mood: JournalEntry['mood'], className?: string }) => {
  switch (mood) {
    case 'calm': return <Wind size={20} className={clsx("text-blue-500", className)} />;
    case 'reflective': return <Brain size={20} className={clsx("text-purple-500", className)} />;
    case 'overwhelmed': return <AlertCircle size={20} className={clsx("text-red-500", className)} />;
    case 'anxious': return <AlertCircle size={20} className={clsx("text-orange-500", className)} />;
    case 'hopeful': return <Sparkles size={20} className={clsx("text-yellow-500", className)} />;
    default: return <Smile size={20} className={clsx("text-green-500", className)} />;
  }
};

export function Timeline() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50">
        <Loader2 size={48} className="mb-4 animate-spin text-accent opacity-50" />
        <h3 className="text-xl font-medium">מתחבר לענן וטוען רשומות...</h3>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50">
        <Sparkles size={48} className="mb-4 opacity-50" />
        <h3 className="text-xl font-medium mb-2">אין רשומות עדיין</h3>
        <p>היומן מחכה למחשבות שלך...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="space-y-8 relative before:absolute before:inset-0 before:me-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 z-10">
              <MoodIcon mood={entry.mood} />
            </div>

            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-accent">{entry.displayDate} &middot; {entry.displayTime}</span>
                {entry.pinned && <Pin size={16} className="text-accent" />}
              </div>
              
              <h4 className="text-lg font-bold text-foreground mb-2">{entry.title}</h4>
              
              <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed text-sm mb-4">
                {entry.content}
              </p>
              
              <div className="flex items-center gap-2 flex-wrap">
                {entry.tags?.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
                    #{tag}
                  </span>
                ))}
                
                {entry.intensity !== undefined && (
                  <div className="ms-auto flex items-center gap-1" dir="ltr">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          i < (entry.intensity ?? 0) ? "bg-accent" : "bg-border"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
