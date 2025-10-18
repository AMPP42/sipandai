import { useState, useCallback } from 'react';
import { checkRateLimit, clearRateLimit } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';

interface RateLimitConfig {
  key: string;
  maxRequests?: number;
  windowMs?: number;
}

/**
 * Custom hook for rate limiting user actions
 * Prevents abuse and excessive API calls
 */
export const useRateLimit = ({ 
  key, 
  maxRequests = 5, 
  windowMs = 60000 
}: RateLimitConfig) => {
  const [isBlocked, setIsBlocked] = useState(false);

  const checkLimit = useCallback(() => {
    const allowed = checkRateLimit(key, maxRequests, windowMs);
    
    if (!allowed) {
      setIsBlocked(true);
      toast({
        variant: 'destructive',
        title: 'Terlalu Banyak Percobaan',
        description: `Silakan tunggu ${Math.ceil(windowMs / 1000)} detik sebelum mencoba lagi.`,
      });
      
      // Auto-clear block after window expires
      setTimeout(() => {
        setIsBlocked(false);
      }, windowMs);
    }
    
    return allowed;
  }, [key, maxRequests, windowMs]);

  const reset = useCallback(() => {
    clearRateLimit(key);
    setIsBlocked(false);
  }, [key]);

  return {
    checkLimit,
    reset,
    isBlocked,
  };
};
