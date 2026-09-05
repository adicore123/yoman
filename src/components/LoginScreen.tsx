import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export function LoginScreen() {
  const [username, setUsername] = useState('adicore');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('נא להזין שם משתמש וסיסמה');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || 'שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setUsername('adicore');
    setPassword('c38410a3');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-300">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl flex flex-col items-center gap-6 backdrop-blur-xl bg-opacity-95">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-accent/25">
            W
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Wisecare</h1>
            <p className="text-xs font-medium text-foreground/60 mt-0.5">
              מערכת ניהול יומן ומשימות רב-משתמשים (Multi-Tenant)
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/70">
              שם משתמש
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הזן שם משתמש"
                autoComplete="username"
                className="w-full ps-10 pe-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                required
              />
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-foreground/40">
                <User size={18} />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/70">
              סיסמה
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה"
                autoComplete="current-password"
                className="w-full ps-10 pe-11 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                required
              />
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-foreground/40">
                <Lock size={18} />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-foreground/40 hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "w-full mt-2 py-3 px-4 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2",
              loading && "opacity-75 cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>התחבר לחשבון</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Helper */}
        <div className="w-full pt-4 border-t border-border/60 flex flex-col items-center gap-2 text-center">
          <span className="text-[11px] text-foreground/50">
            משתמש מנהל ראשי מוגדר מראש:
          </span>
          <button
            type="button"
            onClick={handleFillCredentials}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-xs font-semibold"
          >
            <Sparkles size={14} />
            <span>הזן אוטומטית פרטי adicore</span>
          </button>
        </div>

      </div>
    </div>
  );
}
