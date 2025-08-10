import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export function useActivityTimeout() {
  const { isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        // Redirect to logout endpoint which will take user back to landing page
        window.location.href = '/api/logout';
      }, TIMEOUT_DURATION);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimeoutHandler = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated]);

  return { resetTimeout };
}