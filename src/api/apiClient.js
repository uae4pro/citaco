// API client for communicating with the backend server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Entity classes that use the API client
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async list(sortBy = null, limit = null) {
    let url = this.endpoint;
    const params = new URLSearchParams();
    
    if (sortBy) params.append('sort', sortBy);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url);
    return response.parts || response.orders || response.users || response;
  }

  async get(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  async filter(filters = {}, sortBy = null) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    
    if (sortBy) params.append('sort', sortBy);
    
    const url = `${this.endpoint}?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.parts || response.orders || response.users || response;
  }

  async create(data) {
    const response = await apiClient.post(this.endpoint, data);
    return response.part || response.order || response.user || response;
  }

  async update(id, data) {
    const response = await apiClient.put(`${this.endpoint}/${id}`, data);
    return response.part || response.order || response.user || response;
  }

  async delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }
}

// Spare Parts Entity
class SparePartEntity extends BaseEntity {
  constructor() {
    super('/parts');
  }

  async search(term) {
    return apiClient.get(`${this.endpoint}/search/${encodeURIComponent(term)}`);
  }

  async getByCategory(category) {
    return apiClient.get(`${this.endpoint}/category/${category}`);
  }

  async getLowStock(threshold = 10) {
    return apiClient.get(`${this.endpoint}/admin/low-stock?threshold=${threshold}`);
  }

  async updateStock(id, quantity) {
    const response = await apiClient.patch(`${this.endpoint}/${id}/stock`, { quantity });
    return response.part || response;
  }
}

// Cart Entity
class CartEntity {
  constructor() {
    this.endpoint = '/cart';
  }

  async list() {
    const response = await apiClient.get(this.endpoint);
    return response.items || [];
  }

  async filter(filters = {}) {
    // For compatibility with existing code
    return this.list();
  }

  async create(data) {
    const response = await apiClient.post(`${this.endpoint}/add`, data);
    return response.cartItem || response;
  }

  async update(id, data) {
    const response = await apiClient.put(`${this.endpoint}/${id}`, data);
    return response.cartItem || response;
  }

  async delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  async clear() {
    return apiClient.delete(this.endpoint);
  }

  async getCount() {
    return apiClient.get(`${this.endpoint}/count`);
  }
}

// Orders Entity
class OrderEntity extends BaseEntity {
  constructor() {
    super('/orders');
  }

  async createFromCart(orderData) {
    const response = await apiClient.post(`${this.endpoint}/create`, orderData);
    return response.order || response;
  }

  async updateStatus(id, statusData) {
    const response = await apiClient.put(`${this.endpoint}/${id}/status`, statusData);
    return response.order || response;
  }

  async cancel(id) {
    const response = await apiClient.put(`${this.endpoint}/${id}/cancel`);
    return response.order || response;
  }

  async getAllOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`${this.endpoint}/admin/all?${params.toString()}`);
    return response.orders || response;
  }
}

// Auth Entity
class AuthEntity {
  constructor() {
    this.endpoint = '/auth';
  }

  async me() {
    try {
      return await apiClient.get(`${this.endpoint}/me`);
    } catch (error) {
      // If backend is not available, check for mock user in localStorage
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        const token = localStorage.getItem('authToken');
        if (token && token.startsWith('mock-jwt-token')) {
          // Return mock user data
          return {
            id: 'user1',
            email: 'admin@autoparts.com',
            name: 'Admin User',
            role: 'admin'
          };
        }
      }
      throw error;
    }
  }

  async list() {
    const response = await apiClient.get('/users');
    return response.users || response;
  }

  async login(credentials) {
    const response = await apiClient.post(`${this.endpoint}/login`, credentials);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.user || response;
  }

  async register(userData) {
    const response = await apiClient.post(`${this.endpoint}/register`, userData);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.user || response;
  }

  async logout() {
    const response = await apiClient.post(`${this.endpoint}/logout`);
    apiClient.setToken(null);
    return response;
  }

  async updateProfile(data) {
    const response = await apiClient.put(`${this.endpoint}/profile`, data);
    return response.user || response;
  }

  async changePassword(passwordData) {
    return apiClient.put(`${this.endpoint}/change-password`, passwordData);
  }
}

// App Settings Entity
class AppSettingsEntity extends BaseEntity {
  constructor() {
    super('/settings');
  }

  async getCurrent() {
    // For now, return mock settings since we don't have a settings endpoint yet
    return {
      id: "settings1",
      app_name: "AutoParts Store",
      currency: "USD",
      tax_rate: 0.08,
      shipping_cost: 9.99,
      free_shipping_threshold: 100.00
    };
  }
}

// Export entity instances
export const SparePart = new SparePartEntity();
export const CartItem = new CartEntity();
export const Order = new OrderEntity();
export const User = new AuthEntity();
export const AppSettings = new AppSettingsEntity();
