/**
 * Advanced sanitization utilities for user input
 * Provides additional security layer beyond Zod validation
 */

/**
 * Remove potentially dangerous characters from file names
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

/**
 * Sanitize SQL input (basic protection, RLS is primary defense)
 */
export const sanitizeSqlInput = (input: string): string => {
  return input
    .replace(/['";\\]/g, '')
    .trim()
    .substring(0, 1000);
};

/**
 * Remove potentially dangerous patterns from URLs
 */
export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitize phone numbers to Indonesian format
 */
export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert leading 0 to 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // Add 62 if not present
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  // Validate length (Indonesian phone numbers)
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Nomor telepon tidak valid');
  }
  
  return cleaned;
};

/**
 * Sanitize NIP (Nomor Induk Pegawai)
 */
export const sanitizeNIP = (nip: string): string => {
  // Remove all non-digit and non-space characters
  return nip
    .replace(/[^\d\s]/g, '')
    .trim()
    .substring(0, 25);
};

/**
 * Sanitize email addresses
 */
export const sanitizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .substring(0, 255);
};

/**
 * Deep sanitize object recursively
 */
export const deepSanitize = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      return obj.trim().substring(0, 10000);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  
  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = deepSanitize(obj[key]);
    }
  }
  
  return sanitized;
};
