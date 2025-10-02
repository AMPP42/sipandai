import { useState, useEffect } from 'react';
import { handleApiError, retryWithBackoff } from '@/lib/error-handling';

interface UseFetchOptions<T> {
  initialData?: T;
  dependencies?: any[];
  retries?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  showErrorToast?: boolean;
}

/**
 * Custom hook for data fetching with error handling and retries
 * @param fetchFn Function that returns a promise with data
 * @param options Configuration options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
) {
  const {
    initialData,
    dependencies = [],
    retries = 3,
    onSuccess,
    onError,
    showErrorToast = true,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryWithBackoff(() => fetchFn(), retries);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      handleApiError(err, 'Failed to fetch data', showErrorToast);
      onError?.(err);
      return initialData;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useFetch;