import { useApp } from '../context/AppContext';
import { Book, CheckSquare, PlayCircle, LineChart, Settings, Lock, Moon, Sun, Leaf, X } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { logout, theme, setTheme, activePage, setActivePage } = useApp();

  const handleNavClick = (page: 'journal' | 'tasks' | 'media' | 'insights' | 'settings') => {
    setActivePage(page);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={clsx(
          "w-72 md:w-64 border-e border-border bg-card flex flex-col h-screen p-4 transition-all duration-300 z-50",
          "fixed md:static inset-y-0 start-0",
          isOpen 
            ? "translate-x-0 shadow-2xl" 
            : "-translate-x-full rtl:translate-x-full md:translate-x-0 md:rtl:translate-x-0"
        )}
      >
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3 py-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-black text-lg shadow-md shadow-accent/25">
              W
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-foreground block leading-tight">
                Wisecare
              </span>
              <span className="text-[11px] font-medium text-foreground/50 block">
                טיפול, בריאות ויומן
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-border/50 transition-colors"
            title="סגור תפריט"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto py-2">
          <button 
            onClick={() => handleNavClick('journal')}
            className={clsx(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm",
              activePage === 'journal' 
                ? "bg-accent/15 text-accent font-bold shadow-sm" 
                : "hover:bg-border/40 text-foreground/70"
            )}
          >
            <Book size={19} />
            <span>היומן שלי</span>
          </button>

          <button 
            onClick={() => handleNavClick('tasks')}
            className={clsx(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm",
              activePage === 'tasks' 
                ? "bg-accent/15 text-accent font-bold shadow-sm" 
                : "hover:bg-border/40 text-foreground/70"
            )}
          >
            <CheckSquare size={19} />
            <span>משימות ותזכורות</span>
          </button>

          <button 
            onClick={() => handleNavClick('media')}
            className={clsx(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm",
              activePage === 'media' 
                ? "bg-accent/15 text-accent font-bold shadow-sm" 
                : "hover:bg-border/40 text-foreground/70"
            )}
          >
            <PlayCircle size={19} />
            <span>סרטוני מדיה מחזקים</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('insights')}
            className={clsx(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm",
              activePage === 'insights' 
                ? "bg-accent/15 text-accent font-bold shadow-sm" 
                : "hover:bg-border/40 text-foreground/70"
            )}
          >
            <LineChart size={19} />
            <span>תובנות ומעקב</span>
          </button>

          <button 
            onClick={() => handleNavClick('settings')}
            className={clsx(
              "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm",
              activePage === 'settings' 
                ? "bg-accent/15 text-accent font-bold shadow-sm" 
                : "hover:bg-border/40 text-foreground/70"
            )}
          >
            <Settings size={19} />
            <span>הגדרות</span>
          </button>
        </nav>

        {/* Bottom Theme & Lock Footer */}
        <div className="mt-auto pt-3 border-t border-border/50 space-y-3">
          
          {/* Theme Switcher */}
          <div className="bg-background rounded-2xl p-1 flex items-center justify-between border border-border">
            <button 
              onClick={() => setTheme('warm')}
              className={clsx("flex-1 py-1.5 flex items-center justify-center rounded-xl transition-all text-xs font-medium gap-1", theme === 'warm' ? "bg-card shadow-sm text-accent" : "text-foreground/50")}
              title="וניל חמים"
            >
              <Sun size={15} />
              <span className="hidden sm:inline">חמים</span>
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={clsx("flex-1 py-1.5 flex items-center justify-center rounded-xl transition-all text-xs font-medium gap-1", theme === 'dark' ? "bg-card shadow-sm text-accent" : "text-foreground/50")}
              title="חצות"
            >
              <Moon size={15} />
              <span className="hidden sm:inline">חצות</span>
            </button>
            <button 
              onClick={() => setTheme('forest')}
              className={clsx("flex-1 py-1.5 flex items-center justify-center rounded-xl transition-all text-xs font-medium gap-1", theme === 'forest' ? "bg-card shadow-sm text-accent" : "text-foreground/50")}
              title="ירוק אדמה"
            >
              <Leaf size={15} />
              <span className="hidden sm:inline">אדמה</span>
            </button>
          </div>

          {/* Quick Lock Button */}
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium text-xs transition-colors"
          >
            <Lock size={15} />
            <span>נעל אזור אישי</span>
          </button>
        </div>

      </aside>
    </>
  );
}
