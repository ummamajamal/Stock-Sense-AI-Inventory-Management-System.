import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { StockOperationsView } from './views/StockOperationsView';
import { TransactionsView } from './views/TransactionsView';
import { AiAssistantView } from './views/AiAssistantView';
import { SecurityAuditView } from './views/SecurityAuditView';
import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [preselectedProductId, setPreselectedProductId] = useState<string | null>(null);

  // Fetch low stock count for sidebar badge
  useEffect(() => {
    if (user) {
      api
        .getDashboard()
        .then(d => setLowStockCount(d.lowStockCount))
        .catch(() => {});
    }
  }, [user, activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#160B12] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B87D93] to-[#4E3444] flex items-center justify-center border border-[#CE96AA]/40 shadow-xl shadow-[#160B12]/80">
          <span className="font-extrabold text-white text-xl">SS</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-[#8E7081]">
          <RefreshCw className="w-4 h-4 text-[#CE96AA] animate-spin" />
          <span>Initializing StockSense Session for Nowshera Shopping Mall...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#160B12] relative overflow-hidden flex items-center justify-center">
        <AuthModal />
      </div>
    );
  }

  const handleQuickRestock = (productId: string) => {
    setPreselectedProductId(productId);
    setActiveView('inventory');
  };

  return (
    <div className="min-h-screen bg-[#160B12] text-[#F5EEF2] flex flex-col selection:bg-[#B87D93] selection:text-white">
      {/* Top Navbar */}
      <Navbar activeView={activeView} setActiveView={setActiveView} />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          lowStockCount={lowStockCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {activeView === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveView}
              onQuickRestock={handleQuickRestock}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryView
              preselectedProductId={preselectedProductId}
            />
          )}

          {activeView === 'operations' && <StockOperationsView />}

          {activeView === 'transactions' && <TransactionsView />}

          {activeView === 'ai' && <AiAssistantView />}

          {activeView === 'security' && <SecurityAuditView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeView={activeView}
        setActiveView={setActiveView}
        lowStockCount={lowStockCount}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
