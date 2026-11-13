import type { IntelRecord, Zona, ExportConfig } from './types';
import { entitasDariRekaman, perbaikiEyd, teksSemuaKapital } from './eyd';

export const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const TZ: Record<Zona, string> = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
};

const p2 = (n: number | string) => String(n).padStart(2, '0');

export type Target = 'bhi' | 'lk';

/** Property Accessor Helpers for camelCase / snake_case interoperability */
export const getCreatedAt = (r: IntelRecord): string =>
  r.created_at || r.createdAt || (r.tanggal ? `${r.tanggal}T08:00:00Z` : new Date().toISOString());

export const getIsuUtama = (r: IntelRecord): string =>
  r.isu_utama ?? r.isuUtama ?? '';

export const getSumberUrl = (r: IntelRecord): string =>
  r.sumber_url ?? r.sumberUrl ?? '';

export const getBentukKegiatan = (r: IntelRecord): string =>
  r.bentuk_kegiatan ?? r.bentukKegiatan ?? '-';

export const getNegara = (r: IntelRecord): string =>
  r.negara ?? '';

export const getTokoh = (r: IntelRecord): string =>
  r.tokoh ?? '';

export const getIsDemo = (r: IntelRecord): boolean =>
  Boolean(r.is_demo ?? r.isDemo ?? false);

/** 'YYYY-MM-DD' -> '13 April 2026' (BHI) atau '13/04/2026' (LK) */
export function fmtTanggal(iso: string, target: Target): string {
  if (!iso) return '-';
  const clean = iso.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return iso;
  }
  const [y, m, d] = parts;
  return target === 'bhi' ? `${p2(d)} ${BULAN[m - 1] || ''} ${y}` : `${p2(d)}/${p2(m)}/${y}`;
}

/** TIMESTAMPTZ (ISO) -> tanggal 'YYYY-MM-DD' dan jam 'HH.mm WIB' pada zona yang dipilih */
export function bagianZona(iso: string, zona: Zona) {
  try {
    const f = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ[zona] || TZ.WIB,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return {
      tanggal: `${p.year}-${p.month}-${p.day}`,
      jam: `${p.hour}.${p.minute} ${zona}`,
    };
  } catch {
    const fallbackDate = iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return { tanggal: fallbackDate, jam: `08.00 ${zona}` };
  }
}

/** Nomor BHI: mengutamakan map nomor BHI sekuensial (Revisi 1 & 2), fallback index, bhi_no, atau parse ID */
export function nomorBhi(
  r: IntelRecord,
  fallbackIndex?: number,
  bhiNumberMap?: Map<string, number>
): number {
  if (bhiNumberMap && bhiNumberMap.has(r.id)) {
    return bhiNumberMap.get(r.id)!;
  }
  if (fallbackIndex != null && fallbackIndex > 0) {
    return fallbackIndex;
  }
  if (r.bhi_no != null && !isNaN(Number(r.bhi_no))) return Number(r.bhi_no);
  if (r.bhiNo != null && !isNaN(Number(r.bhiNo))) return Number(r.bhiNo);

  const m = /(\d+)$/.exec(r.id);
  if (m) return parseInt(m[1], 10);

  const midMatch = /-(\d+)-[a-z0-9]+$/i.exec(r.id);
  if (midMatch) return parseInt(midMatch[1], 10) + 1;

  const anyDigits = r.id.replace(/\D/g, '');
  if (anyDigits.length > 0) {
    const parsed = parseInt(anyDigits.slice(-6), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return 1;
}

/**
 * SUMBER: Disamakan 'OSINT' (Sesuai Revisi 6)
 */
export function labelSumber(_sumberUrl?: string): string {
  return 'OSINT';
}

// ---- DAFTAR ENTITAS & AKRONIM KANONIKAL SESUAI EYD
const ACRONYMS = [
  'AS', 'TNI', 'POLRI', 'AD', 'AL', 'AU', 'NATO', 'PBB', 'DK PBB', 'EU', 'UE', 'OSINT', 'AI', 'BHI', 'LK',
  'MoU', 'KTT', 'DIS', 'CIA', 'FBI', 'NSA', 'KGB', 'FSB', 'MI6', 'NORAD', 'BAE', 'LNG', 'PDB', 'GDP',
  'APBN', 'APBD', 'DPR', 'MPR', 'US', 'UK', 'DE', 'FR', 'RU', 'UA', 'CN', 'JP', 'KR', 'KP', 'ID', 'RI',
  'NKRI', 'ASEAN', 'BRICS', 'G7', 'G20', 'IAEA', 'OPEC', 'WHO', 'WTO', 'IMF', 'BMKG', 'BAIS', 'BIN', 'BSSN',
  'Kemhan', 'Kemenhan', 'Kemlu', 'Kemenlu', 'Kemenkeu', 'Puspen', 'Mabes', 'Danjen', 'Kasau',
  'Kasal', 'Kasad', 'Kapolri', 'Kapolda',
  'ICBM', 'UAV', 'SAM', 'MANPADS', 'GPS', 'Starlink', 'BBC', 'RRI', 'CNN', 'DW', 'AP', 'AFP', 'US$', 'USD',
  'IDR', 'EUR', 'GBP', 'RUB', 'JPY', 'CNY', 'Rp',
];

const PROPER_ENTITIES = [
  // Negara-negara Utama & Amerop
  'Amerika Serikat', 'Inggris', 'Rusia', 'Ukraina', 'Jerman', 'Prancis', 'Tiongkok', 'Korea Selatan',
  'Korea Utara', 'Jepang', 'Indonesia', 'Brasil', 'Kanada', 'Meksiko', 'Polandia', 'Italia', 'Belanda',
  'Turki', 'Iran', 'Israel', 'Swiss', 'Swedia', 'Norwegia', 'Finlandia', 'Denmark', 'Spanyol', 'Portugal',
  'Yunani', 'Austria', 'Belgia', 'Hungaria', 'Ceko', 'Belarus', 'Rumania', 'Bulgaria', 'Slowakia', 'Kroasia',
  'Serbia', 'Singapura', 'Malaysia', 'Filipina', 'Thailand', 'Vietnam', 'India', 'Pakistan', 'Australia',
  'Mesir', 'Afrika Selatan', 'Arab Saudi', 'Argentina', 'Kolombia', 'Chili', 'Peru', 'Venezuela', 'Ekuador',
  'Kuba', 'Haiti', 'Guatemala', 'Panama', 'Estonia', 'Latvia', 'Lithuania', 'Afghanistan', 'Albania',
  'Aljazair', 'Angola', 'Armenia', 'Azerbaijan', 'Bangladesh', 'Bhutan', 'Bolivia', 'Bosnia dan Herzegovina',
  'Botswana', 'Brunei Darussalam', 'Kamboja', 'Kamerun', 'Kosta Rika', 'Siprus', 'Etiopia', 'Georgia',
  'Ghana', 'Irak', 'Irlandia', 'Yordania', 'Kazakhstan', 'Kenya', 'Kuwait', 'Laos', 'Libanon', 'Libya',
  'Madagaskar', 'Maladewa', 'Mongolia', 'Maroko', 'Myanmar', 'Nepal', 'Selandia Baru', 'Nigeria', 'Oman',
  'Qatar', 'Rwanda', 'Senegal', 'Somalia', 'Sri Lanka', 'Sudan', 'Suriah', 'Taiwan', 'Tanzania', 'Tunisia',
  'Uganda', 'Uni Emirat Arab', 'Uzbekistan', 'Yaman', 'Zambia', 'Zimbabwe',
  // Lokasi, Landmark, Kawasan
  'Washington', 'Moskow', 'Kyiv', 'London', 'Berlin', 'Paris', 'Beijing', 'Tokyo', 'Seoul', 'Pyongyang',
  'Jakarta', 'Den Haag', 'Plesetsk', 'Kamchatka', 'Iqaluit', 'Chiapas', 'Amazon', 'Gedung Putih', 'Kremlin',
  'Elysee', 'Downing Street', 'Arktik', 'Atlantik', 'Pasifik', 'Laut Hitam', 'Laut Merah', 'Mediterania',
  'Laut Natuna', 'Selat Taiwan', 'Selat Malaka', 'Timur Tengah', 'Amerika', 'Eropa', 'Asia', 'Afrika', 'Waskita',
  'New York', 'Los Angeles', 'San Francisco', 'München', 'Brussels', 'Brussel', 'Jenewa', 'Crimea',
  'Donbas', 'Luhansk', 'Donetsk', 'Siberia', 'Sakhalin', 'Laut China Selatan', 'Laut Jepang', 'Laut Kaspia',
  'Teluk Persia', 'Teluk Aden', 'Samudra Hindia', 'Samudra Arktik', 'Samudra Atlantik', 'Samudra Pasifik',
  'Semenanjung Korea', 'Semenanjung Krimea', 'Kawasan Indo-Pasifik',
  // Tokoh Kunci Geopolitik
  'Donald Trump', 'Vladimir Putin', 'Volodymyr Zelenskyy', 'Emmanuel Macron', 'Olaf Scholz', 'Keir Starmer',
  'Joe Biden', 'Xi Jinping', 'Kim Jong Un', 'Claudia Sheinbaum', 'Giorgia Meloni', 'Bill Blair', 'John Healey',
  'Andrei Belousov', 'Rustem Umerov', 'Władysław Kosiniak-Kamysz', 'Tomás Ribeiro Paiva', 'Gregory M. Guillot',
  'Caspar Veldkamp', 'Gutri Rahmad Zuwa', 'Budi Santoso', 'Joko Widodo', 'Prabowo Subianto',
  'Susilo Bambang Yudhoyono', 'Megawati Soekarnoputri', 'Anies Baswedan', 'Ganjar Pranowo',
  'Alexander Lukashenko', 'Recep Tayyip Erdoğan', 'Benjamin Netanyahu', 'Narendra Modi', 'Fumio Kishida',
  // Nama organisasi dan lembaga
  'Dewan Keamanan PBB', 'Uni Eropa', 'Perserikatan Bangsa-Bangsa', 'Mahkamah Internasional',
  'Kementerian Pertahanan', 'Kementerian Luar Negeri', 'Angkatan Bersenjata',
  // Bulan & Hari
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu',
];

const JABATAN_DI_DEPAN_NAMA = [
  'Presiden', 'Wakil Presiden', 'Perdana Menteri', 'Menteri', 'Menteri Pertahanan',
  'Menteri Luar Negeri', 'Kanselir', 'Kepala Staf', 'Komandan', 'Panglima', 'Jenderal',
  'Laksamana', 'Marsekal', 'Kolonel', 'Letkol', 'Mayor', 'Kapten', 'Letnan',
];

/**
 * Format sentence case dan pulihkan kapitalisasi akronim serta nama diri
 * (orang, tempat, negara, lembaga) sesuai kaidah EYD.
 */
export function formatSentenceCaseEYD(
  raw: string,
  namaDiri: string[] = [],
  kapitalAwalKalimat = true
): string {
  if (!raw) return '';
  let text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const huruf = text.replace(/[^\p{L}]/gu, '');
  const allCaps = huruf.length > 0 && huruf === huruf.toLocaleUpperCase('id-ID');
  const kapitalAsli: string[] = [];

  if (!allCaps) {
    const kataKapital = /\p{Lu}\p{Ll}[\p{L}\p{M}]*(?:[-']\p{Lu}?\p{Ll}[\p{L}\p{M}]*)*/gu;
    for (const match of text.matchAll(kataKapital)) {
      const sebelum = text.slice(0, match.index ?? 0).trimEnd();
      if (sebelum && !/[.!?]$/.test(sebelum)) kapitalAsli.push(match[0]);
    }
  }

  text = text.toLocaleLowerCase('id-ID');

  const pulihkanNama = (entity: string) => {
    const canonical = entity.trim();
    const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return;
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'giu');
    text = text.replace(regex, (_match, prefix: string) => `${prefix}${canonical}`);
  };

  for (const nama of kapitalAsli) pulihkanNama(nama);
  for (const nama of namaDiri) {
    const titleCase = nama
      .trim()
      .toLocaleLowerCase('id-ID')
      .replace(/(^|[\s-])(\p{Ll})/gu, (_match, prefix: string, initial: string) =>
        prefix + initial.toLocaleUpperCase('id-ID')
      );
    pulihkanNama(titleCase);
  }
  for (const entity of [...PROPER_ENTITIES].sort((a, b) => b.length - a.length)) {
    pulihkanNama(entity);
  }

  for (const jabatan of JABATAN_DI_DEPAN_NAMA) {
    const escaped = jabatan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^\\p{L}])(${escaped})(?=\\s+\\p{Lu})`, 'giu');
    text = text.replace(regex, (_match, prefix: string) => `${prefix}${jabatan}`);
  }

  const awalKalimat = kapitalAwalKalimat ? '(^|[.!?]\\s+)' : '([.!?]\\s+)';
  text = text.replace(new RegExp(`${awalKalimat}(\\p{Ll})`, 'gu'), (_match, prefix: string, initial: string) =>
    prefix + initial.toLocaleUpperCase('id-ID')
  );

  for (const acronym of ACRONYMS) {
    const escaped = acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    text = text.replace(regex, acronym);
  }

  if (!/[.!?]$/.test(text)) text += '.';
  return text;
}

const NAMA_BULAN_RE = BULAN.join('|');

function konversiTanggal(teks: string, target: Target): string {
  const f = (y: number, m: number, d: number) => fmtTanggal(`${y}-${p2(m)}-${p2(d)}`, target);
  return teks
    .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (_, d, m, y) => f(+y, +m, +d))
    .replace(
      new RegExp(`\\b(\\d{1,2})\\s+(${NAMA_BULAN_RE})\\s+(\\d{4})\\b`, 'gi'),
      (_, d, bln, y) =>
        f(+y, BULAN.findIndex((b) => b.toLowerCase() === String(bln).toLowerCase()) + 1, +d)
    )
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) => f(+y, +m, +d));
}

/**
 * URAIAN Dokumen:
 * - Menambahkan "di <negara>," setelah "Pada <tanggal>," (Sesuai Revisi 4)
 * - Memformat ulang menjadi Sentence Case sesuai kaidah EYD (Sesuai Revisi 5)
 */
export function susunUraian(
  isuUtama: string,
  tanggal: string,
  target: Target,
  cfg: Pick<ExportConfig, 'kataAwalUmum'>,
  negara?: string,
  tokoh?: string,
  formatBhi = false
): { teks: string; perluPeriksa: boolean } {
  let t = (isuUtama ?? '').replace(/\s+/g, ' ').trim();
  const formatTgl = fmtTanggal(tanggal, target);
  const cleanNegara = (negara ?? '').trim();
  const entitas = formatBhi ? entitasDariRekaman({ negara: cleanNegara, tokoh }) : [];
  const negaraFormat = cleanNegara
    ? formatBhi
      ? perbaikiEyd(cleanNegara, entitas)
      : formatSentenceCaseEYD(cleanNegara).replace(/[.!?]$/, '')
    : '';
  const prefix = negaraFormat ? `Pada ${formatTgl}, di ${negaraFormat},` : `Pada ${formatTgl},`;

  if (!t) {
    return { teks: `${prefix} (uraian belum diisi).`, perluPeriksa: true };
  }

  // Bersihkan awalan tanggal bergaya '2026-05-02:' atau '13/04/2026 -'
  t = t.replace(new RegExp(`^(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{4})\\s*[:\\-–,]\\s*`), '');

  // Bersihkan awalan 'Pada <tanggal>,' dan 'di <negara>,' yang sudah ada agar tidak ganda
  t = t.replace(
    new RegExp(
      `^Pada\\s+(?:\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{1,2}\\s+(?:${NAMA_BULAN_RE})\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})\\s*(?:,\\s*di\\s+[^,]+)?\\s*,?\\s*`,
      'i'
    ),
    ''
  );

  // Konversi tanggal di dalam badan teks sesuai format target (BHI: dd mmmm yyyy, LK: dd/mm/yyyy)
  t = konversiTanggal(t, target);

  if (formatBhi) {
    if (teksSemuaKapital(t)) t = t.toLocaleLowerCase('id-ID');
    t = perbaikiEyd(t, entitas, false, [tokoh ?? '']);
  } else {
    // Format menjadi Sentence Case EYD
    t = formatSentenceCaseEYD(t, [cleanNegara, tokoh ?? ''], false);
  }

  const hasil = `${prefix} ${t}`;
  return { teks: hasil, perluPeriksa: false };
}

/** Pembungkus baris Masalah (maks ~46 karakter per baris, seperti LK contoh). */
export function bungkus(teks: string, lebar = 46): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of teks.split(/\s+/)) {
    if ((cur + ' ' + w).trim().length <= lebar) {
      cur = (cur + ' ' + w).trim();
    } else {
      out.push(cur);
      cur = w;
    }
  }
  return cur ? [...out, cur] : out;
}
