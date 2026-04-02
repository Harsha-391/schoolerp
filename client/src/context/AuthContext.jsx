import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        const savedSchool = localStorage.getItem('erp_school');
        if (savedSchool) setSchool(JSON.parse(savedSchool));
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData, school: schoolData } = res.data;
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(userData));
    if (schoolData) localStorage.setItem('erp_school', JSON.stringify(schoolData));
    setUser(userData);
    setSchool(schoolData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_school');
    setUser(null);
    setSchool(null);
  };

  return (
    <AuthContext.Provider value={{ user, school, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
