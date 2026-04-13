import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { getSubdomain, isAdminPortal as checkAdminPortal, isSchoolPortal as checkSchoolPortal } from '../utils/subdomain';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [school, setSchool]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Portal type — resolved once on mount from the hostname
  const [subdomain, setSubdomain]       = useState(null);
  const [adminPortal, setAdminPortal]   = useState(false); // true on admin.acadmay.in
  const [portalSchool, setPortalSchool] = useState(null);  // school info when on a school subdomain

  useEffect(() => {
    const init = async () => {
      const sub = getSubdomain();
      setSubdomain(sub);
      setAdminPortal(checkAdminPortal());

      // If it's a school subdomain, fetch school info for login-page branding
      if (checkSchoolPortal()) {
        try {
          const res = await api.get(`/auth/school/${sub}`);
          setPortalSchool(res.data);
        } catch {
          setPortalSchool(null); // subdomain exists but no matching school
        }
      }

      // Restore saved session
      const token     = localStorage.getItem('erp_token');
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
    };

    init();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    // First-time login — password change required, no token yet
    if (res.data.requiresPasswordChange) {
      return res.data; // { requiresPasswordChange, userId, role }
    }
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
    <AuthContext.Provider value={{
      user, school, loading,
      login, logout,
      subdomain, adminPortal, portalSchool,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
