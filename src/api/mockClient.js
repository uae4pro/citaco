// Mock client to replace Base44 SDK functionality
import { mockSpareParts, mockUsers, mockCartItems, mockOrders, mockAppSettings } from '../data/mockData.js';

// Utility functions for localStorage
const getFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
  }
};

// Initialize localStorage with mock data if not present
const initializeStorage = () => {
  if (!localStorage.getItem('spareParts')) {
    saveToStorage('spareParts', mockSpareParts);
  }
  if (!localStorage.getItem('users')) {
    saveToStorage('users', mockUsers);
  }
  if (!localStorage.getItem('cartItems')) {
    saveToStorage('cartItems', mockCartItems);
  }
  if (!localStorage.getItem('orders')) {
    saveToStorage('orders', mockOrders);
  }
  if (!localStorage.getItem('appSettings')) {
    saveToStorage('appSettings', mockAppSettings);
  }
  if (!localStorage.getItem('currentUser')) {
    // Set default user
    saveToStorage('currentUser', mockUsers[0]);
  }
};

// Initialize storage on module load
initializeStorage();

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Mock entity classes
class MockEntity {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  async list(sortBy = null, limit = null) {
    let data = getFromStorage(this.storageKey, []);
    
    if (sortBy) {
      const isDescending = sortBy.startsWith('-');
      const field = isDescending ? sortBy.substring(1) : sortBy;
      
      data.sort((a, b) => {
        if (field === 'created_date') {
          const dateA = new Date(a[field]);
          const dateB = new Date(b[field]);
          return isDescending ? dateB - dateA : dateA - dateB;
        }
        
        if (a[field] < b[field]) return isDescending ? 1 : -1;
        if (a[field] > b[field]) return isDescending ? -1 : 1;
        return 0;
      });
    }
    
    if (limit) {
      data = data.slice(0, limit);
    }
    
    return data;
  }

  async get(id) {
    const data = getFromStorage(this.storageKey, []);
    const item = data.find(item => item.id === id);
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  }

  async filter(filters = {}, sortBy = null) {
    let data = getFromStorage(this.storageKey, []);
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      data = data.filter(item => {
        if (typeof value === 'boolean') {
          return item[key] === value;
        }
        if (typeof value === 'string') {
          return item[key] && item[key].toString().toLowerCase().includes(value.toLowerCase());
        }
        return item[key] === value;
      });
    });
    
    // Apply sorting
    if (sortBy) {
      const isDescending = sortBy.startsWith('-');
      const field = isDescending ? sortBy.substring(1) : sortBy;
      
      data.sort((a, b) => {
        if (field === 'created_date') {
          const dateA = new Date(a[field]);
          const dateB = new Date(b[field]);
          return isDescending ? dateB - dateA : dateA - dateB;
        }
        
        if (a[field] < b[field]) return isDescending ? 1 : -1;
        if (a[field] > b[field]) return isDescending ? -1 : 1;
        return 0;
      });
    }
    
    return data;
  }

  async create(itemData) {
    const data = getFromStorage(this.storageKey, []);
    const newItem = {
      ...itemData,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    data.push(newItem);
    saveToStorage(this.storageKey, data);
    return newItem;
  }

  async update(id, updateData) {
    const data = getFromStorage(this.storageKey, []);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    data[index] = {
      ...data[index],
      ...updateData,
      updated_date: new Date().toISOString()
    };
    
    saveToStorage(this.storageKey, data);
    return data[index];
  }

  async delete(id) {
    const data = getFromStorage(this.storageKey, []);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    const deletedItem = data.splice(index, 1)[0];
    saveToStorage(this.storageKey, data);
    return deletedItem;
  }
}

// Mock Auth class for User management
class MockAuth {
  async me() {
    return getFromStorage('currentUser', mockUsers[0]);
  }

  async list() {
    return getFromStorage('users', []);
  }

  async login(email, password) {
    const users = getFromStorage('users', []);
    const user = users.find(u => u.email === email);
    if (user) {
      saveToStorage('currentUser', user);
      return user;
    }
    throw new Error('Invalid credentials');
  }

  async logout() {
    localStorage.removeItem('currentUser');
    return true;
  }
}

// Create mock client
export const mockClient = {
  entities: {
    SparePart: new MockEntity('spareParts'),
    CartItem: new MockEntity('cartItems'),
    Order: new MockEntity('orders'),
    AppSettings: new MockEntity('appSettings')
  },
  auth: new MockAuth(),
  integrations: {
    Core: {
      InvokeLLM: {
        execute: async (params) => {
          // Mock LLM response
          return { result: "Mock LLM response", success: true };
        }
      },
      SendEmail: {
        execute: async (params) => {
          // Mock email sending
          console.log('Mock email sent:', params);
          return { success: true, message: "Email sent successfully" };
        }
      },
      UploadFile: {
        execute: async (params) => {
          // Mock file upload
          return { success: true, url: "https://example.com/mock-file.jpg" };
        }
      },
      GenerateImage: {
        execute: async (params) => {
          // Mock image generation
          return { success: true, url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" };
        }
      },
      ExtractDataFromUploadedFile: {
        execute: async (params) => {
          // Mock data extraction
          return { success: true, data: { extracted: "mock data" } };
        }
      }
    }
  }
};
