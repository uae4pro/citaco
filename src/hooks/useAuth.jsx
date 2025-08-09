import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/api/apiClient';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiClient.setToken(token);
        const userData = await apiClient.get('/auth/me');
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      apiClient.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        apiClient.setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        apiClient.setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('authToken');
      apiClient.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await apiClient.put('/auth/change-password', passwordData);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  // Mock authentication for development (when backend is not available)
  const mockLogin = async (email, password) => {
    console.log('mockLogin called with:', email, password); // Debug log

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock users
    const mockUsers = [
      {
        id: 'user1',
        email: 'admin@autoparts.com',
        name: 'Admin User',
        role: 'admin'
      },
      {
        id: 'user2',
        email: 'john.doe@example.com',
        name: 'John Doe',
        role: 'customer'
      }
    ];

    const user = mockUsers.find(u => u.email === email);
    console.log('Found user:', user); // Debug log
    console.log('Email comparison:', email, '===', user?.email, ':', email === user?.email); // Debug log
    console.log('Password comparison:', password, '=== password123:', password === 'password123'); // Debug log

    if (user && password === 'password123') {
      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      setUser(user);
      setIsAuthenticated(true);
      console.log('Mock login successful:', user); // Debug log
      return user;
    } else {
      console.log('Mock login failed - invalid credentials'); // Debug log
      console.log('User found:', !!user, 'Password correct:', password === 'password123'); // Debug log
      throw new Error('Invalid email or password');
    }
  };

  const mockRegister = async (userData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newUser = {
      id: 'user' + Date.now(),
      email: userData.email,
      name: userData.name,
      role: 'customer'
    };

    const mockToken = 'mock-jwt-token-' + Date.now();
    localStorage.setItem('authToken', mockToken);
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  // Use mock authentication if backend is not available
  const authLogin = async (email, password) => {
    console.log('authLogin called with:', email); // Debug log

    // For now, always use mock authentication since backend might not be running
    console.log('Using mock authentication directly'); // Debug log
    return await mockLogin(email, password);

    /* Commented out real backend login for now
    try {
      console.log('Trying real backend login...'); // Debug log
      return await login(email, password);
    } catch (error) {
      console.log('Backend login failed:', error.message); // Debug log
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        console.warn('Backend not available, using mock authentication');
        return await mockLogin(email, password);
      }
      throw error;
    }
    */
  };

  const authRegister = async (userData) => {
    console.log('authRegister called with:', userData.email); // Debug log

    // For now, always use mock authentication since backend might not be running
    console.log('Using mock registration directly'); // Debug log
    return await mockRegister(userData);

    /* Commented out real backend registration for now
    try {
      return await register(userData);
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        console.warn('Backend not available, using mock authentication');
        return await mockRegister(userData);
      }
      throw error;
    }
    */
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login: authLogin,
    register: authRegister,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
