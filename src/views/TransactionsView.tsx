import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import {
  History,
  Search,
  Filter,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const list = await api.getTransactions({ limit: 200 });
      setTransactions(list);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch transaction ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.productName.toLowerCase().includes(search.toLowerCase()) ||
      t.sku.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      (t.supplier && t.supplier.toLowerCase().includes(search.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDept === 'All' || t.department === selectedDept;
    const matchesType = selectedType === 'All' || t.type === selectedType;

    return matchesSearch && matchesDept && matchesType;
  });

  const exportToCsv = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Transaction ID',
      'Date & Time',
      'Product Name',
      'SKU',
      'Department',
      'Type',
      'Quantity Delta',
      'Previous Stock',
      'New Stock',
      'Executed By',
      'Role',
      'Supplier',
      'Notes',
    ];

    const rows = filteredTransactions.map(t => [
      t.id,
      new Date(t.timestamp).toLocaleString(),
      `"${t.productName.replace(/"/g, '""')}"`,
      t.sku,
      t.department,
      t.type,
      t.quantity,
      t.previousStock,
      t.newStock,
      `"${t.userName}"`,
      t.userRole,
      `"${t.supplier || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#F5EEF2]">Audit Transaction Ledger</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#261520] text-[#CE96AA] border border-[#4E3444]">
              {transactions.length} Records
            </span>
          </div>
          <p className="text-xs text-[#8E7081] mt-0.5">
            Immutable persistent audit trail for Nowshera Shopping Mall
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={exportToCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#261520] hover:bg-[#4E3444]/60 border border-[#4E3444] text-[#BBA2B0] hover:text-[#F5EEF2] rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchTransactions}
            className="p-2 bg-[#261520] hover:bg-[#4E3444]/40 border border-[#4E3444] text-[#BBA2B0] hover:text-[#F5EEF2] rounded-xl transition-colors"
            title="Refresh transaction ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#261520] border border-[#4E3444]/60 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E7081] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by product, SKU, user, notes..."
              className="w-full pl-10 pr-4 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] placeholder-[#8E7081] focus:outline-none focus:border-[#CE96AA]"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Grocery">Grocery</option>
            <option value="Clothing">Clothing</option>
            <option value="Electronics">Electronics</option>
            <option value="Household">Household</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
          >
            <option value="All">All Movement Types</option>
            <option value="stock_in">Stock In</option>
            <option value="sale">Sale / Dispatch</option>
            <option value="damaged">Damaged</option>
            <option value="return">Return</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#261520] border border-[#4E3444]/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#160B12] text-[#8E7081] uppercase tracking-wider font-semibold border-b border-[#4E3444]/60">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Stock Transition</th>
                <th className="py-3 px-4">Staff / User</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4E3444]/40 text-[#F5EEF2]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8E7081]">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isPositive = t.type === 'stock_in' || t.type === 'return';

                  return (
                    <tr key={t.id} className="hover:bg-[#160B12]/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#8E7081]">
                        {new Date(t.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(t.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#F5EEF2]">{t.productName}</div>
                        <div className="text-[10px] text-[#8E7081] font-mono">{t.sku}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#160B12] border border-[#4E3444] text-[#BBA2B0]">
                          {t.department}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPositive
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : 'bg-[#B87D93]/20 text-[#CE96AA] border border-[#B87D93]/40'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{t.type.replace('_', ' ').toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-[#CE96AA]'}>
                          {isPositive ? '+' : '-'}
                          {t.quantity}
                        </span>
                      </td>

                      {/* Transition: prev -> new */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#8E7081]">
                        {t.previousStock} →{' '}
                        <span className="text-[#F5EEF2] font-semibold">{t.newStock}</span>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#F5EEF2]">{t.userName}</div>
                        <div className="text-[10px] text-[#8E7081] uppercase font-semibold">
                          {t.userRole}
                        </div>
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3.5 px-4 text-[#8E7081] max-w-xs truncate" title={t.notes}>
                        {t.notes || (t.supplier ? `Supplier: ${t.supplier}` : '—')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
