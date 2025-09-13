import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Configuración del cliente HTTP con tenant headers
const tenantApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar headers de tenant automáticamente
tenantApiClient.interceptors.request.use((config) => {
  // Obtener tenant desde localStorage o URL
  const tenantSubdomain = getCurrentTenantSubdomain();
  
  if (tenantSubdomain) {
    config.headers['X-Tenant-Subdomain'] = tenantSubdomain;
  }

  // Agregar token de auth si existe
  const token = localStorage.getItem('drokex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor para manejar respuestas y errores
tenantApiClient.interceptors.response.use(
  (response) => {
    // Log información de tenant en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const tenantHeader = response.headers['x-drokex-tenant'];
      const regionHeader = response.headers['x-drokex-region'];
      
      if (tenantHeader) {
        console.log(`📡 Drokex Response - Tenant: ${tenantHeader}, Region: ${regionHeader}`);
      }
    }
    
    return response;
  },
  (error) => {
    // Manejar errores específicos de tenant
    if (error.response?.status === 400 && 
        error.response?.data?.error === 'Tenant requerido') {
      console.error('❌ Error de tenant:', error.response.data.message);
      
      // Redirigir a página de setup si no hay tenant
      if (window.location.pathname !== '/setup') {
        window.location.href = '/setup';
      }
    }
    
    return Promise.reject(error);
  }
);

// Funciones para manejo de tenant
const getCurrentTenantSubdomain = (): string | null => {
  try {
    // 1) Producción: subdomain.drokex.com; 2) Desarrollo: subdomain.localhost
    const hostname = window.location.hostname.toLowerCase();
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];
      if ((secondLast === 'drokex' && last === 'com') || last === 'localhost') {
        const subdomain = parts[0];
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
          return subdomain;
        }
      }
    }
  } catch {}
  return null;
};

const setTenantSubdomain = (_subdomain: string): void => {
  // No-op: tenant se resuelve por subdominio del host o query param
  // Se mantiene por compatibilidad con llamadas existentes
  console.log('🏷️ Tenant se resuelve por subdominio/URL; setTenantSubdomain es no-op');
};

// Interface para respuestas de la API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  tenant: {
    id: number;
    subdomain: string;
    region: string;
  };
  timestamp: string;
  drokexBrand?: string;
}

// Interface para setup de tenant
interface TenantSetupData {
  subdomain: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  adminEmail: string;
  timeZone?: string;
  languageCode?: string;
}

// Servicios de tenant
export const tenantService = {
  // Obtener tenant actual
  async getCurrentTenant(): Promise<ApiResponse<any>> {
    try {
      const response = await tenantApiClient.get('/tenants/current');
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo tenant actual:', error);
      throw new Error(error.response?.data?.message || 'Error de conexión');
    }
  },

  // Listar todos los tenants (solo desarrollo)
  async getAllTenants(): Promise<ApiResponse<any[]>> {
    try {
      const response = await tenantApiClient.get('/tenants');
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo lista de tenants:', error);
      throw new Error(error.response?.data?.message || 'Error de conexión');
    }
  },

  // Crear nuevo tenant
  async createTenant(setupData: TenantSetupData): Promise<ApiResponse<any>> {
    try {
      const response = await tenantApiClient.post('/tenants/setup', setupData);
      
      // Nota: el tenant se resuelve por subdominio/URL; no se persiste en localStorage
      
      return response.data;
    } catch (error: any) {
      console.error('Error creando tenant:', error);
      throw new Error(error.response?.data?.message || 'Error creando marketplace');
    }
  },

  // Verificar disponibilidad de subdominio
  async checkSubdomainAvailability(subdomain: string): Promise<ApiResponse<{
    subdomain: string;
    isAvailable: boolean;
    suggestedUrl: string;
    message: string;
  }>> {
    try {
      const response = await tenantApiClient.get(`/tenants/check-subdomain/${subdomain}`);
      return response.data;
    } catch (error: any) {
      console.error('Error verificando subdominio:', error);
      throw new Error(error.response?.data?.message || 'Error de validación');
    }
  },

  // Obtener estadísticas del tenant
  async getTenantStatistics(): Promise<ApiResponse<any>> {
    try {
      const response = await tenantApiClient.get('/tenants/statistics');
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo datos');
    }
  },

  // Actualizar configuración del tenant
  async updateTenantConfiguration(config: any): Promise<ApiResponse<any>> {
    try {
      const response = await tenantApiClient.put('/tenants/configuration', config);
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando configuración:', error);
      throw new Error(error.response?.data?.message || 'Error actualizando configuración');
    }
  },

  // Establecer tenant por subdomain
  setTenantSubdomain,

  // Obtener tenant actual desde cache/URL
  getCurrentTenantSubdomain,

  // Limpiar cache de tenant
  clearTenantCache(): void {
    console.log('🧹 Cache de tenant limpiado');
  },

  // Helper para URLs de tenant
  getTenantUrls(subdomain: string) {
    return {
      production: `https://${subdomain}.drokex.com`,
      development: `http://${subdomain}.localhost:3100`,
      api: API_BASE_URL
    };
  },

  // Helper para regiones disponibles
  getAvailableRegions() {
    return [
      {
        name: 'Honduras',
        subdomain: 'honduras',
        countryCode: 'HN',
        currency: 'HNL',
        currencySymbol: 'L',
        timeZone: 'America/Tegucigalpa',
        flag: '🇭🇳'
      },
      {
        name: 'Guatemala',
        subdomain: 'guatemala',
        countryCode: 'GT',
        currency: 'GTQ',
        currencySymbol: 'Q',
        timeZone: 'America/Guatemala',
        flag: '🇬🇹'
      },
      {
        name: 'México',
        subdomain: 'mexico',
        countryCode: 'MX',
        currency: 'MXN',
        currencySymbol: '$',
        timeZone: 'America/Mexico_City',
        flag: '🇲🇽'
      },
      {
        name: 'República Dominicana',
        subdomain: 'dominicana',
        countryCode: 'DO',
        currency: 'DOP',
        currencySymbol: 'RD$',
        timeZone: 'America/Santo_Domingo',
        flag: '🇩🇴'
      },
      {
        name: 'El Salvador',
        subdomain: 'elsalvador',
        countryCode: 'SV',
        currency: 'USD',
        currencySymbol: '$',
        timeZone: 'America/El_Salvador',
        flag: '🇸🇻'
      }
    ];
  }
};

export default tenantService;
