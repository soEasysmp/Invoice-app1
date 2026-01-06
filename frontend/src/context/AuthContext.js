import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          console.error('Auth restore failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      } else if (savedToken) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          setUser(response.data);
          setToken(savedToken);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const staffLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/staff/login`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password, full_name, role = 'client') => {
    try {
      const response = await axios.post(`${API}/auth/register`, {
        email,
        password,
        full_name,
        role
      });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
