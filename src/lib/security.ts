/**
 * Security utility functions for the application
 */

// ============================================================================
// CONTENT SECURITY POLICY
// ============================================================================

/**
 * Get Content Security Policy headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://puiisklsrqzhigmnxeey.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://puiisklsrqzhigmnxeey.supabase.co wss://puiisklsrqzhigmnxeey.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Check if session is about to expire (less than 5 minutes remaining)
 */
export function isSessionExpiring(expiresAt: number): boolean {
  const now = Date.now() / 1000;
  const timeLeft = expiresAt - now;
  return timeLeft < 300; // 5 minutes
}

/**
 * Calculate session timeout warning time (5 minutes before expiry)
 */
export function getSessionWarningTime(expiresAt: number): number {
  return (expiresAt - 300) * 1000; // Convert to milliseconds
}

// ============================================================================
// INPUT VALIDATION HELPERS
// ============================================================================

/**
 * Check if string contains potentially dangerous patterns
 */
export function containsDangerousPatterns(input: string): boolean {
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /document\.cookie/gi,
    /document\.write/gi,
    /window\.location/gi,
    /eval\(/gi,
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate file type against allowed types
 */
export function isAllowedFileType(
  filename: string,
  allowedTypes: string[]
): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validate file size (in bytes)
 */
export function isAllowedFileSize(
  size: number,
  maxSizeInMB: number = 10
): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

export type UserRole = 'admin_pusat' | 'admin_unit';

export interface User {
  id: string;
  role: UserRole;
  unit?: string;
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user can access unit data
 */
export function canAccessUnit(user: User | null, unit: string): boolean {
  if (!user) return false;
  if (user.role === 'admin_pusat') return true;
  return user.role === 'admin_unit' && user.unit === unit;
}

/**
 * Check if user can modify employee data
 */
export function canModifyEmployee(
  user: User | null,
  employeeUnit: string
): boolean {
  if (!user) return false;
  if (user.role === 'admin_pusat') return true;
  return user.role === 'admin_unit' && user.unit === employeeUnit;
}

// ============================================================================
// DATA MASKING
// ============================================================================

/**
 * Mask email address for display
 * Example: john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const masked = local.charAt(0) + '***';
  return `${masked}@${domain}`;
}

/**
 * Mask phone number for display
 * Example: 081234567890 -> 0812****7890
 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  
  const start = phone.substring(0, 4);
  const end = phone.substring(phone.length - 4);
  return `${start}****${end}`;
}

/**
 * Mask NIP/NIK for display
 * Example: 123456789012345678 -> 123456********5678
 */
export function maskIdentityNumber(number: string): string {
  if (number.length < 10) return number;
  
  const start = number.substring(0, 6);
  const end = number.substring(number.length - 4);
  return `${start}${'*'.repeat(number.length - 10)}${end}`;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Sanitize data for logging (remove sensitive fields)
 */
export function sanitizeForLogging(data: any): any {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'api_key',
    'apiKey',
    'access_token',
    'refresh_token',
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  // Supabase errors
  if (error?.code) {
    switch (error.code) {
      case '23505':
        return 'Data sudah ada. Silakan gunakan data yang berbeda.';
      case '23503':
        return 'Data terkait tidak ditemukan. Silakan periksa kembali.';
      case '23502':
        return 'Data wajib tidak boleh kosong.';
      case '42P01':
        return 'Terjadi kesalahan sistem. Silakan hubungi administrator.';
      case 'PGRST116':
        return 'Data tidak ditemukan.';
      default:
        if (error.message?.includes('JWT')) {
          return 'Sesi Anda telah berakhir. Silakan login kembali.';
        }
    }
  }

  // Network errors
  if (error?.message?.includes('fetch')) {
    return 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.';
  }

  // Default error
  return error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLogData {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Format audit log entry
 */
export function formatAuditLog(data: AuditLogData): AuditLogData {
  return {
    ...data,
    metadata: sanitizeForLogging(data.metadata),
  };
}
