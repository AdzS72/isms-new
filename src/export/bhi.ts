import {
  AlignmentType,
  Document,
  Packer,
  Table,
  TableLayoutType,
  TableRow,
  WidthType,
} from 'docx';
import { CONFIG_BAWAAN, ExportConfig, IntelRecord, Penandatangan } from './types';
import {
  bagianZona,
  fmtTanggal,
  labelSumber,
  nomorBhi,
  susunUraian,
  BULAN,
  getCreatedAt,
  getIsuUtama,
  getSumberUrl,
  getNegara,
  getTokoh,
} from './format';
import {
  TABEL_GARIS,
  blokTandaTangan,
  borderBaris,
  blokKopDanGaris,
  gaya,
  gayaBhiRingkas,
  headerFooter,
  judul,
  propertiHalaman,
  sel,
} from './docx-common';

const PROFIL = {
  standar: {
    widths: [850, 1900, 1900, 1450, 1700, 5484, 1600],
    indent: 250,
    size: undefined as number | undefined,
    barisKosong: true,
    headerBerulang: false,
  },
  ringkas: {
    widths: [709, 1984, 1843, 1276, 992, 6593, 1600],
    indent: 137,
    size: 18 as number | undefined,
    barisKosong: false,
    headerBerulang: true,
  },
};
const C = AlignmentType.CENTER;
const B = AlignmentType.BOTH;
const EXPORT_BATCH_SIZE = 500;

type BarisBhi = ReturnType<typeof barisBhi>;

/**
 * Membentuk pemetaan nomor BHI berurutan 1 sampai N (tanpa duplikat)
 * Diurutkan berdasarkan tanggal asc, lalu created_at asc, lalu id (Sesuai Revisi 1 & 2)
 */
export function buatBhiNumberMap(records: IntelRecord[]): Map<string, number> {
  const unik = new Map(records.map((record) => [record.id, record]));
  const urut = [...unik.values()].sort((a, b) => {
    const tglA = tanggalUrut(a.tanggal);
    const tglB = tanggalUrut(b.tanggal);
    if (tglA !== tglB) return tglA.localeCompare(tglB);
    const cA = getCreatedAt(a);
    const cB = getCreatedAt(b);
    if (cA !== cB) return cA.localeCompare(cB);
    return a.id.localeCompare(b.id);
  });

  const map = new Map<string, number>();
  urut.forEach((r, idx) => {
    map.set(r.id, idx + 1);
  });
  return map;
}

function tanggalUrut(tanggal: string): string {
  const nilai = (tanggal ?? '').trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(nilai);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(nilai);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  const parsed = Date.parse(nilai);
  return Number.isNaN(parsed) ? `9999-${nilai}` : new Date(parsed).toISOString().slice(0, 10);
}

export function barisBhi(
  r: IntelRecord,
  cfg: ExportConfig,
  fallbackIndex?: number,
  bhiNumberMap?: Map<string, number>
) {
  const createdAt = getCreatedAt(r);
  const terima = bagianZona(createdAt, cfg.zona);
  const isuUtama = getIsuUtama(r);
  const negara = getNegara(r);
  // Revisi 4 & 5: menambahkan "di <negara>," dan sentence case EYD
  const u = susunUraian(isuUtama, r.tanggal, 'bhi', cfg, negara, getTokoh(r), true);
  const sumberUrl = getSumberUrl(r);

  return {
    // Revisi 1 & 2: nomor BHI urut 1..N tanpa dobel
    no: String(nomorBhi(r, fallbackIndex, bhiNumberMap)),
    terimaTgl: fmtTanggal(terima.tanggal, 'bhi'),
    terimaJam: terima.jam,
    waktuTgl: fmtTanggal(r.tanggal, 'bhi'),
    waktuJam: cfg.jamKejadian === 'jam-input' ? terima.jam : '-',
    sumber: labelSumber(sumberUrl), // Revisi 6: 'OSINT'
    uraian: u.teks,
    ket: cfg.ketBhi,
    perluPeriksa: u.perluPeriksa,
    id: r.id,
  };
}

export function buatBhiDoc(
  records: IntelRecord[],
  ttd: Penandatangan,
  cfg: ExportConfig = CONFIG_BAWAAN,
  bhiNumberMap?: Map<string, number>
): Document {
  const map = bhiNumberMap || buatBhiNumberMap(records);
  const rows = urutkanBhi(records, map).map((record, index) =>
    barisBhi(record, cfg, index + 1, map)
  );
  const dataRows = rows.map((row, index) => barisTabelBhi(row, index, rows.length, cfg));
  return dokumenBhiDariBaris(dataRows, ttd, cfg);
}

function urutkanBhi(records: IntelRecord[], map: Map<string, number>): IntelRecord[] {
  return [...records].sort((a, b) => {
    const noA = map.get(a.id) ?? 999999;
    const noB = map.get(b.id) ?? 999999;
    return noA - noB;
  });
}

function barisTabelBhi(row: BarisBhi, index: number, total: number, cfg: ExportConfig): TableRow {
  const profil = PROFIL[cfg.profilBhi];
  const widths = profil.widths;
  const border = profil.headerBerulang ? undefined : borderBaris(index, total);
  const options = { border, size: profil.size };
  return new TableRow({
    cantSplit: true,
    children: [
      sel(widths[0], [row.no], C, options),
      sel(widths[1], [row.terimaTgl, row.terimaJam], C, options),
      sel(widths[2], [row.waktuTgl], C, options),
      sel(widths[3], [row.waktuJam], C, options),
      sel(widths[4], [row.sumber], C, options),
      sel(widths[5], profil.barisKosong ? [row.uraian, ''] : [row.uraian], B, options),
      sel(widths[6], [row.ket], C, options),
    ],
  });
}

function dokumenBhiDariBaris(
  dataRows: TableRow[],
  ttd: Penandatangan,
  cfg: ExportConfig
): Document {
  const profil = PROFIL[cfg.profilBhi];
  const widths = profil.widths;
  const size = profil.size;
  const styles = cfg.profilBhi === 'ringkas' ? gayaBhiRingkas : gaya;
  const h = (t: string, w: number, o: object = {}) => sel(w, [t], C, { vAlign: true, size, ...o });
  const headerRow = profil.headerBerulang ? { tableHeader: true } : {};

  const tabel = new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    indent: { size: profil.indent, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: TABEL_GARIS,
    rows: [
      new TableRow({
        ...headerRow,
        children: [
          h('NO', widths[0], { rowSpan: 3 }),
          h('TGL/JAM PENERIMAAN', widths[1], { rowSpan: 3 }),
          h('KEJADIAN', widths[2] + widths[3] + widths[4] + widths[5], { columnSpan: 4 }),
          h('KET/ TINDAKAN', widths[6], { rowSpan: 3 }),
        ],
      }),
      new TableRow({
        ...headerRow,
        children: [
          h('WAKTU', widths[2] + widths[3], { columnSpan: 2 }),
          h('SUMBER', widths[4], { rowSpan: 2 }),
          h('URAIAN', widths[5], { rowSpan: 2 }),
        ],
      }),
      new TableRow({
        ...headerRow,
        children: [h('TGL', widths[2]), h('JAM', widths[3])],
      }),
      ...dataRows,
    ],
  });

  const tz = bagianZona(new Date().toISOString(), cfg.zona).tanggal;
  const bulanTahun = `${BULAN[+tz.slice(5, 7) - 1]} ${tz.slice(0, 4)}`;

  // Revisi 3: menyertakan KOP di atas garis kiri atas
  const kopText = ttd.namaKop || cfg.namaKop;

  return new Document({
    styles,
    sections: [
      {
        properties: propertiHalaman(),
        ...headerFooter(size),
        children: [
          ...blokKopDanGaris(kopText, false, size, AlignmentType.LEFT),
          ...judul('BUKU HARIAN INTELIJEN (BHI)', size),
          tabel,
          ...blokTandaTangan(ttd, bulanTahun, size),
        ],
      },
    ],
  });
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Generates BHI .docx as a browser Blob, yielding during large row batches. */
export async function buatBhi(
  records: IntelRecord[],
  ttd: Penandatangan,
  cfg: ExportConfig = CONFIG_BAWAAN,
  bhiNumberMap?: Map<string, number>,
  onProgress?: (completed: number, total: number, stage: 'rows' | 'packing') => void
): Promise<Blob> {
  const map = bhiNumberMap || buatBhiNumberMap(records);
  const orderedRecords = urutkanBhi(records, map);
  const dataRows: TableRow[] = [];

  for (let start = 0; start < orderedRecords.length; start += EXPORT_BATCH_SIZE) {
    const end = Math.min(start + EXPORT_BATCH_SIZE, orderedRecords.length);
    for (let index = start; index < end; index++) {
      const row = barisBhi(orderedRecords[index], cfg, index + 1, map);
      dataRows.push(barisTabelBhi(row, index, orderedRecords.length, cfg));
    }
    onProgress?.(end, orderedRecords.length);
    if (end < orderedRecords.length) await yieldToBrowser();
  }

  const doc = dokumenBhiDariBaris(dataRows, ttd, cfg);
  onProgress?.(orderedRecords.length, orderedRecords.length, 'packing');
  await yieldToBrowser();
  return await Packer.toBlob(doc);
}
