# Instruksi Admin - Pengajuan Mutasi Terpadu

## Masalah yang Ditemukan
Aplikasi Pengajuan Mutasi Terpadu tidak dapat digunakan karena tabel `positions` (formasi jabatan) kosong. Tabel ini diperlukan untuk menampilkan pilihan jabatan yang tersedia untuk mutasi.

## Solusi

### 1. Mengisi Data Formasi Jabatan

#### Opsi A: Menggunakan Admin Panel (Recommended)
1. Buka aplikasi di browser
2. Login sebagai admin
3. Pergi ke halaman "Admin Formasi" 
4. Klik "Tambah Formasi"
5. Isi data formasi jabatan untuk setiap unit kerja

#### Opsi B: Menggunakan Script (Advanced)
1. Pastikan Anda memiliki akses admin atau service role key
2. Jalankan script: `node admin-seed-positions.js`
3. Script akan mengisi data sample formasi jabatan

### 2. Struktur Data Formasi Jabatan

Setiap formasi jabatan memerlukan:
- **Unit**: Nama unit kerja (harus sesuai dengan data di tabel `work_units`)
- **Jabatan**: Nama jabatan/posisi
- **Existing**: Jumlah pegawai yang sudah ada di posisi tersebut
- **Kebutuhan**: Jumlah pegawai yang dibutuhkan
- **Gap**: Akan dihitung otomatis (Kebutuhan - Existing)

### 3. Data Sample yang Diperlukan

Minimal data yang perlu diisi untuk setiap unit kerja:
- Kepala Unit (Direktur/Kepala Balai Besar)
- Sekretaris Unit
- Kepala Bagian/Bidang
- Staff/Instruktur

### 4. Verifikasi

Setelah mengisi data:
1. Buka halaman "Pengajuan Mutasi Terpadu"
2. Pilih unit kerja tujuan
3. Pastikan ada pilihan formasi jabatan yang tersedia
4. Coba buat pengajuan mutasi

## Troubleshooting

### Jika masih tidak bisa mengisi data:
1. Pastikan user memiliki role `admin_pusat`
2. Cek RLS policies di tabel `positions`
3. Hubungi developer untuk bantuan lebih lanjut

### Jika data tidak muncul:
1. Refresh halaman
2. Cek console browser untuk error
3. Pastikan data sudah tersimpan di database

## Catatan
- Data formasi jabatan adalah data master yang perlu dikelola secara berkala
- Update data existing ketika ada mutasi atau promosi
- Review kebutuhan pegawai secara berkala
