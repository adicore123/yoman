import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock } from 'lucide-react';
import clsx from 'clsx';

export function LockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { login } = useApp();

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (!login(newPin)) {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-300">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl flex flex-col items-center gap-6 sm:gap-8 backdrop-blur-xl bg-opacity-80">
        
        {/* Brand & Lock Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-black text-base shadow-md shadow-accent/20">
              W
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">Wisecare</span>
          </div>

          <div className={clsx(
            "p-3.5 rounded-full transition-colors duration-300",
            error ? "bg-red-100 text-red-500 dark:bg-red-950/40" : "bg-accent/20 text-accent"
          )}>
            {error ? <Lock size={28} /> : <Unlock size={28} />}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">אזור אישי מאובטח</h1>
          <p className="text-xs sm:text-sm text-foreground/60 text-center">הזן את קוד הגישה שלך כדי להיכנס</p>
        </div>

        {/* Pin Dots */}
        <div className="flex gap-4" dir="ltr">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={clsx(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300",
                pin.length > i ? "bg-accent scale-110" : "bg-border",
                error && "bg-red-500 animate-pulse"
              )}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[240px]" dir="ltr">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-medium text-foreground hover:bg-border/50 transition-all active:scale-95 border border-border/30"
            >
              {num}
            </button>
          ))}
          <div className="h-14 w-14 sm:h-16 sm:w-16" />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-medium text-foreground hover:bg-border/50 transition-all active:scale-95 border border-border/30"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-base sm:text-lg font-medium text-foreground hover:bg-border/50 transition-all active:scale-95 border border-border/30"
          >
            מחק
          </button>
        </div>
        
      </div>
    </div>
  );
}
