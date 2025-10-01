import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { checkRateLimit, clearRateLimit } from '@/lib/validation';
import { useCallback } from 'react';

interface UseSecureFormOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: z.ZodSchema<T>;
  rateLimitKey?: string;
  maxSubmissions?: number;
  rateLimitWindowMs?: number;
  onValidSubmit: (data: T) => Promise<void>;
}

/**
 * Custom hook that wraps react-hook-form with security features:
 * - Zod validation
 * - Rate limiting
 * - Error handling
 * - Input sanitization
 */
export function useSecureForm<T extends FieldValues>({
  schema,
  rateLimitKey,
  maxSubmissions = 5,
  rateLimitWindowMs = 60000,
  onValidSubmit,
  ...formOptions
}: UseSecureFormOptions<T>) {
  const { toast } = useToast();
  
  const form = useForm<T>({
    ...formOptions,
    resolver: zodResolver(schema),
  });

  const handleSubmit = useCallback(
    async (data: T) => {
      // Rate limiting check
      if (rateLimitKey && !checkRateLimit(rateLimitKey, maxSubmissions, rateLimitWindowMs)) {
        toast({
          title: 'Terlalu Banyak Percobaan',
          description: 'Anda telah mencapai batas pengiriman. Silakan tunggu beberapa saat.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Additional validation
        const validated = schema.parse(data);
        
        // Execute submission
        await onValidSubmit(validated);
        
        // Clear rate limit on success
        if (rateLimitKey) {
          clearRateLimit(rateLimitKey);
        }
        
        // Reset form
        form.reset();
      } catch (error) {
        console.error('Form submission error:', error);
        
        if (error instanceof z.ZodError) {
          // Handle validation errors
          toast({
            title: 'Validasi Gagal',
            description: 'Mohon periksa kembali data yang Anda masukkan.',
            variant: 'destructive',
          });
        } else {
          // Handle other errors
          toast({
            title: 'Terjadi Kesalahan',
            description: error instanceof Error ? error.message : 'Gagal mengirim data. Silakan coba lagi.',
            variant: 'destructive',
          });
        }
      }
    },
    [schema, rateLimitKey, maxSubmissions, rateLimitWindowMs, onValidSubmit, toast, form]
  );

  return {
    ...form,
    handleSecureSubmit: form.handleSubmit(handleSubmit),
  };
}
