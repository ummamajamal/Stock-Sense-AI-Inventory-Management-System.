import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  History,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  lowStockCount = 0,
}) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Inventory Master',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : null,
      badgeColor: 'bg-[#B87D93]/20 text-[#CE96AA] border border-[#B87D93]/40',
    },
    {
      id: 'operations',
      label: 'Stock In / Out',
      icon: ArrowLeftRight,
      badge: null,
    },
    {
      id: 'transactions',
      label: 'Transaction Ledger',
      icon: History,
      badge: null,
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      icon: Sparkles,
      badge: 'Live',
      badgeColor: 'bg-[#CE96AA]/20 text-[#CE96AA] border border-[#CE96AA]/40',
    },
    {
      id: 'security',
      label: 'Security & RBAC Audit',
      icon: ShieldCheck,
      badge: 'Verified',
      badgeColor: 'bg-[#4E3444] text-[#BBA2B0] border border-[#8E7081]/30',
    },
  ];

  const departments = [
    { name: 'Grocery', color: 'from-[#4E3444] to-[#261520]' },
    { name: 'Clothing', color: 'from-[#4E3444] to-[#261520]' },
    { name: 'Electronics', color: 'from-[#4E3444] to-[#261520]' },
    { name: 'Household', color: 'from-[#4E3444] to-[#261520]' },
  ];

  return (
    <aside className="w-64 bg-[#160B12] border-r border-[#4E3444]/60 flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto hidden md:flex">
      <div className="space-y-6">
        {/* Navigation Items */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#8E7081] uppercase">
            Management Portal
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#261520] text-[#F5EEF2] border border-[#B87D93]/50 shadow-sm'
                    : 'text-[#BBA2B0] hover:text-[#F5EEF2] hover:bg-[#261520]/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#CE96AA]' : 'text-[#8E7081]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor || 'bg-[#4E3444] text-[#BBA2B0]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mall Department Overview */}
        <div className="pt-2 border-t border-[#4E3444]/40">
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#8E7081] uppercase">
              Departments (4)
            </span>
            <Layers className="w-3.5 h-3.5 text-[#8E7081]" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-1">
            {departments.map(dept => (
              <div
                key={dept.name}
                className="bg-[#261520] border border-[#4E3444]/50 rounded-lg p-2 text-left hover:border-[#8E7081]/50 transition-colors cursor-default"
              >
                <div className="text-[11px] font-medium text-[#F5EEF2]">{dept.name}</div>
                <div className="text-[9px] text-[#8E7081]">Nowshera Mall</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Notice Card */}
      <div className="pt-4 border-t border-[#4E3444]/40">
        <div className="p-3 bg-[#261520] rounded-xl border border-[#4E3444]/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#CE96AA] uppercase tracking-wide">
              {user?.role === 'manager' ? 'Manager Clearance' : 'Staff Restricted'}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#CE96AA] animate-pulse"></span>
          </div>
          <p className="text-[11px] text-[#8E7081] leading-relaxed">
            {user?.role === 'manager'
              ? 'Full access to cost margins, product creation & financials.'
              : 'Cost prices and margins strictly protected at backend level.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
