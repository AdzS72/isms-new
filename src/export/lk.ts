import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableLayoutType,
  TableRow,
  TextRun,
  Tab,
  WidthType,
} from 'docx';
import { CONFIG_BAWAAN, ExportConfig, IntelRecord, Penandatangan } from './types';
import {
  bagianZona,
  bungkus,
  labelSumber,
  nomorBhi,
  susunUraian,
  BULAN,
  getIsuUtama,
  getSumberUrl,
  getNegara,
  getTokoh,
} from './format';
import { kelompokkanLk } from './group';
import type { KelompokLk } from './group';
import {
  TABEL_GARIS,
  blokTandaTangan,
  borderBaris,
  blokKopDanGaris,
  gaya,
  headerFooter,
  judul,
  propertiHalaman,
  sel,
} from './docx-common';
import { buatBhiNumberMap } from './bhi';

const W = [709, 850, 2169, 7329, 1417, 2410]; // LK, BHI, SUMBER, URAIAN, NILAI, KET/TIND
const C = AlignmentType.CENTER;
const B = AlignmentType.BOTH;
const EXPORT_BATCH_SIZE = 500;

function blokBidangMasalah(bidang: string, masalah: string): Paragraph[] {
  const baris = bungkus(masalah);
  const a = { alignment: B, indent: { left: 3828, firstLine: 720 } };
  const m = { alignment: B, indent: { left: 5040, firstLine: 720 } };

  return [
    new Paragraph({
      ...a,
      children: [
        new TextRun({
          children: [new Tab(), new Tab(), 'Bidang    ', new Tab(), ': ', bidang],
        }),
      ],
    }),
    new Paragraph({
      ...m,
      children: [new TextRun({ children: ['Masalah', new Tab(), ': ', baris[0] || ''] })],
    }),
    ...baris.slice(1).map(
      (l) =>
        new Paragraph({
          ...m,
          children: [new TextRun({ children: [new Tab(), new Tab(), `  ${l}`] })],
        })
    ),
    new Paragraph(m),
  ];
}

export function buatLkDoc(
  records: IntelRecord[],
  ttd: Penandatangan,
  cfg: ExportConfig = CONFIG_BAWAAN,
  bhiNumberMap?: Map<string, number>
): Document {
  const bhiMap = bhiNumberMap || buatBhiNumberMap(records);
  const kelompok = kelompokkanLk(records, cfg);
  const tabel = kelompok.map((group) => buatTabelLk(group, cfg, bhiMap));
  return dokumenLk(kelompok, tabel, ttd, cfg);
}

function barisTabelLk(
  r: IntelRecord,
  index: number,
  groupSize: number,
  cfg: ExportConfig,
  bhiMap: Map<string, number>
): TableRow {
  const border = borderBaris(index, groupSize);
  const isuUtama = getIsuUtama(r);
  const sumberUrl = getSumberUrl(r);
  const negara = getNegara(r);
  const noBhi = nomorBhi(r, index + 1, bhiMap);
  const uraianTeks = susunUraian(isuUtama, r.tanggal, 'lk', cfg, negara, getTokoh(r)).teks;

  return new TableRow({
    cantSplit: true,
    children: [
      sel(W[0], [String(index + 1)], C, { border }),
      sel(W[1], [String(noBhi)], C, { border }),
      sel(W[2], [labelSumber(sumberUrl)], C, { border }),
      sel(W[3], [uraianTeks, ''], B, { border }),
      sel(W[4], [cfg.nilaiLk], C, { border }),
      sel(W[5], [cfg.ketLk], C, { border }),
    ],
  });
}

function buatTabelLk(
  group: KelompokLk,
  cfg: ExportConfig,
  bhiMap: Map<string, number>,
  dataRows?: TableRow[]
): Table {
  const n = group.records.length;
  const h = (text: string, width: number, options: object = {}) =>
    sel(width, [text], C, { vAlign: true, ...options });
  const rows = dataRows ?? group.records.map((record, index) =>
    barisTabelLk(record, index, n, cfg, bhiMap)
  );
  return new Table({
    width: { size: W.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: W,
    indent: { size: 250, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: TABEL_GARIS,
    rows: [
      new TableRow({
        children: [
          h('NO URUT', W[0] + W[1], { columnSpan: 2 }),
          h('SUMBER', W[2], { rowSpan: 2 }),
          h('URAIAN', W[3], { rowSpan: 2 }),
          h('NILAI', W[4], { rowSpan: 2 }),
          h('KET/TIND', W[5], { rowSpan: 2 }),
        ],
      }),
      new TableRow({
        children: [sel(W[0], ['LK'], C), sel(W[1], ['BHI'], C)],
      }),
      ...rows,
    ],
  });
}

function dokumenLk(
  kelompok: KelompokLk[],
  tabel: Table[],
  ttd: Penandatangan,
  cfg: ExportConfig
): Document {
  const tz = bagianZona(new Date().toISOString(), cfg.zona).tanggal;
  const bulanTahun = `${BULAN[+tz.slice(5, 7) - 1]} ${tz.slice(0, 4)}`;
  const children: (Paragraph | Table)[] = [];

  kelompok.forEach((g, k) => {
    children.push(
      // Revisi 3: Kop teks di atas garis kiri atas
      ...blokKopDanGaris(ttd.namaKop || cfg.namaKop, k > 0),
      ...judul('LEMBARAN KERJA'),
      ...blokBidangMasalah(g.bidang, g.masalah),
      tabel[k],
      ...blokTandaTangan(ttd, bulanTahun)
    );
  });

  return new Document({
    styles: gaya,
    sections: [
      {
        properties: propertiHalaman(),
        ...headerFooter(),
        children,
      },
    ],
  });
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Generates LK .docx as a browser Blob, yielding during large row batches. */
export async function buatLk(
  records: IntelRecord[],
  ttd: Penandatangan,
  cfg: ExportConfig = CONFIG_BAWAAN,
  bhiNumberMap?: Map<string, number>,
  onProgress?: (completed: number, total: number, stage: 'rows' | 'packing') => void,
  kelompokSiap?: KelompokLk[]
): Promise<Blob> {
  const bhiMap = bhiNumberMap || buatBhiNumberMap(records);
  const kelompok = kelompokSiap || kelompokkanLk(records, cfg);
  const total = records.length;
  const tabel: Table[] = [];
  let completed = 0;
  let nextYield = EXPORT_BATCH_SIZE;

  for (const group of kelompok) {
    const dataRows: TableRow[] = [];
    for (let start = 0; start < group.records.length; start += EXPORT_BATCH_SIZE) {
      const end = Math.min(start + EXPORT_BATCH_SIZE, group.records.length);
      for (let index = start; index < end; index++) {
        dataRows.push(barisTabelLk(group.records[index], index, group.records.length, cfg, bhiMap));
      }
      completed += end - start;
      onProgress?.(completed, total, 'rows');
      if (completed >= nextYield && completed < total) {
        await yieldToBrowser();
        nextYield = completed + EXPORT_BATCH_SIZE;
      }
    }
    tabel.push(buatTabelLk(group, cfg, bhiMap, dataRows));
  }

  const doc = dokumenLk(kelompok, tabel, ttd, cfg);
  onProgress?.(total, total, 'packing');
  await yieldToBrowser();
  return await Packer.toBlob(doc);
}
