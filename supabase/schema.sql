-- =================================================================================
-- INTELLIGENCE STRATEGIC MONITORING SYSTEM (ISMS) - SUPABASE UNIFIED EDITION
-- Subdirektorat Pemantauan Strategis Kawasan Amerika dan Eropa
--
-- CARA PENGGUNAAN:
-- 1. Buka Dashboard Supabase Anda (https://supabase.com/dashboard)
-- 2. Masuk ke menu "SQL Editor" -> klik "New Query"
-- 3. Salin (Copy) seluruh isi file ini dan tempel (Paste) ke SQL Editor
-- 4. Klik tombol "Run" (atau Ctrl + Enter)
-- =================================================================================

-- 1. TABEL PENGGUNA & OTENTIKASI RBAC (admin, analis, pimpinan)
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analis', 'pimpinan')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL UTAMA DATA INTELIJEN STRATEGIS (intelligence_records)
CREATE TABLE IF NOT EXISTS public.intelligence_records (
    id VARCHAR(100) PRIMARY KEY,
    tanggal DATE NOT NULL,
    benua VARCHAR(50) NOT NULL,
    negara VARCHAR(100) NOT NULL,
    negara_code VARCHAR(10) DEFAULT '',
    bidang VARCHAR(100) NOT NULL,
    kegiatan VARCHAR(255) NOT NULL,
    bentuk_kegiatan VARCHAR(255) NOT NULL,
    isu_utama TEXT NOT NULL,
    tokoh TEXT DEFAULT '',
    sumber_url TEXT DEFAULT '',
    attachments JSONB DEFAULT '[]'::jsonb,
    status_sumber VARCHAR(50) DEFAULT 'lengkap',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Pencarian & Filter Cepat untuk Dashboard Analitik
CREATE INDEX IF NOT EXISTS idx_isms_records_tanggal ON public.intelligence_records(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_isms_records_benua ON public.intelligence_records(benua);
CREATE INDEX IF NOT EXISTS idx_isms_records_negara ON public.intelligence_records(negara);
CREATE INDEX IF NOT EXISTS idx_isms_records_bidang ON public.intelligence_records(bidang);
CREATE INDEX IF NOT EXISTS idx_isms_records_kegiatan ON public.intelligence_records(kegiatan);
CREATE INDEX IF NOT EXISTS idx_isms_records_bentuk ON public.intelligence_records(bentuk_kegiatan);

-- 3. TABEL CADANGAN DATA / SNAPSHOT PEMULIHAN (backup_snapshots)
CREATE TABLE IF NOT EXISTS public.backup_snapshots (
    id VARCHAR(100) PRIMARY KEY,
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    record_count INT NOT NULL DEFAULT 0,
    snapshot_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_isms_backup_saved_at ON public.backup_snapshots(saved_at DESC);

-- 4. TABEL KONFIGURASI MASTER DATA DINAMIS (master_config)
CREATE TABLE IF NOT EXISTS public.master_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL CACHE TRENDING NEWS & VIDEO OSINT (trending_cache)
CREATE TABLE IF NOT EXISTS public.trending_cache (
    id VARCHAR(50) PRIMARY KEY,
    payload JSONB NOT NULL,
    last_synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================================
-- ROW LEVEL SECURITY (RLS) & HAK AKSES API SUPABASE (PostgREST)
-- =================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_cache ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika dijalankan ulang (Idempotent)
DROP POLICY IF EXISTS "Allow full access to users for ISMS app" ON public.users;
DROP POLICY IF EXISTS "Allow full access to intelligence_records for ISMS app" ON public.intelligence_records;
DROP POLICY IF EXISTS "Allow full access to backup_snapshots for ISMS app" ON public.backup_snapshots;
DROP POLICY IF EXISTS "Allow full access to master_config for ISMS app" ON public.master_config;
DROP POLICY IF EXISTS "Allow full access to trending_cache for ISMS app" ON public.trending_cache;

-- Buat policy akses untuk aplikasi Unified (anon & authenticated)
CREATE POLICY "Allow full access to users for ISMS app"
    ON public.users FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to intelligence_records for ISMS app"
    ON public.intelligence_records FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to backup_snapshots for ISMS app"
    ON public.backup_snapshots FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to master_config for ISMS app"
    ON public.master_config FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to trending_cache for ISMS app"
    ON public.trending_cache FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.intelligence_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.backup_snapshots TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.master_config TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.trending_cache TO anon, authenticated, service_role;

-- =================================================================================
-- SEED DATA AWAL: AKUN PENGGUNA DEFAULT & KONFIGURASI MASTER
-- =================================================================================
INSERT INTO public.users (id, username, name, email, password, role, is_active)
VALUES 
    ('usr-admin-01', 'admin', 'Superadmin Pengendali Sistem', 'admin@kemhan.mil.id', 'admin123', 'admin', true),
    ('usr-analis-01', 'analis', 'Letda Lek Gutri Rahmad Zuwa', 'gutri.analis@kemhan.mil.id', 'analis123', 'analis', true),
    ('usr-pimpinan-01', 'pimpinan', 'Direktur Pemantauan Strategis', 'pimpinan@kemhan.mil.id', 'pimpinan123', 'pimpinan', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.master_config (key, value)
VALUES
    ('continents', '["Amerika", "Eropa", "Asia", "Afrika", "Australia & Pasifik", "Timur Tengah", "Global / Multilateral"]'::jsonb),
    ('components', '["Ekonomi", "Angkatan Bersenjata", "Ilmu Pengetahuan dan Teknologi", "Sosial", "Politik", "Geografi", "Demografi", "Transportasi dan Telekomunikasi", "Pertahanan & Keamanan", "Hukum & HAM"]'::jsonb),
    ('kegiatanTemplates', '["Kunjungan Kenegaraan", "Pertemuan Bilateral", "Latihan Militer Bersama", "Perjanjian Pertahanan & Keamanan", "Krisis Diplomatik & Pengusiran Staf", "Penjatuhan Sanksi Ekonomi & Dagang", "Konflik Bersenjata & Manuver Pasukan", "Uji Coba Senjata Strategis & Rudal", "KTT Internasional & Pakta Multilateral", "Kerja Sama Riset Teknologi & Kedirgantaraan", "Spionase & Operasi Siber Antarnegara"]'::jsonb),
    ('bentukKegiatanTemplates', '["Pertemuan Bilateral", "Penandatanganan MoU / Traktat", "KTT / Konferensi Tingkat Tinggi", "Latihan Manuver Gabungan", "Deklarasi Pernyataan Resmi Bersama", "Pemberian Paket Bantuan Militer", "Operasi Khusus / Intelijen", "Uji Coba Rudal Balistik Antarbenua", "Sidang Dewan Keamanan PBB", "Pembekuan Aset & Embargo Perdagangan"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
