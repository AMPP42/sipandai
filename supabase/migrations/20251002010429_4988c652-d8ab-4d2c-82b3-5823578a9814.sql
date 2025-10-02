-- Delete existing kenaikan pangkat document types
DELETE FROM public.document_types WHERE category LIKE 'kenaikan_pangkat_%';

-- Insert document requirements for Kenaikan Pangkat Reguler (Jabatan Pelaksana)
INSERT INTO public.document_types (code, name, description, category, is_required, is_active) VALUES
('KP_REG_01', 'SKP 2 tahun terakhir', 'Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai"', 'kenaikan_pangkat_reguler', true, true),
('KP_REG_02', 'SK Jabatan terakhir', '', 'kenaikan_pangkat_reguler', true, true),
('KP_REG_03', 'SK Pangkat terakhir', '', 'kenaikan_pangkat_reguler', true, true),
('KP_REG_04', 'Kartu Pegawai', '', 'kenaikan_pangkat_reguler', true, true),
('KP_REG_05', 'Ijazah + Transkrip nilai terakhir', '', 'kenaikan_pangkat_reguler', true, true),
('KP_REG_06', 'Nota dinas', '', 'kenaikan_pangkat_reguler', true, true);

-- Insert document requirements for Kenaikan Pangkat Jabatan Fungsional
INSERT INTO public.document_types (code, name, description, category, is_required, is_active) VALUES
('KP_FUNG_01', 'PAK tahun 2022 hingga saat ini', 'Catatan: Wajib 3 lembar di setiap tahun', 'kenaikan_pangkat_fungsional', true, true),
('KP_FUNG_02', 'SKP 2 tahun terakhir', 'Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai"', 'kenaikan_pangkat_fungsional', true, true),
('KP_FUNG_03', 'SK Jabatan terakhir', 'Catatan: Wajib disertai sertifikat uji kompetensi bagi pegawai yang naik jenjang', 'kenaikan_pangkat_fungsional', true, true),
('KP_FUNG_04', 'SK Pangkat terakhir', '', 'kenaikan_pangkat_fungsional', true, true),
('KP_FUNG_05', 'Kartu Pegawai', '', 'kenaikan_pangkat_fungsional', true, true),
('KP_FUNG_06', 'Ijazah + transkrip nilai terakhir', '', 'kenaikan_pangkat_fungsional', true, true),
('KP_FUNG_07', 'Nota dinas', '', 'kenaikan_pangkat_fungsional', true, true);

-- Insert document requirements for Kenaikan Pangkat Jabatan Struktural
INSERT INTO public.document_types (code, name, description, category, is_required, is_active) VALUES
('KP_STRUK_01', 'SKP 2 tahun terakhir', 'Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai"', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_02', 'SK Jabatan terakhir', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_03', 'SK Pangkat terakhir', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_04', 'Kartu Pegawai', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_05', 'Ijazah + Transkrip Nilai terakhir', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_06', 'Surat Pernyataan Pelantikan', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_07', 'Surat Pernyataan Melaksanakan Tugas', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_08', 'Surat Pernyataan Menduduki Jabatan', '', 'kenaikan_pangkat_struktural', true, true),
('KP_STRUK_09', 'Diklat PIM III', 'Khusus untuk Pejabat Struktural Eselon III yang pendidikan terakhirnya S1 dan pangkat terakhirnya III/d, wajib lulus diklat PIM III', 'kenaikan_pangkat_struktural', false, true),
('KP_STRUK_10', 'Nota dinas', '', 'kenaikan_pangkat_struktural', true, true);

-- Insert document requirements for Kenaikan Pangkat Pertama Kali
INSERT INTO public.document_types (code, name, description, category, is_required, is_active) VALUES
('KP_PERTAMA_01', 'SK CPNS', '', 'kenaikan_pangkat_pertama_kali', true, true),
('KP_PERTAMA_02', 'SK PNS', '', 'kenaikan_pangkat_pertama_kali', true, true),
('KP_PERTAMA_03', 'SKP 2 tahun terakhir', 'Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai"', 'kenaikan_pangkat_pertama_kali', true, true),
('KP_PERTAMA_04', 'PAK tahun 2022 hingga saat ini', 'Catatan: Khusus untuk jabatan fungsional; Wajib 3 lembar di setiap tahun', 'kenaikan_pangkat_pertama_kali', false, true),
('KP_PERTAMA_05', 'SK Jabatan', 'Catatan: Khusus untuk jabatan fungsional', 'kenaikan_pangkat_pertama_kali', false, true),
('KP_PERTAMA_06', 'Berita Acara Pengambilan Sumpah Jabatan PNS', 'Catatan: Khusus untuk jabatan fungsional', 'kenaikan_pangkat_pertama_kali', false, true),
('KP_PERTAMA_07', 'SK Pangkat terakhir', '', 'kenaikan_pangkat_pertama_kali', true, true),
('KP_PERTAMA_08', 'Kartu Pegawai', '', 'kenaikan_pangkat_pertama_kali', true, true),
('KP_PERTAMA_09', 'Ijazah + Transkrip Nilai terakhir', '', 'kenaikan_pangkat_pertama_kali', true, true),
('KP_PERTAMA_10', 'Nota Dinas', '', 'kenaikan_pangkat_pertama_kali', true, true);

-- Insert document requirements for Kenaikan Pangkat Penyesuaian Ijazah
INSERT INTO public.document_types (code, name, description, category, is_required, is_active) VALUES
('KP_IJAZAH_01', 'Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_02', 'Ijazah + Transkrip Nilai terakhir yang telah dilegalisir', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_03', 'Uraian Tugas', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_04', 'SKP 2 tahun terakhir', 'Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai"', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_05', 'SK Jabatan terakhir', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_06', 'SK Pangkat terakhir', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_07', 'Kartu Pegawai', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true),
('KP_IJAZAH_08', 'Nota dinas', '', 'kenaikan_pangkat_penyesuaian_ijazah', true, true);

-- Insert document requirements for Kenaikan Pangkat Golongan II/d ke III/a
INSERT INTO public.document_types (code, name, description, category, is_required, is_active) VALUES
('KP_IID_IIIA_01', 'Surat Tanda Lulus Ujian Dinas', '', 'kenaikan_pangkat_iid_ke_iiia', true, true),
('KP_IID_IIIA_02', 'SKP 2 tahun terakhir', 'Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai"', 'kenaikan_pangkat_iid_ke_iiia', true, true),
('KP_IID_IIIA_03', 'SK Jabatan terakhir', '', 'kenaikan_pangkat_iid_ke_iiia', true, true),
('KP_IID_IIIA_04', 'SK Pangkat terakhir', '', 'kenaikan_pangkat_iid_ke_iiia', true, true),
('KP_IID_IIIA_05', 'Ijazah + Transkrip nilai terakhir', '', 'kenaikan_pangkat_iid_ke_iiia', true, true),
('KP_IID_IIIA_06', 'Kartu Pegawai', '', 'kenaikan_pangkat_iid_ke_iiia', true, true),
('KP_IID_IIIA_07', 'Nota Dinas', '', 'kenaikan_pangkat_iid_ke_iiia', true, true);