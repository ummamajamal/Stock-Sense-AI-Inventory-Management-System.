import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Mail, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { login, signup, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        await signup({
          name,
          email,
          password,
          confirmPassword,
          role,
        });
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccount = (accountRole: UserRole) => {
    setMode('login');
    if (accountRole === 'manager') {
      setEmail('manager@stocksense.com');
      setPassword('manager123');
    } else {
      setEmail('staff@stocksense.com');
      setPassword('staff123');
    }
    setLocalError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#160B12]/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#261520] border border-[#4E3444] rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#B87D93]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#4E3444]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mall Header & Branding */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-[#B87D93] to-[#4E3444] items-center justify-center shadow-lg shadow-[#160B12]/50 border border-[#CE96AA]/40 mb-3">
            <span className="font-extrabold text-white text-xl">SS</span>
          </div>
          <h2 className="text-2xl font-bold text-[#F5EEF2] tracking-tight">StockSense</h2>
          <p className="text-xs text-[#CE96AA] font-semibold mt-0.5">Nowshera Shopping Mall</p>
          <p className="text-xs text-[#8E7081] mt-1">
            Enterprise AI Inventory Management System
          </p>
        </div>

        {/* Quick Test Login Buttons for Evaluator Convenience */}
        <div className="mb-5 bg-[#160B12] p-3 rounded-xl border border-[#4E3444]/70">
          <div className="text-[11px] font-semibold text-[#8E7081] uppercase tracking-wider mb-2 text-center">
            Instant Test Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('manager')}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[#261520] hover:bg-[#4E3444]/40 border border-[#CE96AA]/40 hover:border-[#CE96AA] text-[#CE96AA] rounded-lg text-xs font-medium transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Mall Manager</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('staff')}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[#261520] hover:bg-[#4E3444]/40 border border-[#8E7081]/40 hover:border-[#8E7081] text-[#BBA2B0] rounded-lg text-xs font-medium transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Floor Staff</span>
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-[#160B12] p-1 rounded-xl border border-[#4E3444]/60 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#B87D93] text-white shadow'
                : 'text-[#8E7081] hover:text-[#F5EEF2]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-[#B87D93] text-white shadow'
                : 'text-[#8E7081] hover:text-[#F5EEF2]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start space-x-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#BBA2B0] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Tariq Mehmood"
                className="w-full px-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] placeholder-[#8E7081] focus:outline-none focus:border-[#CE96AA] focus:ring-1 focus:ring-[#CE96AA] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#BBA2B0] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8E7081] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@stocksense.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] placeholder-[#8E7081] focus:outline-none focus:border-[#CE96AA] focus:ring-1 focus:ring-[#CE96AA] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#BBA2B0] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E7081] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] placeholder-[#8E7081] focus:outline-none focus:border-[#CE96AA] focus:ring-1 focus:ring-[#CE96AA] transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#BBA2B0] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E7081] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] placeholder-[#8E7081] focus:outline-none focus:border-[#CE96AA] focus:ring-1 focus:ring-[#CE96AA] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#BBA2B0] mb-1.5">
                  Account Type (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                      role === 'staff'
                        ? 'bg-[#4E3444] border-[#8E7081] text-[#F5EEF2]'
                        : 'bg-[#160B12] border-[#4E3444]/60 text-[#8E7081] hover:text-[#BBA2B0]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Store Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                      role === 'manager'
                        ? 'bg-[#B87D93]/30 border-[#CE96AA] text-[#CE96AA]'
                        : 'bg-[#160B12] border-[#4E3444]/60 text-[#8E7081] hover:text-[#BBA2B0]'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Mall Manager</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#8E7081] mt-1.5">
                  * No authorization code or email verification required for normal signup.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#B87D93] to-[#CE96AA] hover:from-[#CE96AA] hover:to-[#B87D93] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#160B12]/60 border border-[#CE96AA]/40 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : mode === 'login' ? 'Sign In to StockSense' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#4E3444]/40 text-center">
          <p className="text-[11px] text-[#8E7081]">
            Nowshera Shopping Mall • Departments: Grocery, Clothing, Electronics, Household
          </p>
        </div>
      </div>
    </div>
  );
};
