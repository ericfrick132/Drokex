import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const superAdminClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach SuperAdmin token
superAdminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export const superadminApi = {
  // Auth
  refresh: (refreshToken: string) => superAdminClient.post('/superadmin/auth/refresh', { refreshToken }),
  logout: () => superAdminClient.post('/superadmin/auth/logout'),
  switchTenant: (tenantId: number) => superAdminClient.post('/superadmin/auth/switch-tenant', { tenantId }),

  // Analytics & stats
  getAnalytics: () => superAdminClient.get('/superadmin/analytics'),

  // Tenants
  getTenants: () => superAdminClient.get('/superadmin/tenants'),
  getPendingTenants: () => superAdminClient.get('/superadmin/tenants/pending'),
  getTenant: (id: number) => superAdminClient.get(`/superadmin/tenants/${id}`),
  createTenant: (data: any) => superAdminClient.post('/superadmin/tenants', data),
  updateTenant: (id: number, data: any) => superAdminClient.put(`/superadmin/tenants/${id}`, data),
  approveTenant: (id: number) => superAdminClient.post(`/superadmin/tenants/${id}/approve`),
  checkSubdomain: (subdomain: string) => superAdminClient.get(`/superadmin/tenants/check-subdomain/${encodeURIComponent(subdomain)}`),

  // Users
  getUsers: (tenantId?: number) => superAdminClient.get('/superadmin/users', { params: { tenantId } }),

  // Impersonation
  impersonate: (tenantId: number, userEmail?: string, userId?: number) => 
    superAdminClient.post('/superadmin/impersonate', { tenantId, userEmail, userId }),

  // Business Types
  getBusinessTypes: () => superAdminClient.get('/superadmin/business-types'),
  createBusinessType: (data: { name: string; description?: string; displayOrder?: number; isActive?: boolean }) =>
    superAdminClient.post('/superadmin/business-types', data),
  updateBusinessType: (id: number, data: { name?: string; description?: string; displayOrder?: number; isActive?: boolean }) =>
    superAdminClient.put(`/superadmin/business-types/${id}`, data),
  deleteBusinessType: (id: number) => superAdminClient.delete(`/superadmin/business-types/${id}`),
};

export default superadminApi;
