/**
 * Types & Interfaces for BHI & LK Document Export
 * Based on ISMS Unified Edition Guide
 */

export interface IntelRecord {
  id: string;
  tanggal: string;              // DATE -> 'YYYY-MM-DD'
  benua?: string;
  negara: string;
  negara_code?: string;
  negaraCode?: string;
  bidang: string;
  kegiatan: string;
  bentuk_kegiatan?: string;
  bentukKegiatan?: string;
  isu_utama?: string;            // dipakai sebagai URAIAN
  isuUtama?: string;
  tokoh?: string;
  sumber_url?: string;
  sumberUrl?: string;
  status_sumber?: string;
  statusSumber?: string;
  created_at?: string;           // TIMESTAMPTZ (ISO, UTC) -> jam penerimaan
  createdAt?: string;
  bhi_no?: number | null;       // nomor BHI permanen (disarankan)
  bhiNo?: number | null;
  is_demo?: boolean;
  isDemo?: boolean;
}

export type Zona = 'WIB' | 'WITA' | 'WIT';

export interface Penandatangan {
  nama: string;                 // wajib (dari form)
  pangkat: string;              // wajib, contoh 'Letda Lek NRP 12345 / Nosis 678'
  jabatan?: string;             // bawaan: 'Dansatgas Waskita 25,'
  kota?: string;                // bawaan: 'Bogor'
  bulanTahun?: string;          // bawaan: bulan dan tahun saat ekspor
  namaKop?: string;             // dua baris teks KOP, dipisahkan newline
  tajuk?: string[];             // baris tajuk tanda tangan untuk BHI
}

export interface ExportConfig {
  zona: Zona;                                   // zona tampilan jam
  jamKejadian: 'jam-input' | 'strip';           // WAKTU/JAM: pakai jam input, atau '-'
  nilaiLk: string;                              // 'A-2'
  ketLk: string;                                // 'Dimonitor'
  ketBhi: string;                               // 'Dilaporkan ke pengendali'
  pengelompokanLk: 'bidang+kegiatan' | 'bidang+kegiatan+negara';
  maksBarisPerLk: number;                       // pecah per bentuk_kegiatan bila lebih
  urutanBidang: string[];                       // urutan LK menurut bidang
  kataAwalUmum: string[];                       // kata awal kalimat yang boleh diturunkan huruf awalnya
  namaKop?: string;                             // dua baris KOP satuan, dipisahkan newline
  profilBhi: 'standar' | 'ringkas';
}

export const STRATEGIC_COMPONENTS_9 = [
  'Ekonomi',
  'Angkatan Bersenjata',
  'Ilmu Pengetahuan dan Teknologi',
  'Sosial',
  'Biografi',
  'Sejarah',
  'Geografi',
  'Politik',
  'Transportasi dan Telekomunikasi',
];

export const CONFIG_BAWAAN: ExportConfig = {
  zona: 'WIB',
  jamKejadian: 'jam-input',
  nilaiLk: 'A-2',
  ketLk: 'Dimonitor',
  ketBhi: 'Dilaporkan ke pengendali',
  pengelompokanLk: 'bidang+kegiatan+negara',
  maksBarisPerLk: 40,
  urutanBidang: STRATEGIC_COMPONENTS_9,
  profilBhi: 'standar',
  kataAwalUmum: [
    'Setelah',
    'Sementara',
    'Meskipun',
    'Karena',
    'Dalam',
    'Untuk',
    'Akibat',
    'Seorang',
    'Sejumlah',
    'Beberapa',
    'Para',
    'Pemerintah',
    'Pasukan',
  ],
};

export interface FilterEkspor {
  dari?: string;
  sampai?: string;
  benua?: string[];
  negara?: string[];
  bidang?: string[];
  kegiatan?: string[];
  excludeDemo?: boolean;
}
