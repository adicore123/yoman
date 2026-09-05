import { useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Layout } from './components/Layout';

function App() {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
          <span className="text-xs text-foreground/50 font-medium">טוען נתונים...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Layout />;
}

export default App;
