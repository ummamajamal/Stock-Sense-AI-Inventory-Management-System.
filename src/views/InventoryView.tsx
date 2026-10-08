import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, DepartmentType } from '../types';
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  AlertTriangle,
  RefreshCw,
  Shield,
  ShieldAlert,
  CheckCircle2,
  X,
} from 'lucide-react';

interface InventoryViewProps {
  onDirectStockAction?: (productId: string, action: 'stock_in' | 'stock_out') => void;
  preselectedProductId?: string | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onDirectStockAction,
  preselectedProductId,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockActionProduct, setStockActionProduct] = useState<{
    product: Product;
    type: 'stock_in' | 'stock_out';
  } | null>(null);

  // Quick stock action form inside modal
  const [stockQty, setStockQty] = useState<number>(1);
  const [stockSupplier, setStockSupplier] = useState('');
  const [stockNotes, setStockNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Add Product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdDept, setNewProdDept] = useState<DepartmentType>('Grocery');
  const [newProdSupplier, setNewProdSupplier] = useState('');
  const [newProdQty, setNewProdQty] = useState(10);
  const [newProdMinAlert, setNewProdMinAlert] = useState(5);
  const [newProdUnit, setNewProdUnit] = useState('pcs');
  const [newProdCostPrice, setNewProdCostPrice] = useState(500);
  const [newProdSellingPrice, setNewProdSellingPrice] = useState(800);

  // Edit Pricing form state
  const [editSellingPrice, setEditSellingPrice] = useState(0);
  const [editCostPrice, setEditCostPrice] = useState(0);
  const [editMinAlert, setEditMinAlert] = useState(0);

  // Security 403 test feedback
  const [rbacTestNotice, setRbacTestNotice] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const list = await api.getProducts();
      setProducts(list);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Open modal if preselected
  useEffect(() => {
    if (preselectedProductId && products.length > 0) {
      const found = products.find(p => p.id === preselectedProductId);
      if (found) {
        setStockActionProduct({ product: found, type: 'stock_in' });
        setStockSupplier(found.supplier);
      }
    }
  }, [preselectedProductId, products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'All' || p.department === selectedDept;
    const matchesLowStock = !onlyLowStock || p.quantity <= p.minStockAlert;

    return matchesSearch && matchesDept && matchesLowStock;
  });

  const handleStockActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockActionProduct) return;

    setActionError(null);
    setActionSuccess(null);
    setIsSubmittingAction(true);

    try {
      const res = await api.recordStockMovement({
        productId: stockActionProduct.product.id,
        type: stockActionProduct.type,
        quantity: stockQty,
        supplier: stockActionProduct.type === 'stock_in' ? stockSupplier : undefined,
        notes: stockNotes || undefined,
      });

      setActionSuccess(res.message);
      // Refresh inventory
      await fetchProducts();

      setTimeout(() => {
        setStockActionProduct(null);
        setActionSuccess(null);
        setStockQty(1);
        setStockNotes('');
      }, 1200);
    } catch (err: any) {
      setActionError(err?.message || 'Stock operation failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmittingAction(true);

    try {
      await api.createProduct({
        name: newProdName,
        sku: newProdSku,
        department: newProdDept,
        supplier: newProdSupplier,
        quantity: newProdQty,
        minStockAlert: newProdMinAlert,
        unit: newProdUnit,
        costPrice: newProdCostPrice,
        sellingPrice: newProdSellingPrice,
      });

      setShowAddModal(false);
      await fetchProducts();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to create product');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleEditPricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setActionError(null);
    setIsSubmittingAction(true);

    try {
      await api.updatePricing(editingProduct.id, {
        sellingPrice: editSellingPrice,
        costPrice: editCostPrice,
        minStockAlert: editMinAlert,
      });

      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update pricing');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Direct Staff test to prove backend returns 403 Forbidden
  const testStaffUnauthorizedAction = async (productId: string) => {
    setRbacTestNotice(null);
    try {
      await api.updatePricing(productId, { sellingPrice: 99999 });
      setRbacTestNotice('Security failure: Staff was able to update price!');
    } catch (err: any) {
      if (err?.status === 403) {
        setRbacTestNotice(
          `Security Test PASSED: Backend rejected Staff request with 403 Forbidden (${err.message})`
        );
      } else {
        setRbacTestNotice(`Backend responded with error: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#F5EEF2]">Inventory Master</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#261520] text-[#CE96AA] border border-[#4E3444]">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-[#8E7081] mt-0.5">
            Central catalog across Nowshera Shopping Mall
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {user?.role === 'manager' && (
            <button
              onClick={() => {
                setShowAddModal(true);
                setActionError(null);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#B87D93] hover:bg-[#CE96AA] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}

          <button
            onClick={fetchProducts}
            className="p-2 bg-[#261520] hover:bg-[#4E3444]/40 border border-[#4E3444] text-[#BBA2B0] hover:text-[#F5EEF2] rounded-xl transition-colors"
            title="Refresh product list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RBAC Direct Test Banner for Staff */}
      {user?.role === 'staff' && (
        <div className="p-3.5 bg-[#261520] border border-[#4E3444] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-[#8E7081]">
            <ShieldAlert className="w-4 h-4 text-[#CE96AA] shrink-0" />
            <span>
              <strong>Staff View:</strong> Cost prices are redacted by backend. Price management is restricted.
            </span>
          </div>
          <button
            onClick={() => products[0] && testStaffUnauthorizedAction(products[0].id)}
            className="px-3 py-1.5 bg-[#160B12] hover:bg-[#4E3444]/40 border border-[#4E3444] text-[#CE96AA] rounded-lg font-medium transition-all text-left sm:text-center shrink-0"
          >
            Test Direct Price Change (Verify 403 Forbidden)
          </button>
        </div>
      )}

      {rbacTestNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            rbacTestNotice.includes('PASSED')
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/40 border-red-800/60 text-red-200'
          }`}
        >
          <span>{rbacTestNotice}</span>
          <button
            onClick={() => setRbacTestNotice(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#261520] border border-[#4E3444]/60 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E7081] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name, SKU (e.g. ELEC-CBL), or supplier..."
              className="w-full pl-10 pr-4 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] placeholder-[#8E7081] focus:outline-none focus:border-[#CE96AA]"
            />
          </div>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
              onlyLowStock
                ? 'bg-[#B87D93]/20 border-[#CE96AA] text-[#CE96AA]'
                : 'bg-[#160B12] border-[#4E3444] text-[#8E7081] hover:text-[#BBA2B0]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alerts Only</span>
          </button>
        </div>

        {/* Department Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1">
          {['All', 'Grocery', 'Clothing', 'Electronics', 'Household'].map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? 'bg-[#B87D93] text-white shadow-sm'
                  : 'bg-[#160B12] text-[#8E7081] hover:text-[#F5EEF2] border border-[#4E3444]/60'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table / Grid */}
      <div className="bg-[#261520] border border-[#4E3444]/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#160B12] text-[#8E7081] uppercase tracking-wider font-semibold border-b border-[#4E3444]/60">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Retail Price</th>
                {user?.role === 'manager' && (
                  <>
                    <th className="py-3 px-4 text-[#CE96AA]">Cost Price</th>
                    <th className="py-3 px-4 text-[#CE96AA]">Est. Margin</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4E3444]/40 text-[#F5EEF2]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.role === 'manager' ? 8 : 6}
                    className="py-12 text-center text-[#8E7081]"
                  >
                    No products matched your search or department filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLow = product.quantity <= product.minStockAlert;
                  const marginPct =
                    product.costPrice !== undefined && product.sellingPrice > 0
                      ? Math.round(
                          ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100
                        )
                      : null;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#160B12]/50 transition-colors group"
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#F5EEF2] group-hover:text-[#CE96AA] transition-colors">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-[#8E7081] font-mono mt-0.5">
                          {product.sku}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#160B12] border border-[#4E3444] text-[#BBA2B0]">
                          {product.department}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 text-[#BBA2B0]">{product.supplier}</td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold ${
                              isLow ? 'text-[#CE96AA]' : 'text-[#F5EEF2]'
                            }`}
                          >
                            {product.quantity} {product.unit}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#B87D93]/30 text-[#CE96AA] border border-[#B87D93]/50">
                              Low (≤{product.minStockAlert})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Retail Selling Price */}
                      <td className="py-3.5 px-4 font-semibold text-[#F5EEF2]">
                        PKR {product.sellingPrice.toLocaleString()}
                      </td>

                      {/* Manager-only Financials */}
                      {user?.role === 'manager' && (
                        <>
                          <td className="py-3.5 px-4 text-[#8E7081] font-mono">
                            {product.costPrice !== undefined
                              ? `PKR ${product.costPrice.toLocaleString()}`
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            {marginPct !== null ? (
                              <span
                                className={`font-semibold ${
                                  marginPct > 20 ? 'text-emerald-400' : 'text-[#CE96AA]'
                                }`}
                              >
                                {marginPct}%
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Stock In */}
                          <button
                            onClick={() => {
                              setStockActionProduct({ product, type: 'stock_in' });
                              setStockSupplier(product.supplier);
                              setStockQty(10);
                              setActionError(null);
                            }}
                            className="px-2 py-1 bg-[#160B12] hover:bg-emerald-950/40 text-emerald-300 border border-emerald-900/60 rounded-lg text-[11px] font-medium transition-colors"
                            title="Stock In: Receive inventory"
                          >
                            + Stock In
                          </button>

                          {/* Quick Stock Out / Sale */}
                          <button
                            onClick={() => {
                              setStockActionProduct({ product, type: 'stock_out' });
                              setStockQty(1);
                              setActionError(null);
                            }}
                            className="px-2 py-1 bg-[#160B12] hover:bg-[#4E3444]/60 text-[#BBA2B0] hover:text-[#F5EEF2] border border-[#4E3444] rounded-lg text-[11px] font-medium transition-colors"
                            title="Stock Out: Dispatch or sale"
                          >
                            - Stock Out
                          </button>

                          {/* Manager Edit Pricing */}
                          {user?.role === 'manager' && (
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setEditSellingPrice(product.sellingPrice);
                                setEditCostPrice(product.costPrice || 0);
                                setEditMinAlert(product.minStockAlert);
                                setActionError(null);
                              }}
                              className="p-1 bg-[#160B12] hover:bg-[#4E3444]/40 text-[#CE96AA] border border-[#4E3444] rounded-lg transition-colors"
                              title="Edit Pricing & Thresholds (Manager Only)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK STOCK IN / OUT MODAL */}
      {stockActionProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#160B12]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#261520] border border-[#4E3444] rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setStockActionProduct(null)}
              className="absolute top-4 right-4 text-[#8E7081] hover:text-[#F5EEF2]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div
                className={`p-2 rounded-xl text-xs font-bold ${
                  stockActionProduct.type === 'stock_in'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-[#B87D93]/30 text-[#CE96AA] border border-[#CE96AA]/50'
                }`}
              >
                {stockActionProduct.type === 'stock_in' ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5EEF2]">
                  {stockActionProduct.type === 'stock_in' ? 'Stock In (Receive)' : 'Stock Out (Dispatch/Sale)'}
                </h3>
                <p className="text-xs text-[#8E7081]">{stockActionProduct.product.name}</p>
              </div>
            </div>

            {/* Current vs Proposed Stock Indicator */}
            <div className="p-3 bg-[#160B12] rounded-xl border border-[#4E3444] mb-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#8E7081]">Current Stock:</span>
                <div className="font-bold text-[#F5EEF2]">
                  {stockActionProduct.product.quantity} {stockActionProduct.product.unit}
                </div>
              </div>
              <div>
                <span className="text-[#8E7081]">Projected Stock:</span>
                <div
                  className={`font-bold ${
                    stockActionProduct.type === 'stock_in'
                      ? 'text-emerald-300'
                      : stockActionProduct.product.quantity - stockQty < 0
                      ? 'text-red-400'
                      : 'text-[#CE96AA]'
                  }`}
                >
                  {stockActionProduct.type === 'stock_in'
                    ? stockActionProduct.product.quantity + stockQty
                    : stockActionProduct.product.quantity - stockQty}{' '}
                  {stockActionProduct.product.unit}
                </div>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200">
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleStockActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#BBA2B0] mb-1">
                  Quantity ({stockActionProduct.product.unit})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockQty}
                  onChange={e => setStockQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:outline-none focus:border-[#CE96AA]"
                />
              </div>

              {stockActionProduct.type === 'stock_in' && (
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={stockSupplier}
                    onChange={e => setStockSupplier(e.target.value)}
                    placeholder="e.g. Ali Traders"
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:outline-none focus:border-[#CE96AA]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#BBA2B0] mb-1">
                  Notes / Reason
                </label>
                <input
                  type="text"
                  value={stockNotes}
                  onChange={e => setStockNotes(e.target.value)}
                  placeholder="e.g. Retail sale invoice #482, Delivery batch"
                  className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:outline-none focus:border-[#CE96AA]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockActionProduct(null)}
                  className="flex-1 py-2 px-3 bg-[#160B12] border border-[#4E3444] text-[#BBA2B0] rounded-xl text-xs font-semibold hover:text-[#F5EEF2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingAction ||
                    (stockActionProduct.type === 'stock_out' &&
                      stockQty > stockActionProduct.product.quantity)
                  }
                  className="flex-1 py-2 px-3 bg-[#B87D93] hover:bg-[#CE96AA] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmittingAction ? 'Processing...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGER ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#160B12]/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#261520] border border-[#4E3444] rounded-2xl shadow-2xl p-6 relative my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#8E7081] hover:text-[#F5EEF2]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-[#CE96AA]" />
              <h3 className="text-base font-bold text-[#F5EEF2]">
                Create New Mall Product (Manager Clearance)
              </h3>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    placeholder="e.g. Wireless Keyboard K380"
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                    placeholder="e.g. ELEC-KBD-009"
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">Department</label>
                  <select
                    value={newProdDept}
                    onChange={e => setNewProdDept(e.target.value as DepartmentType)}
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Household">Household</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">Supplier</label>
                  <input
                    type="text"
                    required
                    value={newProdSupplier}
                    onChange={e => setNewProdSupplier(e.target.value)}
                    placeholder="e.g. Apex Peripherals"
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdQty}
                    onChange={e => setNewProdQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdMinAlert}
                    onChange={e => setNewProdMinAlert(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#BBA2B0] mb-1">Unit</label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                    placeholder="pcs, units, kg"
                    className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#160B12] rounded-xl border border-[#CE96AA]/40">
                <div>
                  <label className="block text-xs font-medium text-[#CE96AA] mb-1">
                    Cost Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProdCostPrice}
                    onChange={e => setNewProdCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#261520] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F5EEF2] mb-1">
                    Selling Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProdSellingPrice}
                    onChange={e => setNewProdSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#261520] border border-[#4E3444] rounded-xl text-xs text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 bg-[#160B12] border border-[#4E3444] text-[#BBA2B0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="flex-1 py-2 px-3 bg-[#B87D93] hover:bg-[#CE96AA] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmittingAction ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGER EDIT PRICING MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#160B12]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#261520] border border-[#4E3444] rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-[#8E7081] hover:text-[#F5EEF2]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <Edit2 className="w-4 h-4 text-[#CE96AA]" />
              <h3 className="text-base font-bold text-[#F5EEF2]">Edit Pricing & Thresholds</h3>
            </div>
            <p className="text-xs text-[#8E7081] mb-4">{editingProduct.name} ({editingProduct.sku})</p>

            <form onSubmit={handleEditPricingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CE96AA] mb-1">
                  Cost Price (PKR) - Confidential
                </label>
                <input
                  type="number"
                  min="0"
                  value={editCostPrice}
                  onChange={e => setEditCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F5EEF2] mb-1">
                  Retail Selling Price (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editSellingPrice}
                  onChange={e => setEditSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#BBA2B0] mb-1">
                  Minimum Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMinAlert}
                  onChange={e => setEditMinAlert(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 px-3 bg-[#160B12] border border-[#4E3444] text-[#BBA2B0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="flex-1 py-2 px-3 bg-[#B87D93] hover:bg-[#CE96AA] text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Save Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
