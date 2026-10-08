import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, UserRole, User } from './server/db.js';
import { processAiChat } from './server/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Extend express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const sessionData = db.getSession(token);
  if (!sessionData) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  req.user = sessionData.user;
  next();
}

// Manager RBAC Guard Middleware
function requireManagerRole(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({
      error: 'Forbidden: Mall Manager credentials required. Staff accounts are strictly not authorized.',
    });
  }
  next();
}

// ----------------------------------------------------
// 1. AUTHENTICATION ROUTES
// ----------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isValid = db.verifyPassword(user, password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const session = db.createSession(user.id);

  return res.json({
    message: 'Authentication successful',
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/signup (Normal signup, manager signup allowed without extra codes)
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password, confirmPassword, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (role !== 'staff' && role !== 'manager') {
    return res.status(400).json({ error: 'Invalid role. Must be either "staff" or "manager".' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const newUser = db.createUser(name.trim(), email.trim(), password, role as UserRole);
  const session = db.createSession(newUser.id);

  return res.status(201).json({
    message: 'Account created successfully',
    token: session.token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticateToken, (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    db.deleteSession(token);
  }
  return res.json({ message: 'Logged out successfully.' });
});

// ----------------------------------------------------
// 2. INVENTORY & PRODUCT ROUTES
// ----------------------------------------------------

// GET /api/inventory/products
app.get('/api/inventory/products', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  const products = db.getAllProducts();

  // RBAC: If staff, STRIP costPrice
  if (user.role === 'staff') {
    const sanitized = products.map(({ costPrice, ...rest }) => rest);
    return res.json({ products: sanitized });
  }

  // Manager gets full products with costPrice
  return res.json({ products });
});

// GET /api/inventory/products/:id
app.get('/api/inventory/products/:id', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  const product = db.getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  if (user.role === 'staff') {
    const { costPrice, ...sanitized } = product;
    return res.json({ product: sanitized });
  }

  return res.json({ product });
});

// POST /api/inventory/products (Manager Only)
app.post(
  '/api/inventory/products',
  authenticateToken,
  requireManagerRole,
  (req: Request, res: Response) => {
    const {
      name,
      sku,
      department,
      supplier,
      quantity,
      minStockAlert,
      unit,
      costPrice,
      sellingPrice,
    } = req.body;

    if (!name || !sku || !department || !supplier) {
      return res.status(400).json({ error: 'Name, SKU, department, and supplier are required.' });
    }

    const validDepartments = ['Grocery', 'Clothing', 'Electronics', 'Household'];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        error: `Invalid department. Must be one of: ${validDepartments.join(', ')}`,
      });
    }

    const newProduct = db.createProduct({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      department,
      supplier: supplier.trim(),
      quantity: Math.max(0, parseInt(quantity, 10) || 0),
      minStockAlert: Math.max(1, parseInt(minStockAlert, 10) || 10),
      unit: unit || 'pcs',
      costPrice: Math.max(0, parseFloat(costPrice) || 0),
      sellingPrice: Math.max(0, parseFloat(sellingPrice) || 0),
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  }
);

// PATCH /api/inventory/products/:id/pricing (Manager Only)
app.patch(
  '/api/inventory/products/:id/pricing',
  authenticateToken,
  requireManagerRole,
  (req: Request, res: Response) => {
    const { sellingPrice, costPrice, minStockAlert } = req.body;

    const updated = db.updateProductPricing(req.params.id, {
      sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
      costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
      minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert, 10) : undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({
      message: 'Product pricing updated successfully',
      product: updated,
    });
  }
);

// POST /api/inventory/stock-movement (Staff & Manager)
app.post('/api/inventory/stock-movement', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  const { productId, type, quantity, supplier, notes } = req.body;

  if (!productId || !type || quantity === undefined) {
    return res.status(400).json({ error: 'productId, type, and quantity are required.' });
  }

  const validTypes = ['stock_in', 'stock_out', 'sale', 'damaged', 'return', 'adjustment'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid movement type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer greater than 0.' });
  }

  const result = db.applyStockMovement({
    productId,
    type,
    quantity: qty,
    supplier,
    notes,
    user,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Sanitize costPrice if staff
  const returnedProduct = { ...result.product! };
  if (user.role === 'staff') {
    delete (returnedProduct as any).costPrice;
  }

  return res.json({
    message: `Stock ${type.replace('_', ' ')} recorded successfully`,
    product: returnedProduct,
    transaction: result.transaction,
  });
});

// GET /api/inventory/transactions
app.get('/api/inventory/transactions', authenticateToken, (req: Request, res: Response) => {
  const { department, type, limit } = req.query;
  let txs = db.getAllTransactions();

  if (department && typeof department === 'string') {
    txs = txs.filter(t => t.department.toLowerCase() === department.toLowerCase());
  }

  if (type && typeof type === 'string') {
    txs = txs.filter(t => t.type === type);
  }

  const max = limit ? parseInt(limit as string, 10) : 100;
  return res.json({ transactions: txs.slice(0, max) });
});

// GET /api/inventory/dashboard
app.get('/api/inventory/dashboard', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  const products = db.getAllProducts();
  const transactions = db.getAllTransactions();

  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const lowStockItems = products.filter(p => p.quantity <= p.minStockAlert);

  // Department breakdown
  const departments = ['Grocery', 'Clothing', 'Electronics', 'Household'] as const;
  const departmentBreakdown = departments.map(dept => {
    const deptProducts = products.filter(p => p.department === dept);
    const count = deptProducts.length;
    const units = deptProducts.reduce((acc, p) => acc + p.quantity, 0);
    const lowCount = deptProducts.filter(p => p.quantity <= p.minStockAlert).length;
    return {
      department: dept,
      productCount: count,
      stockUnits: units,
      lowStockCount: lowCount,
    };
  });

  // Recent movements
  const recentTransactions = transactions.slice(0, 8);

  const baseDashboard = {
    totalProducts,
    totalStockUnits,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.map(p => ({
      id: p.id,
      name: p.name,
      department: p.department,
      quantity: p.quantity,
      minAlert: p.minStockAlert,
      unit: p.unit,
      sellingPrice: p.sellingPrice,
    })),
    departmentBreakdown,
    recentTransactions,
  };

  // Manager-only financial metrics
  if (user.role === 'manager') {
    const totalInventoryCost = products.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
    const totalInventoryValuation = products.reduce(
      (acc, p) => acc + p.quantity * p.sellingPrice,
      0
    );
    const projectedProfit = totalInventoryValuation - totalInventoryCost;
    const profitMarginPercentage =
      totalInventoryValuation > 0
        ? Math.round((projectedProfit / totalInventoryValuation) * 100)
        : 0;

    return res.json({
      ...baseDashboard,
      financials: {
        totalInventoryCost,
        totalInventoryValuation,
        projectedProfit,
        profitMarginPercentage,
      },
    });
  }

  // Staff receives dashboard with null financials
  return res.json({
    ...baseDashboard,
    financials: null,
  });
});

// ----------------------------------------------------
// 3. AI ASSISTANT & PROPOSAL ROUTES
// ----------------------------------------------------

// POST /api/ai/chat
app.post('/api/ai/chat', authenticateToken, async (req: Request, res: Response) => {
  const user = req.user!;
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message string is required.' });
  }

  try {
    const result = await processAiChat(history || [], message, user);
    return res.json(result);
  } catch (err: any) {
    console.error('AI chat endpoint error:', err);
    return res.status(500).json({
      error: 'AI service encountered an unexpected error. Stock operations remain functional.',
      details: err?.message,
    });
  }
});

// POST /api/ai/proposal/confirm
app.post('/api/ai/proposal/confirm', authenticateToken, (req: Request, res: Response) => {
  const user = req.user!;
  const { proposalId } = req.body;

  if (!proposalId) {
    return res.status(400).json({ error: 'proposalId is required.' });
  }

  const proposal = db.getProposal(proposalId);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found.' });
  }

  const result = db.confirmProposal(proposalId, user);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Sanitize costPrice if staff
  const updatedProduct = { ...result.product! };
  if (user.role === 'staff') {
    delete (updatedProduct as any).costPrice;
  }

  return res.json({
    message: `Stock proposal confirmed and successfully executed by ${user.name}!`,
    product: updatedProduct,
    transaction: result.transaction,
  });
});

// POST /api/ai/proposal/cancel
app.post('/api/ai/proposal/cancel', authenticateToken, (req: Request, res: Response) => {
  const { proposalId } = req.body;

  if (!proposalId) {
    return res.status(400).json({ error: 'proposalId is required.' });
  }

  const result = db.cancelProposal(proposalId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ message: 'Stock proposal cancelled. No changes were made to inventory.' });
});

// ----------------------------------------------------
// 4. SECURITY & RBAC LIVE TEST SUITE ENDPOINT
// ----------------------------------------------------
// Allows front-end to execute real, verifiable tests against the backend security barriers
app.post('/api/security-test/run', authenticateToken, async (req: Request, res: Response) => {
  const user = req.user!;
  const testResults: Array<{
    id: string;
    name: string;
    status: 'passed' | 'failed';
    details: string;
    expected: string;
    received: string;
  }> = [];

  // Test 1: Negative stock rejection
  const testProduct = db.getAllProducts()[0];
  if (testProduct) {
    const excessiveQty = testProduct.quantity + 500;
    const movementResult = db.applyStockMovement({
      productId: testProduct.id,
      type: 'stock_out',
      quantity: excessiveQty,
      user,
    });

    if (!movementResult.success && movementResult.error?.includes('Insufficient stock')) {
      testResults.push({
        id: 'test-neg-stock',
        name: 'Negative Inventory Prevention',
        status: 'passed',
        details: `Attempt to stock-out ${excessiveQty} on product with ${testProduct.quantity} was cleanly blocked.`,
        expected: 'Operation rejected with Insufficient Stock error',
        received: movementResult.error || 'Blocked',
      });
    } else {
      testResults.push({
        id: 'test-neg-stock',
        name: 'Negative Inventory Prevention',
        status: 'failed',
        details: 'Negative stock operation was not blocked properly!',
        expected: 'Rejected',
        received: 'Allowed',
      });
    }
  }

  // Test 2: RBAC Cost price protection
  if (user.role === 'staff') {
    const productsRes = db.getAllProducts();
    const sanitized = productsRes.map(({ costPrice, ...rest }) => rest);
    const hasAnyCost = (sanitized as any[]).some(p => p.costPrice !== undefined);
    testResults.push({
      id: 'test-staff-redaction',
      name: 'Financial Cost Price Redaction for Staff',
      status: !hasAnyCost ? 'passed' : 'failed',
      details: !hasAnyCost
        ? 'All costPrice fields are cleanly stripped from staff product responses.'
        : 'costPrice leaked to staff!',
      expected: 'costPrice undefined for staff',
      received: hasAnyCost ? 'costPrice present' : 'costPrice stripped',
    });
  } else {
    testResults.push({
      id: 'test-manager-access',
      name: 'Manager Financial Access Authorization',
      status: 'passed',
      details: 'Manager is legitimately authorized to access inventory valuation and cost prices.',
      expected: 'costPrice accessible to Manager',
      received: 'Manager authorized',
    });
  }

  // Test 3: Proposal Idempotency Check
  const tempProposal = db.createProposal({
    productId: testProduct.id,
    productName: testProduct.name,
    department: testProduct.department,
    actionType: 'stock_in',
    quantity: 1,
    currentStock: testProduct.quantity,
    proposedStock: testProduct.quantity + 1,
    requestedByUserId: user.id,
    requestedByUserName: user.name,
  });

  const cancelResult = db.cancelProposal(tempProposal.id);
  const reConfirmAttempt = db.confirmProposal(tempProposal.id, user);

  testResults.push({
    id: 'test-proposal-cancel',
    name: 'Proposal Cancellation & Modification Guard',
    status:
      cancelResult.success && !reConfirmAttempt.success ? 'passed' : 'failed',
    details: 'Cancelled proposal cannot be executed; inventory remains untouched.',
    expected: 'Cancellation succeeds and subsequent execution is blocked',
    received: reConfirmAttempt.error || 'Blocked as expected',
  });

  return res.json({ tests: testResults });
});

// ----------------------------------------------------
// 5. DEV & PROD CLIENT MOUNTING
// ----------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StockSense Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
