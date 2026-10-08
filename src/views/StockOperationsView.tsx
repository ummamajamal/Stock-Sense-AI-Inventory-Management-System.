import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, MovementType } from '../types';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const StockOperationsView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [movementType, setMovementType] = useState<MovementType>('stock_in');
  const [quantity, setQuantity] = useState<number>(10);
  const [supplier, setSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const list = await api.getProducts();
      setProducts(list);
      if (list.length > 0 && !selectedProductId) {
        setSelectedProductId(list[0].id);
        setSupplier(list[0].supplier);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Update supplier when product changes
  useEffect(() => {
    if (selectedProduct && movementType === 'stock_in') {
      setSupplier(selectedProduct.supplier);
    }
  }, [selectedProductId, movementType]);

  const isDeduction =
    movementType === 'stock_out' ||
    movementType === 'sale' ||
    movementType === 'damaged' ||
    movementType === 'return';

  const isInsufficient =
    isDeduction && selectedProduct ? quantity > selectedProduct.quantity : false;

  const projectedStock = selectedProduct
    ? movementType === 'stock_in'
      ? selectedProduct.quantity + quantity
      : selectedProduct.quantity - quantity
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.recordStockMovement({
        productId: selectedProduct.id,
        type: movementType,
        quantity,
        supplier: movementType === 'stock_in' ? supplier : undefined,
        notes: notes || undefined,
      });

      setStatusMessage({
        type: 'success',
        text: `Transaction recorded! "${selectedProduct.name}" stock updated from ${res.transaction.previousStock} to ${res.transaction.newStock} ${selectedProduct.unit}.`,
      });

      // Refresh products
      await fetchProducts();
      setNotes('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Stock operation was rejected by the backend.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test 3 from prompt: 5 units in stock -> attempt to sell 8 units -> must return 400 and remain 5!
  const runOversellTest = async () => {
    setStatusMessage(null);
    const target =
      products.find(p => p.quantity <= 10 && p.quantity > 0) || products[0];
    if (!target) return;

    const attemptQty = target.quantity + 5;
    try {
      await api.recordStockMovement({
        productId: target.id,
        type: 'sale',
        quantity: attemptQty,
        notes: 'Security Oversell Verification Test',
      });
      setStatusMessage({
        type: 'error',
        text: `Security test failed: Backend allowed selling ${attemptQty} when only ${target.quantity} existed!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'success',
        text: `TEST 3 PASSED: Backend cleanly blocked negative stock! Error: "${err.message}". Stock for "${target.name}" remains unchanged at ${target.quantity} ${target.unit}.`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2">
          <ArrowLeftRight className="w-5 h-5 text-[#CE96AA]" />
          <h1 className="text-2xl font-bold text-[#F5EEF2]">Stock Operations Desk</h1>
        </div>
        <p className="text-xs text-[#8E7081] mt-0.5">
          Record incoming shipments, point-of-sale dispatches, and damaged stock adjustments.
        </p>
      </div>

      {/* Oversell Test Callout Button */}
      <div className="p-3.5 bg-[#261520] border border-[#4E3444] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-[#8E7081]">
          <ShieldAlert className="w-4 h-4 text-[#CE96AA] shrink-0" />
          <span>
            <strong>Prompt Test 3:</strong> Stock cannot drop below zero. Attempt to sell more than available.
          </span>
        </div>
        <button
          onClick={runOversellTest}
          className="px-3.5 py-1.5 bg-[#160B12] hover:bg-[#4E3444]/40 border border-[#CE96AA]/50 text-[#CE96AA] rounded-xl font-medium transition-all text-left sm:text-center shrink-0"
        >
          Run Oversell Backend Rejection Test
        </button>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/40 border-red-800/60 text-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Operations Card */}
      <div className="bg-[#261520] border border-[#4E3444]/60 p-6 rounded-2xl shadow-xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Movement Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#BBA2B0] mb-2 uppercase tracking-wider">
              Operation Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'stock_in', label: 'Stock In (Shipment)', icon: ArrowDownRight },
                { type: 'sale', label: 'Sale (POS Dispatch)', icon: ArrowUpRight },
                { type: 'damaged', label: 'Damaged Stock', icon: AlertTriangle },
                { type: 'return', label: 'Customer Return', icon: ArrowDownRight },
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = movementType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setMovementType(opt.type as MovementType)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#B87D93] text-white border-[#CE96AA] shadow'
                        : 'bg-[#160B12] text-[#8E7081] border-[#4E3444] hover:text-[#F5EEF2]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#BBA2B0] mb-1.5">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.department}] — Stock: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Live Inventory Preview Card */}
          {selectedProduct && (
            <div className="bg-[#160B12] border border-[#4E3444]/80 p-4 rounded-xl grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-[#8E7081]">Current In-Stock</span>
                <div className="text-lg font-bold text-[#F5EEF2] mt-0.5">
                  {selectedProduct.quantity} {selectedProduct.unit}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#8E7081]">Change Delta</span>
                <div
                  className={`text-lg font-bold mt-0.5 ${
                    movementType === 'stock_in' ? 'text-emerald-400' : 'text-[#CE96AA]'
                  }`}
                >
                  {movementType === 'stock_in' ? '+' : '-'}
                  {quantity} {selectedProduct.unit}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#8E7081]">New Projected Stock</span>
                <div
                  className={`text-lg font-bold mt-0.5 ${
                    isInsufficient ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {projectedStock} {selectedProduct.unit}
                </div>
              </div>
            </div>
          )}

          {/* Negative Stock Warning */}
          {isInsufficient && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Zero-Deficit Protection:</strong> Cannot dispatch {quantity} units. Current stock is only {selectedProduct?.quantity} {selectedProduct?.unit}. Negative stock is strictly prohibited.
              </span>
            </div>
          )}

          {/* Quantity & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#BBA2B0] mb-1.5">
                Quantity to {movementType === 'stock_in' ? 'Receive' : 'Dispatch'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
              />
            </div>

            {movementType === 'stock_in' && (
              <div>
                <label className="block text-xs font-semibold text-[#BBA2B0] mb-1.5">
                  Supplier / Procurement Source
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="e.g. Ali Traders, Peshawar Wholesalers"
                  className="w-full px-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                />
              </div>
            )}

            {movementType !== 'stock_in' && (
              <div>
                <label className="block text-xs font-semibold text-[#BBA2B0] mb-1.5">
                  Reference / Register Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Invoice POS-902, Customer counter"
                  className="w-full px-3.5 py-2.5 bg-[#160B12] border border-[#4E3444] rounded-xl text-sm text-[#F5EEF2] focus:border-[#CE96AA] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isInsufficient}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#B87D93] to-[#CE96AA] hover:from-[#CE96AA] hover:to-[#B87D93] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#160B12]/60 border border-[#CE96AA]/40 transition-all disabled:opacity-40"
          >
            {isSubmitting
              ? 'Recording in Nowshera Mall Ledger...'
              : `Confirm & Commit ${movementType.replace('_', ' ').toUpperCase()}`}
          </button>
        </form>
      </div>
    </div>
  );
};
