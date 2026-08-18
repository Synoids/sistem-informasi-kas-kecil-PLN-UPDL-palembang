import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TransactionPlaceholder } from './pages/TransactionPlaceholder';
import { useAuth } from './hooks/useAuth';

export const App = () => {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/app/transaction/new/:sourceId" element={session ? <TransactionPlaceholder /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
};
