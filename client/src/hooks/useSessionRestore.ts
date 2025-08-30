import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';

const SESSION_STORAGE_KEY = 'lastAuthenticatedRoute';

export function useSessionRestore() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Save current route when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Only save routes that are part of the authenticated flow
      const authenticatedRoutes = ['/', '/ride', '/driver', '/trips', '/pricing', '/payment-methods', '/add-payment-method', '/checkout', '/payment-history', '/advanced-navigation', '/profile'];
      if (authenticatedRoutes.includes(location)) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, location);
      }
    }
  }, [isAuthenticated, isLoading, location]);

  // Restore last route when user logs back in (only on first authentication)
  useEffect(() => {
    if (isAuthenticated && !isLoading && location === '/') {
      const lastRoute = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (lastRoute && lastRoute !== '/' && lastRoute !== location) {
        // Small delay to ensure auth state is fully loaded
        setTimeout(() => {
          setLocation(lastRoute);
        }, 100);
      }
    }
  }, [isAuthenticated, isLoading]);

  // Clear stored route when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [isAuthenticated, isLoading]);
}