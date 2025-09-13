// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  errors: string[];
}

export interface PagedResponse<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// User Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expires: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number;
}

export interface RegisterCompanyRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: number;
  company: {
    name: string;
    businessType: string;
    taxId?: string;
    website?: string;
    description: string;
    contactEmail: string;
    phone: string;
    address: string;
    city: string;
  };
}

// Company Types
export interface Company {
  id: number;
  name: string;
  description: string;
  contactEmail: string;
  phone: string;
  address: string;
  website: string;
  logo: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  approvedAt?: string;
  productsCount: number;
  usersCount: number;
}

export interface CreateCompanyRequest {
  name: string;
  description: string;
  contactEmail: string;
  phone: string;
  address: string;
  website: string;
}

// Product Types
export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryName?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: number;
  companyName: string;
  companyContactEmail: string;
  companyPhone: string;
  images: ProductImage[];
}

export interface ProductSearchParams {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  companyId?: number;
  isFeatured?: boolean;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: number;
  isFeatured: boolean;
}

export interface UpdateProductRequest extends CreateProductRequest {
  isActive: boolean;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description: string;
  parentCategoryId?: number;
  displayOrder: number;
  productsCount: number;
}

// Lead Types
export interface Lead {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  contactedAt?: string;
  isContacted: boolean;
  notes?: string;
}

export interface CreateLeadRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
}

// UI State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AppState {
  auth: AuthState;
  companies: Company[];
  products: Product[];
  categories: Category[];
  leads: Lead[];
  loading: {
    companies: boolean;
    products: boolean;
    categories: boolean;
    leads: boolean;
  };
  error: {
    companies: string | null;
    products: string | null;
    categories: string | null;
    leads: string | null;
  };
}
