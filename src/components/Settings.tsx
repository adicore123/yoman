import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Moon, Sun, Leaf, Key } from 'lucide-react';
import clsx from 'clsx';

export function Settings() {
  const { theme, setTheme, changePin } = useApp();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setPinMessage('קוד חדש חייב להיות 4 ספרות בדיוק');
      return;
    }
    
    if (changePin(oldPin, newPin)) {
      setPinMessage('הקוד שונה בהצלחה!');
      setOldPin('');
      setNewPin('');
      setTimeout(() => setPinMessage(''), 3000);
    } else {
      setPinMessage('הקוד הישן שגוי');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">הגדרות</h2>
        <p className="text-foreground/60">נהל את החשבון, האבטחה ועיצוב המערכת.</p>
      </div>

      {/* Theme Settings */}
      <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-sm space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">עיצוב וצבעים</h3>
          <p className="text-sm text-foreground/60">בחר את פלטת הצבעים המועדפת עליך</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button 
            onClick={() => setTheme('warm')}
            className={clsx(
              "flex flex-col items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border-2 transition-all",
              theme === 'warm' ? "border-accent bg-accent/5" : "border-border bg-background hover:border-accent/50"
            )}
          >
            <Sun className={theme === 'warm' ? "text-accent" : "text-foreground/50"} size={28} />
            <span className="font-medium text-foreground text-sm sm:text-base">וניל חמים</span>
          </button>
          
          <button 
            onClick={() => setTheme('dark')}
            className={clsx(
              "flex flex-col items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border-2 transition-all",
              theme === 'dark' ? "border-accent bg-accent/5" : "border-border bg-background hover:border-accent/50"
            )}
          >
            <Moon className={theme === 'dark' ? "text-accent" : "text-foreground/50"} size={28} />
            <span className="font-medium text-foreground text-sm sm:text-base">חצות (כהה)</span>
          </button>

          <button 
            onClick={() => setTheme('forest')}
            className={clsx(
              "flex flex-col items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border-2 transition-all",
              theme === 'forest' ? "border-accent bg-accent/5" : "border-border bg-background hover:border-accent/50"
            )}
          >
            <Leaf className={theme === 'forest' ? "text-accent" : "text-foreground/50"} size={28} />
            <span className="font-medium text-foreground text-sm sm:text-base">ירוק אדמה</span>
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-sm space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">אבטחה</h3>
          <p className="text-sm text-foreground/60">שנה את קוד הגישה ל-Wisecare (ברירת מחדל: 3344)</p>
        </div>

        <form onSubmit={handlePinChange} className="space-y-4 max-w-sm">
          <div>
            <label className="text-sm font-medium text-foreground/70 mb-2 block">קוד נוכחי</label>
            <div className="relative">
              <Key className="absolute start-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
              <input 
                type="password"
                maxLength={4}
                value={oldPin}
                onChange={e => setOldPin(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-foreground text-center tracking-[1em] font-mono"
                placeholder="****"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/70 mb-2 block">קוד חדש (4 ספרות)</label>
            <div className="relative">
              <Key className="absolute start-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
              <input 
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-foreground text-center tracking-[1em] font-mono"
                placeholder="****"
                dir="ltr"
              />
            </div>
          </div>

          {pinMessage && (
            <p className={clsx("text-sm font-medium", pinMessage.includes('בהצלחה') ? "text-green-500" : "text-red-500")}>
              {pinMessage}
            </p>
          )}

          <button 
            type="submit"
            disabled={oldPin.length !== 4 || newPin.length !== 4}
            className="flex items-center justify-center w-full gap-2 px-6 py-2.5 rounded-xl font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-accent/20"
          >
            <Check size={18} />
            <span>שמור קוד חדש</span>
          </button>
        </form>
      </div>

    </div>
  );
}
