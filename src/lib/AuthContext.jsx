import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '@/db/database';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    const setup = async () => {
      try {
        setIsLoadingPublicSettings(true);
        setAuthError(null);

        const currentUser = await db.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setAppPublicSettings({ id: 'local-app', public_settings: {} });
      } catch (error) {
        setAuthError({ type: 'unknown', message: 'Falha ao carregar o usuário local' });
        setIsAuthenticated(false);
      } finally {
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    };

    setup();
  }, []);

  const logout = () => {
    db.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    // local mode does not require external login; keep app functional
    return;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState: () => Promise.resolve()
    }}>
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
