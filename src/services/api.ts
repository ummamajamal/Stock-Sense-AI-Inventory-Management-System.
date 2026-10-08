import {
  User,
  Product,
  Transaction,
  DashboardData,
  StockProposal,
  SecurityTestResult,
  MovementType,
  DepartmentType,
  UserRole,
} from '../types';

const TOKEN_KEY = 'stocksense_auth_token';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data as T;
  }

  // --- Auth Endpoints ---

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async signup(params: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: UserRole;
  }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  // --- Inventory Endpoints ---

  async getProducts(): Promise<Product[]> {
    const res = await this.request<{ products: Product[] }>('/api/inventory/products');
    return res.products;
  }

  async getProduct(id: string): Promise<Product> {
    const res = await this.request<{ product: Product }>(`/api/inventory/products/${id}`);
    return res.product;
  }

  async createProduct(params: {
    name: string;
    sku: string;
    department: DepartmentType;
    supplier: string;
    quantity: number;
    minStockAlert: number;
    unit: string;
    costPrice: number;
    sellingPrice: number;
  }): Promise<Product> {
    const res = await this.request<{ product: Product }>('/api/inventory/products', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.product;
  }

  async updatePricing(
    id: string,
    pricing: { sellingPrice?: number; costPrice?: number; minStockAlert?: number }
  ): Promise<Product> {
    const res = await this.request<{ product: Product }>(`/api/inventory/products/${id}/pricing`, {
      method: 'PATCH',
      body: JSON.stringify(pricing),
    });
    return res.product;
  }

  async recordStockMovement(params: {
    productId: string;
    type: MovementType;
    quantity: number;
    supplier?: string;
    notes?: string;
  }): Promise<{ product: Product; transaction: Transaction; message: string }> {
    return this.request<{ product: Product; transaction: Transaction; message: string }>(
      '/api/inventory/stock-movement',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async getTransactions(filters?: {
    department?: string;
    type?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (filters?.department) query.set('department', filters.department);
    if (filters?.type) query.set('type', filters.type);
    if (filters?.limit) query.set('limit', filters.limit.toString());

    const url = `/api/inventory/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request<{ transactions: Transaction[] }>(url);
    return res.transactions;
  }

  async getDashboard(): Promise<DashboardData> {
    return this.request<DashboardData>('/api/inventory/dashboard');
  }

  // --- AI Assistant Endpoints ---

  async chat(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ reply: string; proposal?: StockProposal; isAiAvailable: boolean }> {
    return this.request<{ reply: string; proposal?: StockProposal; isAiAvailable: boolean }>(
      '/api/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }
    );
  }

  async confirmProposal(
    proposalId: string
  ): Promise<{ message: string; product: Product; transaction: Transaction }> {
    return this.request<{ message: string; product: Product; transaction: Transaction }>(
      '/api/ai/proposal/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ proposalId }),
      }
    );
  }

  async cancelProposal(proposalId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/ai/proposal/cancel', {
      method: 'POST',
      body: JSON.stringify({ proposalId }),
    });
  }

  // --- Security Audit Endpoints ---

  async runSecurityTests(): Promise<SecurityTestResult[]> {
    const res = await this.request<{ tests: SecurityTestResult[] }>('/api/security-test/run', {
      method: 'POST',
    });
    return res.tests;
  }
}

export const api = new ApiService();
