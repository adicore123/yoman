import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'warm' | 'dark' | 'forest';
type Page = 'journal' | 'tasks' | 'media' | 'insights' | 'settings';

interface AppContextType {
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  changePin: (oldPin: string, newPin: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('yoman_auth') === 'true';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('yoman_theme') as Theme) || 'warm';
  });

  const [activePage, setActivePage] = useState<Page>('journal');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yoman_theme', theme);
  }, [theme]);

  const getStoredPin = () => localStorage.getItem('yoman_pin') || '3344';

  const login = (pin: string) => {
    if (pin === getStoredPin()) {
      setIsAuthenticated(true);
      sessionStorage.setItem('yoman_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('yoman_auth');
  };

  const changePin = (oldPin: string, newPin: string) => {
    if (oldPin === getStoredPin()) {
      localStorage.setItem('yoman_pin', newPin);
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        theme,
        setTheme: setThemeState,
        activePage,
        setActivePage,
        changePin
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
