import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, LogIn, UserPlus, Sparkles, Smile } from 'lucide-react';
import clsx from 'clsx';

type AuthMode = 'login' | 'register';

export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Login fields
  const [username, setUsername] = useState('adicore');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, register } = useApp();

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setShowPassword(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('נא להזין שם משתמש וסיסמה');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(cleanUsername, cleanPassword);
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed'))) {
        setErrorMessage('שגיאת תקשורת עם השרת. ודא חיבור תקין לאינטרנט ונסה שוב.');
      } else {
        setErrorMessage(err.message || 'שם משתמש או סיסמה שגויים');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanPassword = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();
    
    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('שם משתמש וסיסמה הם שדות חובה');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage('שם משתמש חייב להכיל לפחות 3 תווים באנגלית');
      return;
    }

    if (cleanPassword.length < 4) {
      setErrorMessage('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await register(cleanUsername, cleanPassword, regDisplayName.trim() || cleanUsername);
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed'))) {
        setErrorMessage('שגיאת תקשורת עם השרת. ודא חיבור תקין לאינטרנט ונסה שוב.');
      } else {
        setErrorMessage(err.message || 'שגיאה ביצירת החשבון');
      }
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
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl flex flex-col items-center gap-5 backdrop-blur-xl bg-opacity-95">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-accent/25">
            W
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Wisecare</h1>
            <p className="text-xs font-medium text-foreground/60 mt-0.5">
              מערכת יומן בריאות ומשימות רב-משתמשים
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login / Register */}
        <div className="w-full bg-background p-1 rounded-2xl border border-border flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={clsx(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mode === 'login'
                ? "bg-card text-accent shadow-sm border border-border"
                : "text-foreground/50 hover:text-foreground"
            )}
          >
            <LogIn size={15} />
            <span>התחברות</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch('register')}
            className={clsx(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mode === 'register'
                ? "bg-card text-accent shadow-sm border border-border"
                : "text-foreground/50 hover:text-foreground"
            )}
          >
            <UserPlus size={15} />
            <span>פתיחת משתמש חדש</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* ========================================================= */}
        {/* Login Form */}
        {/* ========================================================= */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="w-full space-y-4 animate-in fade-in duration-200">
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
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

            {/* Quick Fill Helper */}
            <div className="w-full pt-4 border-t border-border/60 flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] text-foreground/50">
                משתמש מנהל ראשי (Superadmin):
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
          </form>
        ) : (
          /* ========================================================= */
          /* Register Form */
          /* ========================================================= */
          <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5 animate-in fade-in duration-200">
            {/* Display Name Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground/70">
                שם מלא או כינוי
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="לדוגמה: דנה ישראלי"
                  autoCapitalize="words"
                  autoCorrect="off"
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-foreground/40">
                  <Smile size={18} />
                </div>
              </div>
            </div>

            {/* Desired Username Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground/70">
                שם משתמש (באנגלית, לפחות 3 תווים) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="לדוגמה: dana_cohen"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  required
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-foreground/40">
                  <User size={18} />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground/70">
                סיסמה (לפחות 4 תווים) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="בחר סיסמה"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full ps-10 pe-11 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
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

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground/70">
                אימות סיסמה *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="הקלד שוב את הסיסמה"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  required
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-foreground/40">
                  <Lock size={18} />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-foreground/50 leading-relaxed pt-1">
              בלחיצה על "צור חשבון", ייווצר עבורך אזור אישי מבודד ומאובטח במערכת עם יומן, משימות וסרטונים אישיים שלך בלבד.
            </p>

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
                  <UserPlus size={18} />
                  <span>צור חשבון והתחבר</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
