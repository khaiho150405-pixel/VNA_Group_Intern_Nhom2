"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie, setCookie } from '@core/services/cookies';
import { IUser } from '@shared/tts/models/auth.model';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  login: (userData: IUser, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    setMounted(true);
    // Sync with localStorage/cookies on load
    try {
      const storedUser = localStorage.getItem('user');
      const token = getCookie('accessToken');

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      } else {
        // Clear both if either is missing
        localStorage.removeItem('user');
        deleteCookie('accessToken');
        setUser(null);

        // Redirect to login if not already on public pages
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/forgot-password') {
          router.replace('/login');
        }
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('user');
      deleteCookie('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const login = (userData: IUser, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCookie('accessToken', token, 7); // Essential for Middleware
    window.location.href = '/';
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    deleteCookie('accessToken');
    // Use window.location.href for a full refresh to clear any cached states
    window.location.href = '/login';
  };

  // Guard for Auth pages: redirect to home if already authenticated
  useEffect(() => {
    if (mounted && isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/forgot-password')) {
      router.replace('/');
    }
  }, [mounted, isAuthenticated, router]);

  // Prevent hydration mismatch by only rendering children after mount if needed,
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

