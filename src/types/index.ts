export type UserRole = 'manager' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export type DepartmentType = 'Grocery' | 'Clothing' | 'Electronics' | 'Household';

export interface Product {
  id: string;
  sku: string;
  name: string;
  department: DepartmentType;
  supplier: string;
  quantity: number;
  minStockAlert: number;
  unit: string;
  costPrice?: number; // Only returned to Manager
  sellingPrice: number;
  lastStockedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'stock_in' | 'stock_out' | 'sale' | 'damaged' | 'return' | 'adjustment';

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  department: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  supplier?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  notes?: string;
  timestamp: string;
}

export interface StockProposal {
  id: string;
  productId: string;
  productName: string;
  department: string;
  actionType: 'stock_in' | 'stock_out';
  quantity: number;
  supplier?: string;
  currentStock: number;
  proposedStock: number;
  notes?: string;
  requestedByUserId: string;
  requestedByUserName: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface DashboardData {
  totalProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    department: DepartmentType;
    quantity: number;
    minAlert: number;
    unit: string;
    sellingPrice: number;
  }>;
  departmentBreakdown: Array<{
    department: DepartmentType;
    productCount: number;
    stockUnits: number;
    lowStockCount: number;
  }>;
  recentTransactions: Transaction[];
  financials: {
    totalInventoryCost: number;
    totalInventoryValuation: number;
    projectedProfit: number;
    profitMarginPercentage: number;
  } | null;
}

export interface SecurityTestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed';
  details: string;
  expected: string;
  received: string;
}
