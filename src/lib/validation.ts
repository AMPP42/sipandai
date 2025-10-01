import { z } from 'zod';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// Indonesian phone number validation
export const phoneSchema = z.string()
  .trim()
  .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Nomor telepon tidak valid. Format: 08xx atau +628xx')
  .max(15, 'Nomor telepon maksimal 15 karakter');

// Indonesian NIP validation (18 digits)
export const nipSchema = z.string()
  .trim()
  .regex(/^[0-9]{18}$/, 'NIP harus 18 digit angka')
  .length(18, 'NIP harus 18 digit');

// Indonesian NIK validation (16 digits)
export const nikSchema = z.string()
  .trim()
  .regex(/^[0-9]{16}$/, 'NIK harus 16 digit angka')
  .length(16, 'NIK harus 16 digit');

// Email validation
export const emailSchema = z.string()
  .trim()
  .email('Format email tidak valid')
  .max(255, 'Email maksimal 255 karakter')
  .toLowerCase();

// Name validation (no special characters except spaces, dots, and apostrophes)
export const nameSchema = z.string()
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter')
  .regex(/^[a-zA-Z\s.']+$/, 'Nama hanya boleh berisi huruf, spasi, titik, dan apostrof');

// Text validation (prevent XSS)
export const safeTextSchema = z.string()
  .trim()
  .max(1000, 'Teks maksimal 1000 karakter')
  .refine((val) => !/<script|javascript:|onerror=/i.test(val), {
    message: 'Teks mengandung karakter tidak aman'
  });

// Long text validation
export const longTextSchema = z.string()
  .trim()
  .min(1, 'Teks tidak boleh kosong')
  .max(5000, 'Teks maksimal 5000 karakter')
  .refine((val) => !/<script|javascript:|onerror=/i.test(val), {
    message: 'Teks mengandung karakter tidak aman'
  });

// URL validation
export const urlSchema = z.string()
  .trim()
  .url('Format URL tidak valid')
  .max(2048, 'URL maksimal 2048 karakter')
  .refine((val) => val.startsWith('https://'), {
    message: 'URL harus menggunakan HTTPS'
  });

// Date validation (not in future)
export const pastDateSchema = z.date()
  .max(new Date(), 'Tanggal tidak boleh di masa depan');

// Future date validation
export const futureDateSchema = z.date()
  .min(new Date(), 'Tanggal harus di masa depan');

// ============================================================================
// EMPLOYEE VALIDATION SCHEMAS
// ============================================================================

export const employeeFormSchema = z.object({
  nama: nameSchema,
  nip: nipSchema.optional(),
  nik: nikSchema.optional(),
  email: emailSchema.optional(),
  handphone: phoneSchema.optional(),
  tempat_lahir: z.string().trim().max(100).optional(),
  tanggal_lahir: z.date().optional(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
  agama: z.string().trim().max(50).optional(),
  status_pernikahan: z.enum(['Belum Menikah', 'Menikah', 'Cerai']).optional(),
  alamat: safeTextSchema.optional(),
  unit: z.string().trim().max(200).optional(),
  jabatan: z.string().trim().max(200).optional(),
  pangkat: z.string().trim().max(100).optional(),
  pendidikan_terakhir: z.string().trim().max(100).optional(),
  tmt_cpns: z.date().optional(),
  tmt_pns: z.date().optional(),
  tmt_jabatan_terakhir: z.date().optional(),
  tmt_pangkat_terakhir: z.date().optional(),
});

// ============================================================================
// USULAN MUTASI VALIDATION SCHEMAS
// ============================================================================

export const usulanMutasiFormSchema = z.object({
  nama_pegawai: nameSchema,
  nip: nipSchema,
  unit_asal: z.string().trim().min(3, 'Unit asal minimal 3 karakter').max(200),
  unit_tujuan: z.string().trim().min(3, 'Unit tujuan minimal 3 karakter').max(200),
  jenis_mutasi: z.string().trim().min(1, 'Jenis mutasi wajib dipilih'),
  alasan_mutasi: z.string()
    .trim()
    .min(10, 'Alasan mutasi minimal 10 karakter')
    .max(5000, 'Alasan mutasi maksimal 5000 karakter')
    .refine((val) => !/<script|javascript:|onerror=/i.test(val), {
      message: 'Alasan mutasi mengandung karakter tidak aman'
    }),
  tanggal_usulan: z.date(),
});

// ============================================================================
// APPOINTMENT VALIDATION SCHEMAS
// ============================================================================

export const appointmentFormSchema = z.object({
  nama_lengkap: nameSchema,
  nip: nipSchema,
  unit_kerja: z.string().trim().min(3, 'Unit kerja minimal 3 karakter').max(200),
  email: emailSchema,
  nomor_hp: phoneSchema,
  jenis_konsultasi: z.string().trim().min(1, 'Jenis konsultasi wajib dipilih'),
  tanggal_konsultasi: futureDateSchema,
  jam_konsultasi: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam tidak valid (HH:MM)'),
  keterangan: safeTextSchema.optional(),
});

// ============================================================================
// CONSULTATION TICKET VALIDATION SCHEMAS
// ============================================================================

export const consultationTicketSchema = z.object({
  judul: z.string().trim().min(5, 'Judul minimal 5 karakter').max(200),
  deskripsi: z.string()
    .trim()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(5000, 'Deskripsi maksimal 5000 karakter')
    .refine((val) => !/<script|javascript:|onerror=/i.test(val), {
      message: 'Deskripsi mengandung karakter tidak aman'
    }),
  kategori: z.string().trim().min(1, 'Kategori wajib dipilih'),
  prioritas: z.enum(['low', 'medium', 'high']),
  user_name: nameSchema,
  user_unit: z.string().trim().min(3, 'Unit kerja minimal 3 karakter').max(200),
});

// ============================================================================
// APPLICATION VALIDATION SCHEMAS
// ============================================================================

export const applicationFormSchema = z.object({
  judul: z.string().trim().min(5, 'Judul minimal 5 karakter').max(200),
  keterangan: longTextSchema.optional(),
  jenis: z.string().trim().min(1, 'Jenis aplikasi wajib dipilih'),
  submitter_name: nameSchema,
  submitter_unit: z.string().trim().min(3, 'Unit minimal 3 karakter').max(200),
  tanggal_pengajuan: z.date(),
});

// ============================================================================
// CHAT MESSAGE VALIDATION SCHEMAS
// ============================================================================

export const chatMessageSchema = z.object({
  message_text: z.string()
    .trim()
    .min(1, 'Pesan tidak boleh kosong')
    .max(1000, 'Pesan maksimal 1000 karakter')
    .refine((val) => !/<script|javascript:|onerror=/i.test(val), {
      message: 'Pesan mengandung karakter tidak aman'
    })
    .optional(),
  file_name: z.string().max(255).optional(),
  file_type: z.string().max(100).optional(),
}).refine((data) => data.message_text || data.file_name, {
  message: 'Pesan teks atau file wajib diisi',
});

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize HTML string to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onclick=/gi, '')
    .replace(/onload=/gi, '');
}

/**
 * Sanitize text input for database
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\0/g, ''); // Remove null bytes
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.href;
  } catch {
    return '';
  }
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple client-side rate limiting
 * Returns true if action is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
