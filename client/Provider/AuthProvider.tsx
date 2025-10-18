import React, { createContext, useEffect, useState, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextValue {
  userId: string | null;
  loading: boolean;
  signIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('userId');
      setUserId(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = async (id: string) => {
    await AsyncStorage.setItem('userId', id);
    setUserId(id);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userId');
    setUserId(null);
  };

  const refresh = loadUser;

  return (
    <AuthContext.Provider value={{ userId, loading, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};