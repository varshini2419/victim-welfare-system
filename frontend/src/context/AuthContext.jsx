import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const decodeJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    const json = decodeURIComponent(
      decoded.split('').map((ch) => {
        return '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(json);
  } catch (err) {
    console.error('JWT decode failed:', err);
    return null;
  }
};

const normalizeUserObject = (payload) => {
  if (!payload) return null;

  return {
    id: payload.userId || payload.id || payload._id,
    name: payload.name || '',
    email: payload.email || '',
    role: payload.role || ''
  };
};

const clearLegacyAuthKeys = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('counselor');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('counselorToken');
  localStorage.removeItem('victimToken');
  sessionStorage.clear();
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;

    try {
      const parsed = JSON.parse(savedUser);
      return normalizeUserObject(parsed);
    } catch (err) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!storedToken) {
      setAuthReady(true);
      return;
    }

    const decoded = decodeJwt(storedToken);
    let stored = null;

    try {
      stored = storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error('Stored auth user data is invalid:', err);
    }

    if (!stored && decoded) {
      setUser(normalizeUserObject(decoded));
    }

    if (decoded?.role && stored?.role && decoded.role !== stored.role) {
      console.error('AUTH SESSION MISMATCH', {
        storedRole: stored.role,
        tokenRole: decoded.role,
        storedUser,
        currentToken: storedToken
      });

      clearLegacyAuthKeys();
      setToken(null);
      setUser(null);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login' && window.location.pathname !== '/counselor/login') {
        window.location.href = '/login';
      }
    }

    setAuthReady(true);
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      console.log('LOGIN RESPONSE:', res.data);

      const loginData = res.data.data;
      const newToken = loginData.token;
      const newUser = normalizeUserObject({
        id: loginData.userId,
        name: loginData.name,
        email: loginData.email,
        role: loginData.role
      });

      console.log('NEW USER ROLE:', newUser?.role);
      console.log('NEW TOKEN:', newToken);

      const decoded = decodeJwt(newToken);
      console.log('JWT ROLE:', decoded?.role);

      clearLegacyAuthKeys();

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return newUser;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const loginVictim = async (caseId, phone, otp) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login/victim', { caseId, phone, otp });

      console.log('LOGIN RESPONSE:', res.data);

      const loginData = res.data.data;
      const newToken = loginData.token;
      const newUser = normalizeUserObject({
        id: loginData.userId,
        name: loginData.name,
        email: loginData.email,
        role: loginData.role
      });

      console.log('NEW USER ROLE:', newUser?.role);
      console.log('NEW TOKEN:', newToken);

      const decoded = decodeJwt(newToken);
      console.log('JWT ROLE:', decoded?.role);

      clearLegacyAuthKeys();

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return newUser;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const sendVictimOtp = async (caseId, phone) => {
    try {
      const res = await api.post('/auth/login/victim/send-otp', { caseId, phone });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Unable to send OTP');
    }
  };

  const resendVictimOtp = async (caseId, phone) => {
    try {
      const res = await api.post('/auth/login/victim/resend-otp', { caseId, phone });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Unable to resend OTP');
    }
  };

  const logout = () => {
    clearLegacyAuthKeys();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, role: user?.role, loginUser, loginVictim, sendVictimOtp, resendVictimOtp, logout, loading, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
