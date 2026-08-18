import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';

export const TransactionPlaceholder = () => {
  const { sourceId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button 
          onClick={() => navigate('/app')}
          className="p-1.5 mr-3 text-gray-500 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Buat Transaksi</h1>
      </header>
      
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Transaksi</h2>
        <p className="text-gray-500 max-w-sm mb-8">
          Halaman transaksi untuk ID Kas: <br/>
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">{sourceId}</span><br/><br/>
          Fitur ini akan diimplementasikan pada tahap selanjutnya (Phase 2 - Transaction).
        </p>
        
        <button
          onClick={() => navigate('/app')}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </main>
    </div>
  );
};
