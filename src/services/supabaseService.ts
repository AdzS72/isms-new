import {
  IntelligenceRecord,
  UserAccount,
  UserRole,
  MasterConfig,
  BackupInfo,
} from '../types';

// ============================================================================
// KONFIGURASI KONEKSI SUPABASE (UNIFIED FRONTEND + SUPABASE BACKEND)
// ============================================================================

const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = ENV_SUPABASE_URL;
  let anonKey = ENV_SUPABASE_ANON_KEY;

  // Support dynamic runtime override via localStorage if set
  try {
    const savedConfig = localStorage.getItem('isms_supabase_runtime_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.url && parsed.anonKey) {
        url = String(parsed.url).trim().replace(/\/+$/, '');
        anonKey = String(parsed.anonKey).trim();
      }
    }
  } catch {}

  const isConfigured =
    Boolean(url && anonKey) &&
    !url.includes('your-project-id.supabase.co') &&
    !anonKey.includes('your-supabase-anon-key');

  return { url, anonKey, isConfigured };
}

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const { anonKey } = getSupabaseCredentials();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

// ============================================================================
// MAPPER DATA: POSTGRESQL (snake_case) <-> APLIKASI ISMS (camelCase)
// ============================================================================

export function mapRowToRecord(row: any): IntelligenceRecord {
  return {
    id: String(row.id),
    tanggal:
      row.tanggal instanceof Date
        ? row.tanggal.toISOString().split('T')[0]
        : String(row.tanggal || '').split('T')[0],
    benua: row.benua || '',
    negara: row.negara || '',
    negaraCode: row.negara_code || row.negaraCode || '',
    bidang: row.bidang || '',
    kegiatan: row.kegiatan || '',
    bentukKegiatan: row.bentuk_kegiatan || row.bentukKegiatan || '',
    isuUtama: row.isu_utama || row.isuUtama || '',
    tokoh: row.tokoh || '',
    sumberUrl: row.sumber_url || row.sumberUrl || '',
    attachments:
      typeof row.attachments === 'string'
        ? (() => {
            try {
              return JSON.parse(row.attachments);
            } catch {
              return [];
            }
          })()
        : Array.isArray(row.attachments)
        ? row.attachments
        : [],
    statusSumber: row.status_sumber || row.statusSumber || 'lengkap',
    isDemo: Boolean(row.is_demo ?? row.isDemo ?? false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export function mapRecordToRow(record: Partial<IntelligenceRecord> & { id: string }) {
  const now = new Date().toISOString();
  return {
    id: record.id,
    tanggal: record.tanggal ? String(record.tanggal).split('T')[0] : now.split('T')[0],
    benua: record.benua || 'Lainnya',
    negara: record.negara || 'Tidak Diketahui',
    negara_code: record.negaraCode || '',
    bidang: record.bidang || 'Politik',
    kegiatan: record.kegiatan || '-',
    bentuk_kegiatan: record.bentukKegiatan || '-',
    isu_utama: record.isuUtama || '-',
    tokoh: record.tokoh || '',
    sumber_url: record.sumberUrl || '',
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    status_sumber: record.statusSumber || 'lengkap',
    is_demo: Boolean(record.isDemo),
    created_at: record.createdAt || now,
    updated_at: record.updatedAt || now,
  };
}

export function mapRowToUser(row: any): UserAccount {
  return {
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    email: row.email || '',
    role: (['admin', 'analis', 'pimpinan'].includes(row.role) ? row.role : 'analis') as UserRole,
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

// ============================================================================
// 1. HEALTH CHECK & INITIAL DATASET FALLBACK LOADER
// ============================================================================

export async function checkSupabaseHealth(): Promise<boolean> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return false;

  try {
    const res = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
      method: 'GET',
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Supabase] Health check failed:', err);
    return false;
  }
}

/**
 * Loads the bundled 1,735 real records from /data/initial_database.json
 * Used to seed Supabase automatically if the Supabase table is initially empty,
 * or to populate local storage on first run before Supabase credentials are set.
 */
export async function loadInitialBundledRecords(): Promise<IntelligenceRecord[]> {
  try {
    const res = await fetch('/data/initial_database.json', {
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return json.map(mapRowToRecord);
      }
    }
  } catch (err) {
    console.warn('[Supabase] Could not load bundled initial_database.json:', err);
  }
  return [];
}

// ============================================================================
// 2. OPERASI DATA INTELIJEN (intelligence_records)
// ============================================================================

/**
 * Fetches ALL records from Supabase using automatic range pagination (1,000 rows per page)
 * so datasets > 1,000 records (e.g. 1,735+ records) are retrieved completely.
 */
export async function fetchAllRecordsFromSupabase(): Promise<IntelligenceRecord[]> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    return await loadInitialBundledRecords();
  }

  const pageSize = 1000;
  let offset = 0;
  const allRows: any[] = [];

  while (true) {
    const rangeStart = offset;
    const rangeEnd = offset + pageSize - 1;

    const res = await fetch(
      `${url}/rest/v1/intelligence_records?select=*&order=tanggal.desc,created_at.desc`,
      {
        method: 'GET',
        headers: getHeaders({
          Range: `${rangeStart}-${rangeEnd}`,
          Prefer: 'count=exact',
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase fetch records failed with status ${res.status}`);
    }

    const pageData = await res.json();
    if (!Array.isArray(pageData) || pageData.length === 0) {
      break;
    }

    allRows.push(...pageData);

    if (pageData.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  // If Supabase table is completely empty on first connection, auto-seed from bundled database!
  if (allRows.length === 0) {
    const bundled = await loadInitialBundledRecords();
    if (bundled.length > 0) {
      console.info(`[Supabase] Tabel intelligence_records kosong. Melakukan auto-seed ${bundled.length} data awal ke Supabase...`);
      try {
        await bulkUpsertRecordsInSupabase(bundled);
      } catch (seedErr) {
        console.warn('[Supabase] Auto-seed warning:', seedErr);
      }
      return bundled;
    }
  }

  return allRows.map(mapRowToRecord);
}

export async function createRecordInSupabase(
  recordData: Omit<IntelligenceRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<IntelligenceRecord> {
  const { url, isConfigured } = getSupabaseCredentials();
  const now = new Date().toISOString();
  const id = recordData.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const fullRecord: IntelligenceRecord = {
    ...recordData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  if (!isConfigured) return fullRecord;

  const rowPayload = mapRecordToRow(fullRecord);
  const res = await fetch(`${url}/rest/v1/intelligence_records`, {
    method: 'POST',
    headers: getHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(rowPayload),
  });

  if (!res.ok) {
    throw new Error(`Gagal menyimpan data ke Supabase (${res.status})`);
  }

  const inserted = await res.json();
  if (Array.isArray(inserted) && inserted[0]) {
    return mapRowToRecord(inserted[0]);
  }
  return fullRecord;
}

export async function updateRecordInSupabase(
  id: string,
  updates: Partial<IntelligenceRecord>
): Promise<IntelligenceRecord | null> {
  const { url, isConfigured } = getSupabaseCredentials();
  const now = new Date().toISOString();

  if (!isConfigured) return null;

  const patchPayload: Record<string, any> = { updated_at: now };
  if (updates.tanggal !== undefined) patchPayload.tanggal = String(updates.tanggal).split('T')[0];
  if (updates.benua !== undefined) patchPayload.benua = updates.benua;
  if (updates.negara !== undefined) patchPayload.negara = updates.negara;
  if (updates.negaraCode !== undefined) patchPayload.negara_code = updates.negaraCode;
  if (updates.bidang !== undefined) patchPayload.bidang = updates.bidang;
  if (updates.kegiatan !== undefined) patchPayload.kegiatan = updates.kegiatan;
  if (updates.bentukKegiatan !== undefined) patchPayload.bentuk_kegiatan = updates.bentukKegiatan;
  if (updates.isuUtama !== undefined) patchPayload.isu_utama = updates.isuUtama;
  if (updates.tokoh !== undefined) patchPayload.tokoh = updates.tokoh;
  if (updates.sumberUrl !== undefined) patchPayload.sumber_url = updates.sumberUrl;
  if (updates.attachments !== undefined) patchPayload.attachments = updates.attachments;
  if (updates.statusSumber !== undefined) patchPayload.status_sumber = updates.statusSumber;
  if (updates.isDemo !== undefined) patchPayload.is_demo = Boolean(updates.isDemo);

  const res = await fetch(
    `${url}/rest/v1/intelligence_records?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: getHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(patchPayload),
    }
  );

  if (!res.ok) {
    throw new Error(`Gagal memperbarui data di Supabase (${res.status})`);
  }

  const updated = await res.json();
  if (Array.isArray(updated) && updated[0]) {
    return mapRowToRecord(updated[0]);
  }
  return null;
}

export async function deleteRecordInSupabase(id: string): Promise<boolean> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return true;

  const res = await fetch(
    `${url}/rest/v1/intelligence_records?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  return res.ok;
}

export async function bulkDeleteRecordsInSupabase(ids: string[]): Promise<boolean> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured || !ids.length) return true;

  // Batch in chunks of 150 IDs to avoid URL query string limits
  const chunkSize = 150;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const inList = chunk.map((id) => `"${String(id).replace(/"/g, '')}"`).join(',');
    const res = await fetch(
      `${url}/rest/v1/intelligence_records?id=in.(${encodeURIComponent(inList)})`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );
    if (!res.ok) {
      console.warn(`[Supabase] Bulk delete batch failed (${res.status})`);
    }
  }
  return true;
}

export async function bulkUpsertRecordsInSupabase(
  recordsList: IntelligenceRecord[]
): Promise<number> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured || !recordsList.length) return recordsList.length;

  const batchSize = 250;
  let insertedCount = 0;

  for (let i = 0; i < recordsList.length; i += batchSize) {
    const batch = recordsList.slice(i, i + batchSize).map(mapRecordToRow);
    const res = await fetch(`${url}/rest/v1/intelligence_records`, {
      method: 'POST',
      headers: getHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      throw new Error(`Supabase bulk upsert failed at batch ${i} (${res.status})`);
    }
    insertedCount += batch.length;
  }

  return insertedCount;
}

// ============================================================================
// 3. OTENTIKASI & MANAJEMEN PENGGUNA (users)
// ============================================================================

export async function authenticateUserInSupabase(
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string }> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  const qUsername = username.trim().toLowerCase();
  const res = await fetch(
    `${url}/rest/v1/users?username=ilike.${encodeURIComponent(qUsername)}&select=*&limit=1`,
    {
      method: 'GET',
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!res.ok) {
    throw new Error(`Supabase auth query error (${res.status})`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: 'Username tidak ditemukan dalam sistem.' };
  }

  const userRow = rows[0];
  if (userRow.password !== password) {
    return { success: false, error: 'Kata sandi yang Anda masukkan tidak sesuai.' };
  }

  if (userRow.is_active === false) {
    return { success: false, error: 'Akun Anda sedang dinonaktifkan oleh Administrator.' };
  }

  const cleanUser = mapRowToUser(userRow);
  const tokenPayload = {
    id: cleanUser.id,
    username: cleanUser.username,
    role: cleanUser.role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const token = `isms_token_${btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))))}`;

  return {
    success: true,
    user: cleanUser,
    token,
  };
}

export async function verifyUserSessionInSupabase(
  userId: string
): Promise<UserAccount | null> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured || !userId) return null;

  const res = await fetch(
    `${url}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id,username,name,email,role,is_active,created_at,updated_at&limit=1`,
    {
      method: 'GET',
      headers: getHeaders(),
      signal: AbortSignal.timeout(4000),
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  if (Array.isArray(rows) && rows[0]) {
    if (rows[0].is_active === false) return null;
    return mapRowToUser(rows[0]);
  }
  return null;
}

export async function fetchUsersFromSupabase(): Promise<UserAccount[]> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return [];

  const res = await fetch(
    `${url}/rest/v1/users?select=id,username,name,email,role,is_active,created_at,updated_at&order=created_at.asc`,
    {
      method: 'GET',
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows.map(mapRowToUser) : [];
}

export async function createUserInSupabase(userData: {
  id: string;
  username: string;
  name: string;
  email?: string;
  password?: string;
  role: UserRole;
}): Promise<UserAccount> {
  const { url, isConfigured } = getSupabaseCredentials();
  const now = new Date().toISOString();
  const payload = {
    id: userData.id,
    username: userData.username.trim().toLowerCase(),
    name: userData.name.trim(),
    email: (userData.email || '').trim(),
    password: userData.password || '123456',
    role: userData.role,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  if (isConfigured) {
    const res = await fetch(`${url}/rest/v1/users`, {
      method: 'POST',
      headers: getHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) {
        return mapRowToUser(rows[0]);
      }
    }
  }

  return mapRowToUser(payload);
}

export async function updateUserInSupabase(
  id: string,
  updates: Partial<UserAccount & { password?: string }>
): Promise<void> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return;

  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.role !== undefined) patch.role = updates.role;
  if (updates.password) patch.password = updates.password;
  if (updates.isActive !== undefined) patch.is_active = Boolean(updates.isActive);

  await fetch(`${url}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(patch),
  });
}

export async function deleteUserInSupabase(id: string): Promise<void> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return;

  await fetch(`${url}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
}

// ============================================================================
// 4. KONFIGURASI MASTER DATA (master_config)
// ============================================================================

export async function fetchMasterConfigFromSupabase(): Promise<Partial<MasterConfig> | null> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  const res = await fetch(`${url}/rest/v1/master_config?select=key,value`, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const configMap: Record<string, any> = {};
  for (const row of rows) {
    if (row && row.key) {
      configMap[row.key] =
        typeof row.value === 'string'
          ? (() => {
              try {
                return JSON.parse(row.value);
              } catch {
                return row.value;
              }
            })()
          : row.value;
    }
  }
  return configMap as Partial<MasterConfig>;
}

export async function saveMasterConfigKeyInSupabase(
  key: keyof MasterConfig,
  value: any
): Promise<void> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return;

  await fetch(`${url}/rest/v1/master_config`, {
    method: 'POST',
    headers: getHeaders({
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify({
      key,
      value,
      updated_at: new Date().toISOString(),
    }),
  });
}

// ============================================================================
// 5. PENCADANGAN & PEMULIHAN SNAPSHOT (backup_snapshots)
// ============================================================================

export async function fetchBackupStatusFromSupabase(): Promise<BackupInfo | null> {
  const { url, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  const res = await fetch(
    `${url}/rest/v1/backup_snapshots?select=id,saved_at,record_count,note&order=saved_at.desc&limit=1`,
    {
      method: 'GET',
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  if (Array.isArray(rows) && rows[0]) {
    return {
      exists: true,
      count: Number(rows[0].record_count) || 0,
      savedAt: rows[0].saved_at || new Date().toISOString(),
    };
  }
  return null;
}

export async function saveBackupSnapshotToSupabase(
  records: IntelligenceRecord[],
  note: string
): Promise<{ success: boolean; count: number; savedAt: string }> {
  const { url, isConfigured } = getSupabaseCredentials();
  const now = new Date().toISOString();
  const backupId = `backup-${Date.now()}`;

  if (isConfigured) {
    const res = await fetch(`${url}/rest/v1/backup_snapshots`, {
      method: 'POST',
      headers: getHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({
        id: backupId,
        saved_at: now,
        record_count: records.length,
        snapshot_data: records,
        note,
        created_at: now,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gagal menyimpan cadangan ke Supabase (${res.status})`);
    }
  }

  return {
    success: true,
    count: records.length,
    savedAt: now,
  };
}

export async function restoreLatestBackupFromSupabase(): Promise<IntelligenceRecord[]> {
  const { url, isConfigured } = getSupabaseCredentials();

  if (isConfigured) {
    const res = await fetch(
      `${url}/rest/v1/backup_snapshots?select=snapshot_data,saved_at&order=saved_at.desc&limit=1`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0] && rows[0].snapshot_data) {
        const raw =
          typeof rows[0].snapshot_data === 'string'
            ? JSON.parse(rows[0].snapshot_data)
            : rows[0].snapshot_data;
        if (Array.isArray(raw) && raw.length > 0) {
          const restored = raw.map(mapRowToRecord);
          await bulkUpsertRecordsInSupabase(restored);
          return restored;
        }
      }
    }
  }

  // Fallback to bundled initial_database.json if no snapshot exists yet
  const bundled = await loadInitialBundledRecords();
  if (bundled.length > 0) {
    if (isConfigured) {
      await bulkUpsertRecordsInSupabase(bundled);
    }
    return bundled;
  }

  throw new Error('Tidak ada snapshot cadangan di Supabase untuk dipulihkan.');
}
