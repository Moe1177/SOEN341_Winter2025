import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for reliable token management
 * 
 * Provides reliable methods for getting and setting the authentication token,
 * with proper error handling and state management.
 */
export function useToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Safely retrieve token from localStorage
  const getToken = useCallback(() => {
    try {
      // Use 'authToken' to match useAuth.ts implementation
      const storedToken = localStorage.getItem('authToken');
      console.log('Retrieved authToken from localStorage:', storedToken ? 'exists' : 'null');
      return storedToken;
    } catch (err) {
      console.error('Error accessing localStorage for token:', err);
      setError(err instanceof Error ? err : new Error('Failed to access localStorage'));
      return null;
    }
  }, []);

  // Safely store token in localStorage
  const saveToken = useCallback((newToken: string | null) => {
    try {
      if (newToken) {
        // Use 'authToken' to match useAuth.ts implementation
        localStorage.setItem('authToken', newToken);
      } else {
        localStorage.removeItem('authToken');
      }
      setToken(newToken);
      return true;
    } catch (err) {
      console.error('Error saving token to localStorage:', err);
      setError(err instanceof Error ? err : new Error('Failed to save to localStorage'));
      return false;
    }
  }, []);

  // Refresh the token state from localStorage
  const refreshToken = useCallback(() => {
    try {
      setIsLoading(true);
      const storedToken = getToken();
      setToken(storedToken);
      setError(null);
      return storedToken;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh token'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Clear the token (logout)
  const clearToken = useCallback(() => {
    try {
      // Use 'authToken' to match useAuth.ts implementation
      localStorage.removeItem('authToken');
      setToken(null);
      return true;
    } catch (err) {
      console.error('Error clearing token from localStorage:', err);
      setError(err instanceof Error ? err : new Error('Failed to clear token'));
      return false;
    }
  }, []);

  // Initialize token on component mount
  useEffect(() => {
    refreshToken();
    // We intentionally only want this to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    token,
    isLoading,
    error,
    getToken,
    saveToken,
    refreshToken,
    clearToken,
  };
}

export default useToken; 