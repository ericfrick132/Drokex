import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse,
  PagedResponse,
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Company,
  CreateCompanyRequest,
  Product,
  ProductSearchParams,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
  Lead,
  CreateLeadRequest,
  RegisterCompanyRequest
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: detect subdomain from location
const detectTenantSubdomain = (): string | null => {
  try {
    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');
    // prod: subdomain.drokex.com; dev: subdomain.localhost
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];
      if ((secondLast === 'drokex' && last === 'com') || last === 'localhost') {
        const sub = parts[0];
        if (!['www', 'api', 'admin', 'app'].includes(sub)) return sub;
      }
    }
  } catch {}
  return null;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('drokex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Multi-tenant header: ensure backend resolves current tenant
    const sub = detectTenantSubdomain();
    if (sub) (config.headers as any)['X-Tenant-Subdomain'] = sub;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('drokex_refresh_token');
      if (refreshToken) {
        try {
          const response = await authApi.refreshToken(refreshToken);
          const { token, refreshToken: newRefreshToken } = response.data.data!;

          localStorage.setItem('drokex_token', token);
          localStorage.setItem('drokex_refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('drokex_token');
          localStorage.removeItem('drokex_refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token: stay on current page (allow public routes)
        // Do not redirect automatically; public pages must work without auth
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
    apiClient.post('/auth/login', data),
  
  register: (data: RegisterRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
    apiClient.post('/auth/register', data),

  registerCompany: (data: RegisterCompanyRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    apiClient.post('/auth/register-company', data),
  
  refreshToken: (refreshToken: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
    apiClient.post('/auth/refresh-token', { refreshToken }),
  
  revokeToken: (refreshToken: string): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    apiClient.post('/auth/revoke-token', { refreshToken }),
  
  getProfile: (): Promise<AxiosResponse<ApiResponse<User>>> => 
    apiClient.get('/auth/profile'),
  
  logout: (refreshToken: string): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    apiClient.post('/auth/logout', { refreshToken }),
};

// Companies API
export const companiesApi = {
  getCompanies: (page = 1, pageSize = 20, search?: string, isApproved?: boolean): Promise<AxiosResponse<ApiResponse<PagedResponse<Company>>>> => 
    apiClient.get('/companies', { params: { page, pageSize, search, isApproved } }),
  
  getCompany: (id: number): Promise<AxiosResponse<ApiResponse<Company>>> => 
    apiClient.get(`/companies/${id}`),
  
  createCompany: (data: CreateCompanyRequest): Promise<AxiosResponse<ApiResponse<Company>>> => 
    apiClient.post('/companies', data),
  
  updateCompany: (id: number, data: Partial<CreateCompanyRequest>): Promise<AxiosResponse<ApiResponse<Company>>> => 
    apiClient.put(`/companies/${id}`, data),
  
  approveCompany: (id: number): Promise<AxiosResponse<ApiResponse<Company>>> => 
    apiClient.post(`/companies/${id}/approve`),
  rejectCompany: (id: number, data: { reason: string; deactivate?: boolean }): Promise<AxiosResponse<ApiResponse<boolean>>> =>
    apiClient.post(`/companies/${id}/reject`, data),
  
  deleteCompany: (id: number): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    apiClient.delete(`/companies/${id}`),
};

// Products API
export const productsApi = {
  getProducts: (
    params: Partial<ProductSearchParams> & { page?: number; pageSize?: number }
  ): Promise<AxiosResponse<ApiResponse<PagedResponse<Product>>>> => 
    apiClient.get('/products', { params }),
  
  getProduct: (id: number): Promise<AxiosResponse<ApiResponse<Product>>> => 
    apiClient.get(`/products/${id}`),
  
  createProduct: (data: CreateProductRequest): Promise<AxiosResponse<ApiResponse<Product>>> => 
    apiClient.post('/products', data),
  
  updateProduct: (id: number, data: Partial<UpdateProductRequest>): Promise<AxiosResponse<ApiResponse<Product>>> => 
    apiClient.put(`/products/${id}`, data),
  
  deleteProduct: (id: number): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    apiClient.delete(`/products/${id}`),

  addImage: (id: number, data: { imageUrl: string; isPrimary?: boolean; displayOrder?: number; mimeType?: string; fileSizeBytes?: number; }): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.post(`/products/${id}/images`, data),

  deleteImage: (id: number, imageId: number): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.delete(`/products/${id}/images/${imageId}`),

  setPrimaryImage: (id: number, imageId: number): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.post(`/products/${id}/images/${imageId}/primary`),
};

// Catalog API (Public)
export const catalogApi = {
  getProducts: (params: Partial<ProductSearchParams>): Promise<AxiosResponse<ApiResponse<PagedResponse<Product>>>> => 
    apiClient.get('/catalog/products', { params }),
  
  getProduct: (id: number): Promise<AxiosResponse<ApiResponse<Product>>> => 
    apiClient.get(`/catalog/products/${id}`),
  
  getCompanies: (page = 1, pageSize = 20, search?: string): Promise<AxiosResponse<ApiResponse<PagedResponse<Company>>>> => 
    apiClient.get('/catalog/companies', { params: { page, pageSize, search } }),
  
  getCategories: (): Promise<AxiosResponse<ApiResponse<Category[]>>> => 
    apiClient.get('/catalog/categories'),
  
  getFeaturedProducts: (take = 8): Promise<AxiosResponse<ApiResponse<Product[]>>> => 
    apiClient.get('/catalog/featured-products', { params: { take } }),
  getBusinessTypes: (): Promise<AxiosResponse<ApiResponse<{ id: number; name: string; description?: string }[]>>> =>
    apiClient.get('/catalog/business-types'),
};

// Geo API (public)
export const geoApi = {
  getCities: (countryCode: string) =>
    apiClient.get(`/geo/cities/${encodeURIComponent(countryCode)}`),
  getCoverage: () =>
    apiClient.get('/geo/coverage'),
};

// Leads API
export const leadsApi = {
  createLead: (data: CreateLeadRequest): Promise<AxiosResponse<ApiResponse<Lead>>> => 
    apiClient.post('/leads', data),
  
  getLeads: (page = 1, pageSize = 20, isContacted?: boolean, search?: string): Promise<AxiosResponse<ApiResponse<PagedResponse<Lead>>>> => 
    apiClient.get('/leads', { params: { page, pageSize, isContacted, search } }),
  
  getLead: (id: number): Promise<AxiosResponse<ApiResponse<Lead>>> => 
    apiClient.get(`/leads/${id}`),
  
  updateLead: (id: number, data: { isContacted: boolean; notes?: string }): Promise<AxiosResponse<ApiResponse<Lead>>> => 
    apiClient.put(`/leads/${id}`, data),
  
  deleteLead: (id: number): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    apiClient.delete(`/leads/${id}`),
};

// Categories Admin API
export const categoriesApi = {
  create: (data: { name: string; description?: string; displayOrder?: number; parentCategoryId?: number }) =>
    apiClient.post('/categories', data),
};

// Tenants API (Admin/General)
export const tenantsApi = {
  getStatistics: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.get('/tenants/statistics'),
  getCurrent: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.get('/tenants/current'),
  getCms: (): Promise<AxiosResponse<ApiResponse<{ heroTitle?: string; heroSubtitle?: string; ctaText?: string; heroVideoUrl?: string; heroVideoPoster?: string }>>> =>
    apiClient.get('/tenants/cms'),
  updateCms: (data: { heroTitle?: string; heroSubtitle?: string; ctaText?: string; heroVideoUrl?: string; heroVideoPoster?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.put('/tenants/cms', data),
  getSupportedCountries: (): Promise<AxiosResponse<ApiResponse<string[]>>> =>
    apiClient.get('/tenants/supported-countries'),
  checkSubdomain: (subdomain: string): Promise<AxiosResponse<ApiResponse<{ Subdomain: string; IsAvailable: boolean; SuggestedUrl: string; Message: string }>>> =>
    apiClient.get(`/tenants/check-subdomain/${encodeURIComponent(subdomain)}`),
  setupTenant: (payload: { subdomain: string; country: string; countryCode: string; currency: string; currencySymbol: string; adminEmail: string; timeZone?: string; languageCode?: string; }): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.post('/tenants/setup', {
      subdomain: payload.subdomain,
      country: payload.country,
      countryCode: payload.countryCode,
      currency: payload.currency,
      currencySymbol: payload.currencySymbol,
      adminEmail: payload.adminEmail,
      timeZone: payload.timeZone,
      languageCode: payload.languageCode,
    }),
};

// Activities API
export const activitiesApi = {
  getRecent: (take = 10) =>
    apiClient.get('/activities/recent', { params: { take } }),
};

// Tenant Users API (Admin)
export const tenantUsersApi = {
  getUsers: (page = 1, pageSize = 20, search?: string, role?: string, isActive?: boolean) =>
    apiClient.get('/users', { params: { page, pageSize, search, role, isActive } }),
  createUser: (data: { email: string; firstName: string; lastName: string; role: string; companyId?: number; password?: string }) =>
    apiClient.post('/users', data),
  updateUser: (id: number, data: { firstName?: string; lastName?: string; role?: string; companyId?: number; isActive?: boolean }) =>
    apiClient.put(`/users/${id}`, data),
  resetPassword: (id: number, newPassword?: string) =>
    apiClient.post(`/users/${id}/reset-password`, { newPassword }),
};

// Images API
export const imagesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<string>>('/images/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Helper functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('drokex_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('drokex_token');
  localStorage.removeItem('drokex_refresh_token');
};

export const getAuthToken = () => {
  return localStorage.getItem('drokex_token');
};

export default apiClient;
