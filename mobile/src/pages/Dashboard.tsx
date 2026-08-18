import { useEffect, useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { cashService } from '../services/cash.service';
import type { AuthorizedBalance } from '../services/cash.service';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Plus, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<AuthorizedBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalances = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await cashService.getAuthorizedBalances();
      setBalances(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat saldo kas. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchBalances();
    }
  }, [session, fetchBalances]);

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

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Petty Cash</h1>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{session.user.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>
      
      <main className="flex-1 p-4 pb-20">
        <div className="flex justify-between items-center mb-6 mt-2">
          <h2 className="text-sm font-semibold text-gray-600 tracking-wide uppercase">Saldo Kas Anda</h2>
          <button 
            onClick={() => fetchBalances(true)} 
            disabled={loading || refreshing}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="h-10 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : !error && balances.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium mb-2">Tidak Ada Akses</h3>
            <p className="text-gray-500 text-sm">Anda tidak memiliki akses ke sumber kas apapun. Hubungi administrator.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map((source) => (
              <div key={source.cash_source_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-500 text-xs font-semibold tracking-wide uppercase">
                      {source.code} • {source.type}
                    </h3>
                    {source.is_active === false && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Nonaktif</span>
                    )}
                  </div>
                  <h4 className="text-gray-900 font-medium text-lg mb-4">{source.name}</h4>
                  
                  <div className="mb-2">
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                      {formatRupiah(source.balance)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                  <button
                    disabled={!source.is_active}
                    onClick={() => navigate(`/app/transaction/new/${source.cash_source_id}`)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Transaksi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
