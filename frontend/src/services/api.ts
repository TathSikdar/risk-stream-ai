import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const transactionService = {
  getTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
  
  analyzeTransaction: async (id: number) => {
    const response = await api.post(`/transactions/${id}/analyze`);
    return response.data;
  },
  
  ingestTransaction: async (data: any) => {
    const response = await api.post('/ingest', data);
    return response.data;
  },
  
  scanTransactions: async () => {
    const response = await api.post('/transactions/scan');
    return response.data;
  },
  
  deleteTransaction: async (id: number) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

export const settingsService = {
  getTargets: async () => {
    const response = await api.get('/settings/targets');
    return response.data;
  },
  
  addTarget: async (entity_name: string, category: string) => {
    const response = await api.post('/settings/targets', { entity_name, category });
    return response.data;
  },
  
  removeTarget: async (id: number) => {
    const response = await api.delete(`/settings/targets/${id}`);
    return response.data;
  },
  
  getSystemConfig: async () => {
    const response = await api.get('/settings/system');
    return response.data;
  }
};

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
