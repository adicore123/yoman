import { useState, useEffect } from 'react';
import { Search, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onAddEntry: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ onAddEntry, onToggleSidebar }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayDate = time.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const displayTime = time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="h-16 md:h-20 border-b border-border flex items-center justify-between px-3 sm:px-6 md:px-8 bg-card/60 backdrop-blur-md sticky top-0 z-20 transition-colors duration-300">
      
      {/* Right side: Hamburger (on mobile) & Time/Date & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Hamburger button for mobile/tablet */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-foreground/70 hover:text-foreground hover:bg-border/50 transition-colors active:scale-95 shrink-0"
          aria-label="פתח תפריט"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Brand indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-black text-sm shrink-0">
            W
          </div>
          <span className="font-extrabold text-foreground text-sm tracking-tight hidden min-[360px]:inline">Wisecare</span>
        </div>

        {/* Time and Date Display (Desktop & Tablet) */}
        <div className="hidden sm:flex flex-col">
          <h2 className="text-lg md:text-xl font-semibold text-foreground leading-tight">{displayTime}</h2>
          <p className="text-xs text-foreground/60">{displayDate}</p>
        </div>
      </div>

      {/* Left side: Search & Add Entry Button */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        
        {/* Responsive Search Input */}
        <div className="relative">
          <Search className="absolute start-2.5 sm:start-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" size={15} />
          <input 
            type="text"
            placeholder="חיפוש..."
            className="w-20 min-[370px]:w-28 sm:w-44 md:w-60 ps-7 sm:ps-9 pe-2.5 sm:pe-3 py-1.5 sm:py-2 rounded-full border border-border bg-background/80 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-xs sm:text-sm text-foreground placeholder:text-foreground/40 focus:w-28 min-[370px]:focus:w-36 sm:focus:w-44"
          />
        </div>

        {/* Add Entry Button */}
        <button 
          onClick={onAddEntry}
          className="flex items-center gap-1.5 sm:gap-2 bg-accent text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm hover:bg-accent/90 transition-transform active:scale-95 shadow-md sm:shadow-lg shadow-accent/20 shrink-0"
        >
          <Plus size={16} />
          <span>רשומה חדשה</span>
        </button>
      </div>

    </header>
  );
}
