import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca konfigurasi dari file .env di root proyek isms-supabase
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const vars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        vars[key] = val;
      }
    }
  }
  return vars;
}

function mapRecordToRow(record) {
  const now = new Date().toISOString();
  return {
    id: String(record.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    tanggal: record.tanggal ? String(record.tanggal).split('T')[0] : now.split('T')[0],
    benua: record.benua || 'Lainnya',
    negara: record.negara || 'Tidak Diketahui',
    negara_code: record.negaraCode || record.negara_code || '',
    bidang: record.bidang || 'Politik',
    kegiatan: record.kegiatan || '-',
    bentuk_kegiatan: record.bentukKegiatan || record.bentuk_kegiatan || '-',
    isu_utama: record.isuUtama || record.isu_utama || '-',
    tokoh: record.tokoh || '',
    sumber_url: record.sumberUrl || record.sumber_url || '',
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    status_sumber: record.statusSumber || record.status_sumber || 'lengkap',
    is_demo: Boolean(record.isDemo ?? record.is_demo ?? false),
    created_at: record.createdAt || record.created_at || now,
    updated_at: record.updatedAt || record.updated_at || now,
  };
}

async function seedDatabaseToSupabase() {
  const env = loadEnv();
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('your-project-id.supabase.co') ||
    supabaseKey.includes('your-supabase-anon-key')
  ) {
    console.error('❌ ERROR: Harap isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di dalam file .env terlebih dahulu!');
    process.exit(1);
  }

  const dbPath = path.resolve(__dirname, '../public/data/initial_database.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ ERROR: File data awal tidak ditemukan di ${dbPath}`);
    process.exit(1);
  }

  const rawRecords = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`📦 Memulai proses migrasi ${rawRecords.length} data intelijen ke Supabase (${supabaseUrl})...`);

  const batchSize = 250;
  let totalInserted = 0;

  for (let i = 0; i < rawRecords.length; i += batchSize) {
    const batch = rawRecords.slice(i, i + batchSize).map(mapRecordToRow);
    const res = await fetch(`${supabaseUrl}/rest/v1/intelligence_records`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Gagal pada batch ${i} - ${i + batch.length}: Status ${res.status}`, errText);
      process.exit(1);
    }

    totalInserted += batch.length;
    console.log(`✅ Berhasil mengunggah ${totalInserted} / ${rawRecords.length} rekaman...`);
  }

  console.log(`\n🎉 SELESAI! Seluruh ${totalInserted} rekaman data intelijen telah tersimpan di Supabase.`);
}

seedDatabaseToSupabase().catch((err) => {
  console.error('❌ Terjadi kesalahan saat migrasi ke Supabase:', err);
  process.exit(1);
});
