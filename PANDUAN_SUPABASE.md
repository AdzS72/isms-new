# Panduan Penggunaan ISMS Unified Edition (Terintegrasi Supabase)

Aplikasi di dalam folder **`D:\SUSPA ANALIS\isms-supabase`** ini adalah versi **Unified (Satu Kesatuan Tidak Terpisah antara Frontend & Backend)** yang langsung terhubung ke database **Supabase PostgreSQL**.

Seluruh tampilan (UI/UX), fitur Dashboard, Multi-Select Filter, Multi-Keyword Search, Multi-Tokoh, Input Manual/Bulk Excel, Manajemen Pengguna (RBAC), Konfigurasi Master Data, hingga Trending News & Video OSINT dipertahankan **100% identik**. Folder lama (`frontend` dan `backend`) **tidak ditimpa** dan tetap utuh.

---

## Langkah 1: Buat Project di Supabase & Jalankan SQL Schema

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard) dan buat project baru (misalnya: `isms-amerop`).
2. Di menu sebelah kiri Dashboard Supabase, klik **SQL Editor** $\rightarrow$ klik **New Query**.
3. Buka file [`supabase/schema.sql`](file:///d:/SUSPA%20ANALIS/isms-supabase/supabase/schema.sql) yang ada di dalam folder `isms-supabase`.
4. Salin (**Copy**) seluruh isi file `supabase/schema.sql` tersebut, tempel (**Paste**) ke SQL Editor Supabase, lalu klik tombol **Run** (atau tekan `Ctrl + Enter`).
   - Script ini akan otomatis membuat 5 tabel (`users`, `intelligence_records`, `backup_snapshots`, `master_config`, `trending_cache`), mengaktifkan izin akses API (RLS Policies), serta mengisi akun bawaan (`admin`, `analis`, `pimpinan`) dan Master Data awal.

---

## Langkah 2: Masukkan URL & Key Supabase ke File `.env`

1. Di Dashboard Supabase, buka menu **Project Settings** (ikon roda gigi di kiri bawah) $\rightarrow$ pilih **API** (atau **Data API**).
2. Salin **Project URL** dan **anon `public` key**.
3. Buka file [`.env`](file:///d:/SUSPA%20ANALIS/isms-supabase/.env) di dalam folder `D:\SUSPA ANALIS\isms-supabase\.env`, lalu ganti nilainya:

```env
VITE_SUPABASE_URL=https://xxxxprojectanda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Langkah 3: Migrasi 1.735 Data Intelijen Awal ke Supabase

Aplikasi ini sudah dilengkapi **Auto-Seed Otomatis**:
- Saat pertama kali aplikasi dibuka di browser dan terhubung ke Supabase, apabila tabel `intelligence_records` di Supabase masih kosong (`0` baris), aplikasi akan **secara otomatis mengunggah 1.735 rekaman data asli** dari `public/data/initial_database.json` ke tabel Supabase Anda.
- Atau jika Anda ingin mengunggah seluruh 1.735 data melalui terminal kapan saja, cukup jalankan perintah berikut di dalam folder `isms-supabase`:

```powershell
cd "D:\SUSPA ANALIS\isms-supabase"
npm run supabase:seed
```

---

## Langkah 4: Menjalankan Aplikasi Unified

Karena sudah tidak terpisah antara frontend dan backend, Anda hanya perlu menjalankan **satu perintah** saja:

```powershell
cd "D:\SUSPA ANALIS\isms-supabase"
npm run dev
```

Buka di browser: `http://localhost:3000`

### Akun Login Bawaan:
| Role | Username | Password |
| :--- | :--- | :--- |
| **Superadmin** | `admin` | `admin123` |
| **Analis** | `analis` | `analis123` |
| **Pimpinan** | `pimpinan` | `pimpinan123` |

---

## Langkah 5: Upload ke GitHub / Deploy (Vercel / Netlify)

Karena aplikasi ini sudah berbentuk **Unified Single Repository**, Anda dapat langsung mengunggah satu folder `isms-supabase` ini ke satu repositori GitHub dan men-deploy ke layanan seperti Vercel atau Netlify hanya dengan menambahkan Environment Variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
