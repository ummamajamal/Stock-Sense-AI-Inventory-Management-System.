import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardData } from '../types';
import {
  Package,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onQuickRestock: (productId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickRestock,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#CE96AA] animate-spin" />
          <p className="text-sm text-[#8E7081]">Retrieving Nowshera Mall Inventory Metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-[#261520] border border-red-900/50 rounded-2xl text-center max-w-xl mx-auto my-8">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#F5EEF2]">Unable to Load Dashboard</h3>
        <p className="text-sm text-[#8E7081] mt-1 mb-4">{error || 'Unknown error'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-[#B87D93] text-white text-xs font-semibold rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#261520] to-[#160B12] p-5 sm:p-6 rounded-2xl border border-[#4E3444]/70">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#CE96AA] uppercase tracking-wider">
              Nowshera Shopping Mall
            </span>
            <span className="text-xs text-[#8E7081]">•</span>
            <span className="text-xs text-[#8E7081]">Live Inventory Status</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5EEF2] mt-1">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-[#BBA2B0] mt-0.5">
            Active Clearance:{' '}
            <span
              className={`font-semibold uppercase ${
                user?.role === 'manager' ? 'text-[#CE96AA]' : 'text-[#8E7081]'
              }`}
            >
              {user?.role}
            </span>
            {user?.role === 'staff' && ' (Operational Inventory Clearance)'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('ai')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#261520] hover:bg-[#4E3444]/60 border border-[#CE96AA]/40 text-[#CE96AA] text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#CE96AA]" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={fetchDashboard}
            className="p-2 bg-[#261520] hover:bg-[#4E3444]/40 border border-[#4E3444] text-[#BBA2B0] hover:text-[#F5EEF2] rounded-xl transition-colors"
            title="Refresh inventory metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if applicable */}
      {data.lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-[#261520] to-[#160B12] border border-[#B87D93]/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-[#B87D93]/20 border border-[#B87D93]/40 text-[#CE96AA] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-[#F5EEF2]">
                  {data.lowStockCount} Products Below Minimum Threshold
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#B87D93]/30 text-[#CE96AA]">
                  Attention Needed
                </span>
              </div>
              <p className="text-xs text-[#8E7081] mt-0.5">
                Popular items in Grocery, Electronics, or Household risk running out. Review and restock to maintain mall operations.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="self-start sm:self-auto px-4 py-2 bg-[#B87D93] hover:bg-[#CE96AA] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            Inspect Low Stock
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-[#261520] border border-[#4E3444]/60 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E7081]">Total Products</span>
            <div className="p-2 rounded-xl bg-[#160B12] border border-[#4E3444]/40 text-[#CE96AA]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5EEF2] mt-2">
            {data.totalProducts}
          </div>
          <p className="text-[11px] text-[#8E7081] mt-1">Across 4 departments</p>
        </div>

        {/* Total In-Stock Units */}
        <div className="bg-[#261520] border border-[#4E3444]/60 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E7081]">Total Stock Units</span>
            <div className="p-2 rounded-xl bg-[#160B12] border border-[#4E3444]/40 text-[#CE96AA]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5EEF2] mt-2">
            {data.totalStockUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#8E7081] mt-1">Total physical inventory units</p>
        </div>

        {/* Low Stock Items */}
        <div className="bg-[#261520] border border-[#4E3444]/60 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E7081]">Low-Stock Alerts</span>
            <div className="p-2 rounded-xl bg-[#160B12] border border-[#4E3444]/40 text-[#CE96AA]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5EEF2] mt-2">
            {data.lowStockCount}
          </div>
          <p className="text-[11px] text-[#8E7081] mt-1">Threshold alerts active</p>
        </div>

        {/* Transactions logged */}
        <div className="bg-[#261520] border border-[#4E3444]/60 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E7081]">Recent Movements</span>
            <div className="p-2 rounded-xl bg-[#160B12] border border-[#4E3444]/40 text-[#CE96AA]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5EEF2] mt-2">
            {data.recentTransactions.length}
          </div>
          <p className="text-[11px] text-[#8E7081] mt-1">Audit log transactions</p>
        </div>
      </div>

      {/* MANAGER ONLY FINANCIAL SECTION */}
      {user?.role === 'manager' && data.financials ? (
        <div className="bg-gradient-to-br from-[#261520] to-[#160B12] p-5 sm:p-6 rounded-2xl border border-[#CE96AA]/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-[#CE96AA]" />
              <h2 className="text-sm font-bold text-[#F5EEF2] uppercase tracking-wide">
                Mall Financial Analytics (Manager Clearance Only)
              </h2>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#B87D93]/20 text-[#CE96AA] border border-[#B87D93]/40">
              CONFIDENTIAL
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#160B12] p-4 rounded-xl border border-[#4E3444]/50">
              <span className="text-[11px] text-[#8E7081]">Total Inventory Cost</span>
              <div className="text-xl sm:text-2xl font-bold text-[#F5EEF2] mt-1">
                PKR {data.financials.totalInventoryCost.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#8E7081] mt-0.5">Procurement capital deployed</p>
            </div>

            <div className="bg-[#160B12] p-4 rounded-xl border border-[#4E3444]/50">
              <span className="text-[11px] text-[#8E7081]">Retail Valuation</span>
              <div className="text-xl sm:text-2xl font-bold text-[#CE96AA] mt-1">
                PKR {data.financials.totalInventoryValuation.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#8E7081] mt-0.5">Expected total gross value</p>
            </div>

            <div className="bg-[#160B12] p-4 rounded-xl border border-[#4E3444]/50">
              <span className="text-[11px] text-[#8E7081]">Projected Gross Profit</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
                PKR {data.financials.projectedProfit.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#8E7081] mt-0.5">Valuation minus procurement cost</p>
            </div>

            <div className="bg-[#160B12] p-4 rounded-xl border border-[#4E3444]/50">
              <span className="text-[11px] text-[#8E7081]">Average Gross Margin</span>
              <div className="text-xl sm:text-2xl font-bold text-[#CE96AA] mt-1">
                {data.financials.profitMarginPercentage}%
              </div>
              <p className="text-[10px] text-[#8E7081] mt-0.5">Mall portfolio margin</p>
            </div>
          </div>
        </div>
      ) : user?.role === 'staff' ? (
        <div className="bg-[#261520]/60 p-4 rounded-2xl border border-[#4E3444]/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs text-[#8E7081]">
            <ShieldAlert className="w-4 h-4 text-[#8E7081]" />
            <span>
              Financial cost metrics and profit margins are protected and restricted to Mall Managers.
            </span>
          </div>
          <span className="text-[10px] text-[#8E7081] uppercase font-semibold">RBAC Enforced</span>
        </div>
      ) : null}

      {/* 4 Departments Breakdown Matrix */}
      <div className="bg-[#261520] border border-[#4E3444]/60 p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5EEF2]">Departmental Stock Breakdown</h2>
            <p className="text-xs text-[#8E7081]">
              Nowshera Shopping Mall's four core inventory departments
            </p>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs text-[#CE96AA] hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {data.departmentBreakdown.map(dept => (
            <div
              key={dept.department}
              className="bg-[#160B12] border border-[#4E3444]/60 p-4 rounded-xl flex flex-col justify-between hover:border-[#8E7081]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[#F5EEF2]">{dept.department}</span>
                  {dept.lowStockCount > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#B87D93]/30 text-[#CE96AA]">
                      {dept.lowStockCount} Low
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#261520] text-[#8E7081]">
                      Healthy
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-[#CE96AA]">
                  {dept.stockUnits} <span className="text-xs font-normal text-[#8E7081]">units</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#4E3444]/40 flex items-center justify-between text-xs text-[#8E7081]">
                <span>{dept.productCount} SKUs</span>
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-[11px] text-[#BBA2B0] hover:text-[#CE96AA]"
                >
                  Filter →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Low Stock Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products List */}
        <div className="bg-[#261520] border border-[#4E3444]/60 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#CE96AA]" />
                <h3 className="text-sm font-bold text-[#F5EEF2]">Critical Restock List</h3>
              </div>
              <span className="text-xs text-[#8E7081]">{data.lowStockItems.length} items</span>
            </div>

            {data.lowStockItems.length === 0 ? (
              <p className="text-xs text-[#8E7081] py-8 text-center">
                All products have healthy inventory levels above minimum thresholds.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.lowStockItems.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#160B12] rounded-xl border border-[#4E3444]/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#F5EEF2]">{item.name}</div>
                      <div className="text-[11px] text-[#8E7081]">
                        {item.department} • Alert at {item.minAlert} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#CE96AA]">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="text-[10px] text-red-400 font-semibold">Shortage</div>
                      </div>
                      <button
                        onClick={() => onQuickRestock(item.id)}
                        className="px-2.5 py-1 bg-[#4E3444] hover:bg-[#8E7081] text-[#F5EEF2] rounded-lg text-xs font-medium transition-colors"
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#4E3444]/40 text-right">
            <button
              onClick={() => onNavigate('operations')}
              className="text-xs text-[#CE96AA] hover:underline"
            >
              Open Stock In / Out Operations →
            </button>
          </div>
        </div>

        {/* Recent Activity / Audit Log */}
        <div className="bg-[#261520] border border-[#4E3444]/60 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#F5EEF2]">Recent Stock Movement Activity</h3>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs text-[#CE96AA] hover:underline"
              >
                View Full Ledger →
              </button>
            </div>

            {data.recentTransactions.length === 0 ? (
              <p className="text-xs text-[#8E7081] py-8 text-center">
                No recent transactions recorded.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.recentTransactions.slice(0, 5).map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 bg-[#160B12] rounded-xl border border-[#4E3444]/50 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-1.5 rounded-lg text-xs font-bold ${
                          tx.type === 'stock_in'
                            ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                            : 'bg-[#B87D93]/20 text-[#CE96AA] border border-[#B87D93]/40'
                        }`}
                      >
                        {tx.type === 'stock_in' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#F5EEF2]">
                          {tx.productName}
                        </div>
                        <div className="text-[11px] text-[#8E7081]">
                          {tx.type.replace('_', ' ').toUpperCase()} • {tx.userName} ({tx.userRole})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-bold ${
                          tx.type === 'stock_in' ? 'text-emerald-300' : 'text-[#CE96AA]'
                        }`}
                      >
                        {tx.type === 'stock_in' ? '+' : '-'}
                        {tx.quantity} units
                      </div>
                      <div className="text-[10px] text-[#8E7081]">
                        {new Date(tx.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#4E3444]/40 flex items-center justify-between text-xs text-[#8E7081]">
            <span>Nowshera Shopping Mall Audit Ledger</span>
            <span>Real-time Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
