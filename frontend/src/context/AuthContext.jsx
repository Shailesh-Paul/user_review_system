import { createContext, useState, useEffect, useCallback } from 'react';
import api, { setUnauthorizedHandler } from '../lib/api';
import { decodeJwtPayload, isJwtExpired } from '../lib/authSession';

export const AuthContext = createContext(null);

const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const persistAuth = (jwtToken, userData) => {
  localStorage.setItem('token', jwtToken);
  localStorage.setItem('user', JSON.stringify(userData));
};

async function fetchVerifiedUser(token, storedUser) {
  const payload = decodeJwtPayload(token);
  if (!payload || isJwtExpired(payload)) {
    return null;
  }

  const role = storedUser?.role ?? payload.role;

  if (role === 'USER') {
    const res = await api.get('/user/me');
    return res.data?.data ?? null;
  }

  if (role === 'ADMIN') {
    await api.get('/test/admin');
    return storedUser ?? { id: payload.id, role: 'ADMIN' };
  }

  if (role === 'STORE_OWNER') {
    await api.get('/test/store-owner');
    return storedUser ?? { id: payload.id, role: 'STORE_OWNER' };
  }

  return null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    return () => setUnauthorizedHandler(null);
  }, [clearAuth]);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      const savedUserRaw = localStorage.getItem('user');
      let savedUser = null;

      if (savedUserRaw) {
        try {
          savedUser = JSON.parse(savedUserRaw);
        } catch {
          clearStoredAuth();
        }
      }

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      if (savedUser) {
        setUser(savedUser);
      }

      try {
        const verifiedUser = await fetchVerifiedUser(storedToken, savedUser);
        if (verifiedUser) {
          setUser(verifiedUser);
          persistAuth(storedToken, verifiedUser);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [clearAuth]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = response.data;

    if (!jwtToken || !userData) {
      throw new Error('Invalid login response from server.');
    }

    persistAuth(jwtToken, userData);
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, address) => {
    await api.post('/auth/register', {
      name,
      email,
      password,
      address: address?.trim() ? address.trim() : undefined
    });
    return login(email, password);
  };

  const logout = () => {
    clearAuth();
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
