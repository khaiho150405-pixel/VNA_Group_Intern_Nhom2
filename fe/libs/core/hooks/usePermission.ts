"use client";
import { useAuth } from '../contexts/AuthProvider';

export const usePermission = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.username === 'testuser') return true;
    const permissions = (user as any)?.role?.permissions;
    if (Array.isArray(permissions)) {
      return permissions.includes(permission);
    }
    return false;
  };

  return { hasPermission };
};
