import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type UserRole = 'manager' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  department: 'Grocery' | 'Clothing' | 'Electronics' | 'Household';
  supplier: string;
  quantity: number;
  minStockAlert: number;
  unit: string;
  costPrice: number;    // Manager only
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

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  products: Product[];
  transactions: Transaction[];
  proposals: StockProposal[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'stocksense_store.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private getInitialData(): DatabaseSchema {
    const managerSalt = generateSalt();
    const staffSalt = generateSalt();

    // Required existing accounts from specification:
    // Manager: manager@stocksense.com, ID: 0e8c875a-444a-498e-a656-77c873ecc03b
    // Staff: staff@stocksense.com, ID: 74ecfd7b-effb-4265-8359-ab2e16e5e1ae
    const initialUsers: User[] = [
      {
        id: '0e8c875a-444a-498e-a656-77c873ecc03b',
        email: 'manager@stocksense.com',
        name: 'Ahmad Khan (Mall Manager)',
        role: 'manager',
        salt: managerSalt,
        passwordHash: hashPassword('manager123', managerSalt),
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: '74ecfd7b-effb-4265-8359-ab2e16e5e1ae',
        email: 'staff@stocksense.com',
        name: 'Bilal Tariq (Floor Staff)',
        role: 'staff',
        salt: staffSalt,
        passwordHash: hashPassword('staff123', staffSalt),
        createdAt: '2026-01-15T08:30:00.000Z',
      },
    ];

    const initialProducts: Product[] = [
      // Electronics
      {
        id: 'prod-elec-001',
        sku: 'ELEC-CBL-001',
        name: 'USB Type-C Fast Cable (2m)',
        department: 'Electronics',
        supplier: 'Ali Traders',
        quantity: 42,
        minStockAlert: 15,
        unit: 'pcs',
        costPrice: 450,
        sellingPrice: 850,
        lastStockedAt: '2026-10-06T14:30:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-06T14:30:00.000Z',
      },
      {
        id: 'prod-elec-002',
        sku: 'ELEC-LPT-002',
        name: 'Dell Inspiron 15 Core i5 Laptop',
        department: 'Electronics',
        supplier: 'TechLink Computers',
        quantity: 8,
        minStockAlert: 5,
        unit: 'units',
        costPrice: 150000,
        sellingPrice: 175000,
        lastStockedAt: '2026-10-02T11:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-02T11:00:00.000Z',
      },
      {
        id: 'prod-elec-003',
        sku: 'ELEC-MSE-003',
        name: 'Logitech Wireless Optical Mouse M185',
        department: 'Electronics',
        supplier: 'Apex Peripherals',
        quantity: 25,
        minStockAlert: 10,
        unit: 'pcs',
        costPrice: 2100,
        sellingPrice: 3200,
        lastStockedAt: '2026-09-28T09:15:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-28T09:15:00.000Z',
      },
      {
        id: 'prod-elec-004',
        sku: 'ELEC-PWR-004',
        name: 'Anker 20000mAh Power Bank',
        department: 'Electronics',
        supplier: 'Ali Traders',
        quantity: 14,
        minStockAlert: 8,
        unit: 'pcs',
        costPrice: 6800,
        sellingPrice: 9500,
        lastStockedAt: '2026-10-04T16:20:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-04T16:20:00.000Z',
      },
      {
        id: 'prod-elec-005',
        sku: 'ELEC-HDP-005',
        name: 'Sony WH-CH520 Wireless Headphones',
        department: 'Electronics',
        supplier: 'Apex Peripherals',
        quantity: 6,
        minStockAlert: 8,
        unit: 'pcs',
        costPrice: 10500,
        sellingPrice: 14500,
        lastStockedAt: '2026-09-20T10:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-20T10:00:00.000Z',
      },

      // Grocery
      {
        id: 'prod-groc-001',
        sku: 'GROC-RCE-001',
        name: 'Super Basmati Kernel Rice 5kg',
        department: 'Grocery',
        supplier: 'Khyber Grains',
        quantity: 85,
        minStockAlert: 30,
        unit: 'bags',
        costPrice: 1850,
        sellingPrice: 2400,
        lastStockedAt: '2026-10-05T08:45:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-05T08:45:00.000Z',
      },
      {
        id: 'prod-groc-002',
        sku: 'GROC-OIL-002',
        name: 'Dalda Fortified Cooking Oil 5L',
        department: 'Grocery',
        supplier: 'Peshawar Wholesalers',
        quantity: 12,
        minStockAlert: 20,
        unit: 'cans',
        costPrice: 2650,
        sellingPrice: 3100,
        lastStockedAt: '2026-09-25T13:10:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-25T13:10:00.000Z',
      },
      {
        id: 'prod-groc-003',
        sku: 'GROC-SLT-003',
        name: 'National Himalayan Pink Salt 800g',
        department: 'Grocery',
        supplier: 'Khyber Grains',
        quantity: 45,
        minStockAlert: 15,
        unit: 'packs',
        costPrice: 110,
        sellingPrice: 180,
        lastStockedAt: '2026-10-01T12:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-01T12:00:00.000Z',
      },
      {
        id: 'prod-groc-004',
        sku: 'GROC-TEA-004',
        name: 'Tapal Danedar Black Tea 900g',
        department: 'Grocery',
        supplier: 'Peshawar Wholesalers',
        quantity: 38,
        minStockAlert: 15,
        unit: 'packs',
        costPrice: 1350,
        sellingPrice: 1750,
        lastStockedAt: '2026-10-03T15:30:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-03T15:30:00.000Z',
      },
      {
        id: 'prod-groc-005',
        sku: 'GROC-MLK-005',
        name: 'Olpers Pure Milk Pack 1L (Carton 12x)',
        department: 'Grocery',
        supplier: 'Dairy Direct',
        quantity: 5,
        minStockAlert: 10,
        unit: 'cartons',
        costPrice: 2900,
        sellingPrice: 3400,
        lastStockedAt: '2026-09-18T11:20:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-18T11:20:00.000Z',
      },

      // Clothing
      {
        id: 'prod-clth-001',
        sku: 'CLTH-KRT-001',
        name: "Men's Classic Cotton Kurta - Navy (L)",
        department: 'Clothing',
        supplier: 'Khyber Textiles',
        quantity: 22,
        minStockAlert: 10,
        unit: 'pcs',
        costPrice: 2600,
        sellingPrice: 4500,
        lastStockedAt: '2026-10-02T14:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-02T14:00:00.000Z',
      },
      {
        id: 'prod-clth-002',
        sku: 'CLTH-LWN-002',
        name: "Women's Embroidered Lawn 3-Piece",
        department: 'Clothing',
        supplier: 'Gulzar Fabrics',
        quantity: 18,
        minStockAlert: 8,
        unit: 'suits',
        costPrice: 4900,
        sellingPrice: 7800,
        lastStockedAt: '2026-09-30T10:15:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-30T10:15:00.000Z',
      },
      {
        id: 'prod-clth-003',
        sku: 'CLTH-JNS-003',
        name: 'Denim Slim Fit Jeans - Dark Wash',
        department: 'Clothing',
        supplier: 'Urban Outfitters PK',
        quantity: 30,
        minStockAlert: 12,
        unit: 'pcs',
        costPrice: 2200,
        sellingPrice: 3800,
        lastStockedAt: '2026-10-04T12:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-04T12:00:00.000Z',
      },
      {
        id: 'prod-clth-004',
        sku: 'CLTH-TSH-004',
        name: 'Kids Casual Cotton Polo T-Shirt',
        department: 'Clothing',
        supplier: 'Khyber Textiles',
        quantity: 40,
        minStockAlert: 15,
        unit: 'pcs',
        costPrice: 900,
        sellingPrice: 1600,
        lastStockedAt: '2026-10-01T16:45:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-01T16:45:00.000Z',
      },

      // Household
      {
        id: 'prod-hshd-001',
        sku: 'HSHD-CKW-001',
        name: 'Royal Non-Stick Cookware Set (7 Pcs)',
        department: 'Household',
        supplier: 'HomeStyle Traders',
        quantity: 9,
        minStockAlert: 6,
        unit: 'sets',
        costPrice: 13200,
        sellingPrice: 18500,
        lastStockedAt: '2026-09-29T11:30:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-29T11:30:00.000Z',
      },
      {
        id: 'prod-hshd-002',
        sku: 'HSHD-MOP-002',
        name: 'Microfiber Cleaning Mop & Bucket System',
        department: 'Household',
        supplier: 'CleanPro Supplies',
        quantity: 16,
        minStockAlert: 10,
        unit: 'sets',
        costPrice: 2700,
        sellingPrice: 4200,
        lastStockedAt: '2026-10-03T10:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-03T10:00:00.000Z',
      },
      {
        id: 'prod-hshd-003',
        sku: 'HSHD-FLK-003',
        name: 'Stainless Steel Thermal Flask 1.5L',
        department: 'Household',
        supplier: 'HomeStyle Traders',
        quantity: 28,
        minStockAlert: 10,
        unit: 'pcs',
        costPrice: 1650,
        sellingPrice: 2800,
        lastStockedAt: '2026-10-05T14:15:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-10-05T14:15:00.000Z',
      },
      {
        id: 'prod-hshd-004',
        sku: 'HSHD-DIF-004',
        name: 'Aroma Ceramic Ultrasonic Diffuser',
        department: 'Household',
        supplier: 'CleanPro Supplies',
        quantity: 4,
        minStockAlert: 8,
        unit: 'pcs',
        costPrice: 3400,
        sellingPrice: 5500,
        lastStockedAt: '2026-09-15T15:00:00.000Z',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-09-15T15:00:00.000Z',
      },
    ];

    const initialTransactions: Transaction[] = [
      {
        id: 'tx-init-001',
        productId: 'prod-elec-001',
        productName: 'USB Type-C Fast Cable (2m)',
        sku: 'ELEC-CBL-001',
        department: 'Electronics',
        type: 'stock_in',
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        supplier: 'Ali Traders',
        userId: '0e8c875a-444a-498e-a656-77c873ecc03b',
        userName: 'Ahmad Khan (Mall Manager)',
        userRole: 'manager',
        notes: 'Initial bulk shipment for Nowshera Mall',
        timestamp: '2026-10-05T09:30:00.000Z',
      },
      {
        id: 'tx-init-002',
        productId: 'prod-elec-001',
        productName: 'USB Type-C Fast Cable (2m)',
        sku: 'ELEC-CBL-001',
        department: 'Electronics',
        type: 'sale',
        quantity: 8,
        previousStock: 50,
        newStock: 42,
        userId: '74ecfd7b-effb-4265-8359-ab2e16e5e1ae',
        userName: 'Bilal Tariq (Floor Staff)',
        userRole: 'staff',
        notes: 'Retail counter sale POS #3',
        timestamp: '2026-10-06T14:30:00.000Z',
      },
      {
        id: 'tx-init-003',
        productId: 'prod-groc-001',
        productName: 'Super Basmati Kernel Rice 5kg',
        sku: 'GROC-RCE-001',
        department: 'Grocery',
        type: 'stock_in',
        quantity: 100,
        previousStock: 0,
        newStock: 100,
        supplier: 'Khyber Grains',
        userId: '0e8c875a-444a-498e-a656-77c873ecc03b',
        userName: 'Ahmad Khan (Mall Manager)',
        userRole: 'manager',
        notes: 'Monthly grains procurement delivery',
        timestamp: '2026-10-04T10:00:00.000Z',
      },
      {
        id: 'tx-init-004',
        productId: 'prod-groc-001',
        productName: 'Super Basmati Kernel Rice 5kg',
        sku: 'GROC-RCE-001',
        department: 'Grocery',
        type: 'sale',
        quantity: 15,
        previousStock: 100,
        newStock: 85,
        userId: '74ecfd7b-effb-4265-8359-ab2e16e5e1ae',
        userName: 'Bilal Tariq (Floor Staff)',
        userRole: 'staff',
        notes: 'Grocery department cashier sale',
        timestamp: '2026-10-05T08:45:00.000Z',
      },
      {
        id: 'tx-init-005',
        productId: 'prod-elec-002',
        productName: 'Dell Inspiron 15 Core i5 Laptop',
        sku: 'ELEC-LPT-002',
        department: 'Electronics',
        type: 'stock_in',
        quantity: 10,
        previousStock: 0,
        newStock: 10,
        supplier: 'TechLink Computers',
        userId: '0e8c875a-444a-498e-a656-77c873ecc03b',
        userName: 'Ahmad Khan (Mall Manager)',
        userRole: 'manager',
        notes: 'Electronics showcase inventory',
        timestamp: '2026-10-01T15:00:00.000Z',
      },
      {
        id: 'tx-init-006',
        productId: 'prod-elec-002',
        productName: 'Dell Inspiron 15 Core i5 Laptop',
        sku: 'ELEC-LPT-002',
        department: 'Electronics',
        type: 'sale',
        quantity: 2,
        previousStock: 10,
        newStock: 8,
        userId: '74ecfd7b-effb-4265-8359-ab2e16e5e1ae',
        userName: 'Bilal Tariq (Floor Staff)',
        userRole: 'staff',
        notes: 'Customer order invoice #EL-491',
        timestamp: '2026-10-02T11:00:00.000Z',
      },
      {
        id: 'tx-init-007',
        productId: 'prod-groc-002',
        productName: 'Dalda Fortified Cooking Oil 5L',
        sku: 'GROC-OIL-002',
        department: 'Grocery',
        type: 'sale',
        quantity: 8,
        previousStock: 20,
        newStock: 12,
        userId: '74ecfd7b-effb-4265-8359-ab2e16e5e1ae',
        userName: 'Bilal Tariq (Floor Staff)',
        userRole: 'staff',
        notes: 'Bulk household grocery purchase',
        timestamp: '2026-09-25T13:10:00.000Z',
      },
    ];

    return {
      users: initialUsers,
      sessions: [],
      products: initialProducts,
      transactions: initialTransactions,
      proposals: [],
    };
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.users && parsed.products && parsed.transactions) {
          // Guarantee the required existing accounts are present with exact IDs
          this.ensureRequiredAccounts(parsed);
          return parsed;
        }
      } catch (err) {
        console.error('Error reading database file, initializing fresh store:', err);
      }
    }

    const initial = this.getInitialData();
    this.saveData(initial);
    return initial;
  }

  private ensureRequiredAccounts(data: DatabaseSchema) {
    const managerId = '0e8c875a-444a-498e-a656-77c873ecc03b';
    const staffId = '74ecfd7b-effb-4265-8359-ab2e16e5e1ae';

    const hasManager = data.users.some(u => u.id === managerId);
    if (!hasManager) {
      const salt = generateSalt();
      data.users.push({
        id: managerId,
        email: 'manager@stocksense.com',
        name: 'Ahmad Khan (Mall Manager)',
        role: 'manager',
        salt,
        passwordHash: hashPassword('manager123', salt),
        createdAt: '2026-01-15T08:00:00.000Z',
      });
    }

    const hasStaff = data.users.some(u => u.id === staffId);
    if (!hasStaff) {
      const salt = generateSalt();
      data.users.push({
        id: staffId,
        email: 'staff@stocksense.com',
        name: 'Bilal Tariq (Floor Staff)',
        role: 'staff',
        salt,
        passwordHash: hashPassword('staff123', salt),
        createdAt: '2026-01-15T08:30:00.000Z',
      });
    }
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to atomically persist database to disk:', err);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // --- User / Authentication methods ---

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  verifyPassword(user: User, passwordAttempt: string): boolean {
    const attemptHash = hashPassword(passwordAttempt, user.salt);
    return attemptHash === user.passwordHash;
  }

  createUser(name: string, email: string, password: string, role: UserRole): User {
    const salt = generateSalt();
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      role,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  createSession(userId: string): Session {
    // Generate secure 48-byte token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session: Session = {
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.data.sessions.push(session);
    this.persist();
    return session;
  }

  getSession(token: string): { session: Session; user: User } | null {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(token);
      return null;
    }

    const user = this.getUserById(session.userId);
    if (!user) {
      this.deleteSession(token);
      return null;
    }

    return { session, user };
  }

  deleteSession(token: string): boolean {
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    if (this.data.sessions.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Product & Inventory methods ---

  getAllProducts(): Product[] {
    return [...this.data.products];
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  getProductByNameOrSku(query: string): Product | undefined {
    const q = query.toLowerCase().trim();
    return this.data.products.find(
      p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase() === q
    );
  }

  createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastStockedAt'>
  ): Product {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lastStockedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.data.products.push(newProduct);
    this.persist();
    return newProduct;
  }

  updateProductPricing(
    productId: string,
    pricing: { sellingPrice?: number; costPrice?: number; minStockAlert?: number }
  ): Product | null {
    const product = this.data.products.find(p => p.id === productId);
    if (!product) return null;

    if (pricing.sellingPrice !== undefined && pricing.sellingPrice >= 0) {
      product.sellingPrice = pricing.sellingPrice;
    }
    if (pricing.costPrice !== undefined && pricing.costPrice >= 0) {
      product.costPrice = pricing.costPrice;
    }
    if (pricing.minStockAlert !== undefined && pricing.minStockAlert >= 0) {
      product.minStockAlert = pricing.minStockAlert;
    }

    product.updatedAt = new Date().toISOString();
    this.persist();
    return product;
  }

  applyStockMovement(params: {
    productId: string;
    type: MovementType;
    quantity: number;
    supplier?: string;
    notes?: string;
    user: User;
  }): { success: boolean; error?: string; product?: Product; transaction?: Transaction } {
    const product = this.data.products.find(p => p.id === params.productId);
    if (!product) {
      return { success: false, error: 'Product not found in StockSense.' };
    }

    if (params.quantity <= 0 || !Number.isInteger(params.quantity)) {
      return { success: false, error: 'Quantity must be a positive whole number.' };
    }

    const previousStock = product.quantity;
    let newStock = previousStock;

    if (params.type === 'stock_in') {
      newStock = previousStock + params.quantity;
      if (params.supplier) {
        product.supplier = params.supplier;
      }
      product.lastStockedAt = new Date().toISOString();
    } else if (
      params.type === 'stock_out' ||
      params.type === 'sale' ||
      params.type === 'damaged' ||
      params.type === 'return'
    ) {
      // Validate available stock - NEVER allow negative stock
      if (params.quantity > previousStock) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${previousStock} ${product.unit}, requested: ${params.quantity} ${product.unit}. Operation rejected to prevent negative inventory.`,
        };
      }
      newStock = previousStock - params.quantity;
    } else if (params.type === 'adjustment') {
      // Direct adjustment: quantity parameter is the difference or target?
      // In StockSense, adjustment quantity is delta
      if (params.quantity > previousStock) {
        newStock = previousStock + params.quantity;
      } else {
        newStock = previousStock - params.quantity;
      }
    }

    // Apply mutation
    product.quantity = newStock;
    product.updatedAt = new Date().toISOString();

    // Record persistent transaction
    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      department: product.department,
      type: params.type,
      quantity: params.quantity,
      previousStock,
      newStock,
      supplier: params.supplier || product.supplier,
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      notes: params.notes || `Stock ${params.type.replace('_', ' ')} recorded via StockSense`,
      timestamp: new Date().toISOString(),
    };

    this.data.transactions.unshift(transaction);
    this.persist();

    return {
      success: true,
      product,
      transaction,
    };
  }

  // --- Transactions methods ---

  getAllTransactions(): Transaction[] {
    return [...this.data.transactions];
  }

  // --- AI Action Proposals methods ---

  createProposal(proposal: Omit<StockProposal, 'id' | 'status' | 'createdAt'>): StockProposal {
    const newProposal: StockProposal = {
      ...proposal,
      id: `prop-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.proposals.push(newProposal);
    this.persist();
    return newProposal;
  }

  getProposal(id: string): StockProposal | undefined {
    return this.data.proposals.find(p => p.id === id);
  }

  cancelProposal(id: string): { success: boolean; error?: string } {
    const proposal = this.data.proposals.find(p => p.id === id);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    if (proposal.status !== 'pending') {
      return { success: false, error: `Proposal already ${proposal.status}` };
    }

    proposal.status = 'cancelled';
    this.persist();
    return { success: true };
  }

  confirmProposal(id: string, confirmingUser: User): {
    success: boolean;
    error?: string;
    product?: Product;
    transaction?: Transaction;
  } {
    const proposal = this.data.proposals.find(p => p.id === id);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    if (proposal.status === 'confirmed') {
      return { success: false, error: 'Proposal has already been confirmed and executed.' };
    }
    if (proposal.status === 'cancelled') {
      return { success: false, error: 'Cannot confirm a cancelled proposal.' };
    }

    const product = this.getProductById(proposal.productId);
    if (!product) {
      return { success: false, error: 'Product no longer exists in inventory.' };
    }

    // Execute stock movement via the standard business logic
    const result = this.applyStockMovement({
      productId: proposal.productId,
      type: proposal.actionType,
      quantity: proposal.quantity,
      supplier: proposal.supplier,
      notes: proposal.notes || `AI Stock Assistant executed proposal (${proposal.id})`,
      user: confirmingUser,
    });

    if (!result.success) {
      return result;
    }

    // Update proposal status
    proposal.status = 'confirmed';
    proposal.confirmedAt = new Date().toISOString();
    proposal.confirmedBy = confirmingUser.name;
    this.persist();

    return result;
  }
}

export const db = new Database();
