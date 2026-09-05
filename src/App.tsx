import { useApp } from './context/AppContext';
import { LockScreen } from './components/LockScreen';
import { Layout } from './components/Layout';

function App() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LockScreen />;
  }

  return <Layout />;
}

export default App;
