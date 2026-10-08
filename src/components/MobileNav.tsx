import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  History,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface MobileNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
  lowStockCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  setActiveView,
  lowStockCount = 0,
}) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: lowStockCount > 0 },
    { id: 'operations', label: 'Stock', icon: ArrowLeftRight },
    { id: 'transactions', label: 'Ledger', icon: History },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'security', label: 'Audit', icon: ShieldCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#160B12]/95 backdrop-blur-md border-t border-[#4E3444]/60 px-2 py-2 flex items-center justify-around">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium relative transition-colors ${
              isActive ? 'text-[#CE96AA]' : 'text-[#8E7081]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#B87D93]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
