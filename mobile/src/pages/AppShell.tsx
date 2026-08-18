import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { LogOut, ShieldCheck } from 'lucide-react';

export const AppShell = () => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Petty Cash</h1>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Selamat datang</h2>
          <p className="text-sm text-gray-500 mb-6 truncate">{session.user.email}</p>
          
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
            Authenticated
          </div>
        </div>
      </main>
    </div>
  );
};
