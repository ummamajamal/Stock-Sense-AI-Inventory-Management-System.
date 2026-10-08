import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, LogOut, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  const { user, logout, quickSwitch } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#160B12]/95 backdrop-blur-md border-b border-[#4E3444]/60 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Mall & Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B87D93] to-[#4E3444] flex items-center justify-center shadow-lg shadow-[#160B12]/50 border border-[#CE96AA]/40">
            <span className="font-extrabold text-white text-lg tracking-wider">SS</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-[#F5EEF2]">StockSense</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#261520] text-[#CE96AA] border border-[#4E3444]">
                Nowshera Shopping Mall
              </span>
            </div>
            <p className="text-[11px] text-[#8E7081] hidden sm:block">
              Centralized AI Inventory Management System
            </p>
          </div>
        </div>

        {/* User Status, Role Switcher & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Quick Role Switcher for seamless test verification */}
              <div className="hidden md:flex items-center bg-[#261520] p-1 rounded-lg border border-[#4E3444]">
                <button
                  onClick={() => quickSwitch('manager')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                    user.role === 'manager'
                      ? 'bg-[#B87D93] text-white shadow-sm'
                      : 'text-[#BBA2B0] hover:text-white'
                  }`}
                  title="Switch to Mall Manager account (manager@stocksense.com)"
                >
                  Manager
                </button>
                <button
                  onClick={() => quickSwitch('staff')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                    user.role === 'staff'
                      ? 'bg-[#8E7081] text-white shadow-sm'
                      : 'text-[#BBA2B0] hover:text-white'
                  }`}
                  title="Switch to Store Staff account (staff@stocksense.com)"
                >
                  Staff
                </button>
              </div>

              {/* Active User Badge */}
              <div className="flex items-center space-x-2.5 bg-[#261520] border border-[#4E3444] px-3 py-1.5 rounded-lg">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    user.role === 'manager'
                      ? 'bg-[#B87D93]/30 text-[#CE96AA] border border-[#CE96AA]/50'
                      : 'bg-[#4E3444]/60 text-[#BBA2B0] border border-[#8E7081]/40'
                  }`}
                >
                  {user.role === 'manager' ? (
                    <Shield className="w-3.5 h-3.5 text-[#CE96AA]" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-[#BBA2B0]" />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-[#F5EEF2] leading-tight">
                    {user.name}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        user.role === 'manager' ? 'text-[#CE96AA]' : 'text-[#8E7081]'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span className="text-[10px] text-[#4E3444]">•</span>
                    <span className="text-[10px] text-[#8E7081]">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-[#261520] text-[#BBA2B0] hover:text-[#F5EEF2] hover:bg-[#4E3444]/50 border border-[#4E3444] transition-colors"
                title="Log out of session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};
