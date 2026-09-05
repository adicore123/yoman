import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService, type UserProfile } from '../services/storage';

type Theme = 'warm' | 'dark' | 'forest';
export type Page = 'journal' | 'tasks' | 'media' | 'insights' | 'settings' | 'superadmin';

interface AppContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  changePin: (oldPin: string, newPin: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('yoman_theme') as Theme) || 'warm';
  });

  const [activePage, setActivePage] = useState<Page>('journal');

  // Verify auth session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.getToken()) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          // If offline, keep local user
          setUser(authService.getUser());
          setIsAuthenticated(!!authService.getToken());
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yoman_theme', theme);
  }, [theme]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err: any) {
      console.warn('Auth attempt error:', err.message || err);
      throw err;
    }
  };

  const register = async (username: string, password: string, displayName?: string): Promise<boolean> => {
    try {
      const data = await authService.register(username, password, displayName);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Registration failed', err);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setActivePage('journal');
  };

  const getStoredPin = () => localStorage.getItem('yoman_pin') || '3344';

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
        user,
        isLoading,
        login,
        register,
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
