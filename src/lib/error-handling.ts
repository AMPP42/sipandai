// Error handling utilities for Tempo
import { toast } from '@/components/ui/use-toast';

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param retries Number of retries
 * @param delay Initial delay in ms
 * @returns Result of the function or throws the last error
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.warn(`Retry attempt, ${retries} attempts remaining`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

/**
 * Handle API errors gracefully
 * @param error Error object
 * @param fallbackMessage Fallback message if error doesn't have a message
 * @param showToast Whether to show a toast notification
 */
export const handleApiError = (
  error: unknown, 
  fallbackMessage = 'An unexpected error occurred', 
  showToast = true
): string => {
  let message = fallbackMessage;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as any).message);
  } else if (typeof error === 'string') {
    message = error;
  }
  
  console.error('API Error:', error);
  
  if (showToast) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    });
  }
  
  return message;
};

/**
 * Safe data fetcher with error handling
 * @param fetchFn Function that returns a promise with data
 * @param fallbackData Fallback data if fetch fails
 * @returns Data or fallback data
 */
export const safeDataFetch = async <T>(
  fetchFn: () => Promise<T>,
  fallbackData: T
): Promise<T> => {
  try {
    return await retryWithBackoff(fetchFn);
  } catch (error) {
    handleApiError(error);
    return fallbackData;
  }
};