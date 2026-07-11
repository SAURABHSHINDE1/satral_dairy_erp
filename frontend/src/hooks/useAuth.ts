import { useAuthStore } from '../store/auth.store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return {
    user,
    isAuthenticated,
    logout,
    hasRole: (roles: string[]) => user ? roles.includes(user.role) : false,
  };
};
