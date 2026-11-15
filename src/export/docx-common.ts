import {
  AlignmentType,
  BorderStyle,
  Footer,
  Header,
  LineRuleType,
  PageOrientation,
  Paragraph,
  TextRun,
  ISectionOptions,
  TableCell,
  VerticalAlign,
  WidthType,
  IBorderOptions,
} from 'docx';
import type { Penandatangan } from './types';

export const FONT = 'Arial';
export const NIL: IBorderOptions = { style: BorderStyle.NIL, size: 0, color: 'auto' };
export const SINGLE: IBorderOptions = { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 0 };
export const TABEL_GARIS = {
  top: SINGLE,
  bottom: SINGLE,
  left: SINGLE,
  right: SINGLE,
  insideHorizontal: SINGLE,
  insideVertical: SINGLE,
};

export const gaya = {
  default: {
    document: {
      run: { font: FONT, size: 22, language: { value: 'id-ID' } },
      paragraph: { spacing: { before: 0, after: 0, line: 240 } },
    },
  },
};

export const kosong = (extra: object = {}, size?: number) =>
  new Paragraph({ alignment: AlignmentType.BOTH, ...extra, run: size ? { size } : undefined });
export const teks = (t: string, extra: object = {}) => new Paragraph({ children: [new TextRun(t)], ...extra });

export const gayaBhiRingkas = {
  default: {
    document: {
      run: { font: FONT, size: 18, language: { value: 'id-ID' } },
      paragraph: {
        spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
      },
    },
  },
};

/** Halaman: A4 lanskap, margin LK/BHI, header/footer 'RAHASIA' (halaman pertama sama). */
export function propertiHalaman(): ISectionOptions['properties'] {
  return {
    titlePage: true,
    page: {
      size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
      margin: { top: 907, right: 851, bottom: 851, left: 851, header: 709, footer: 709 },
    },
  };
}

export function headerFooter(size?: number) {
  const run = size ? { size } : undefined;
  const hdr = () =>
    new Header({
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, run, children: [new TextRun({ text: 'RAHASIA', size })] }),
        new Paragraph({ run }),
      ],
    });
  const ftr = () =>
    new Footer({
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, run }),
        new Paragraph({ alignment: AlignmentType.CENTER, run, children: [new TextRun({ text: 'RAHASIA', size })] }),
      ],
    });
  return { headers: { default: hdr(), first: hdr() }, footers: { default: ftr(), first: ftr() } };
}

/** Garis pendek 128,25 pt di kiri atas: paragraf dengan border atas dan indent kanan (pengganti objek VML). */
export function garisKiriAtas(pageBreakBefore: boolean, size?: number) {
  return new Paragraph({
    run: size ? { size } : undefined,
    pageBreakBefore,
    indent: { right: 15136 - 2565 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 0 } },
  });
}

/**
 * Blok KOP Satuan dan Garis Kiri Atas:
 * Menampilkan teks KOP di atas garis horizontal kiri atas bila namaKop diisi (Sesuai Revisi 3).
 */
export function blokKopDanGaris(
  namaKop: string | undefined,
  pageBreakBefore: boolean,
  size?: number,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER
): Paragraph[] {
  const result: Paragraph[] = [];
  const lines = (namaKop || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 0) {
    lines.forEach((line, idx) => {
      result.push(
        new Paragraph({
          pageBreakBefore: idx === 0 && pageBreakBefore,
          indent: { right: 15136 - 2565 },
          alignment,
          run: size ? { size } : undefined,
          children: [
            new TextRun({
              text: line,
              font: FONT,
              size,
            }),
          ],
        })
      );
    });
    result.push(
      new Paragraph({
        run: size ? { size } : undefined,
        indent: { right: 15136 - 2565 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 0 } },
      })
    );
  } else {
    result.push(
      new Paragraph({
        run: size ? { size } : undefined,
        pageBreakBefore,
        indent: { right: 15136 - 2565 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 0 } },
      })
    );
  }

  return result;
}

export function judul(t: string, size?: number) {
  const run = size ? { size } : undefined;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, run, children: [new TextRun({ text: t, size })] }),
    kosong({}, size),
  ];
}

/** Sel tabel. border hanya untuk garis yang diubah (mis. { bottom: NIL }). */
export function sel(
  w: number,
  baris: string[],
  align: (typeof AlignmentType)[keyof typeof AlignmentType],
  opsi: { border?: object; columnSpan?: number; rowSpan?: number; vAlign?: boolean; size?: number } = {}
) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    columnSpan: opsi.columnSpan,
    rowSpan: opsi.rowSpan,
    verticalAlign: opsi.vAlign ? VerticalAlign.CENTER : undefined,
    borders: opsi.border as never,
    children: baris.map((b) =>
      new Paragraph({
        alignment: align,
        run: opsi.size ? { size: opsi.size } : undefined,
        children: b ? [new TextRun({ text: b, size: opsi.size })] : [],
      })
    ),
  });
}

/** Border sel data: tanpa garis horizontal antarbaris. */
export function borderBaris(i: number, n: number) {
  if (n === 1) return undefined;
  if (i === 0) return { bottom: NIL };
  if (i === n - 1) return { top: NIL };
  return { top: NIL, bottom: NIL };
}

export function blokTandaTangan(p: Penandatangan, bulanTahunBawaan: string, size?: number): Paragraph[] {
  const ind = { left: 7024, right: 4211 };
  const baris = p.tajuk ?? [
    `${p.kota ?? 'Bogor'},     ${p.bulanTahun ?? bulanTahunBawaan}`,
    p.jabatan ?? 'Dansatgas Waskita 25,',
  ];
  const signatureLines = [
    ...baris,
    '',
    '',
    '',
    p.nama,
    p.pangkat,
  ];
  return [
    new Paragraph({ keepNext: true }),
    new Paragraph({ keepNext: true }),
    ...signatureLines.map((t, i) =>
      new Paragraph({
        keepNext: i < signatureLines.length - 1,
        keepLines: true,
        indent: ind,
        alignment: AlignmentType.CENTER,
        run: size ? { size } : undefined,
        children: t ? [new TextRun({ text: t, size })] : [],
      })
    ),
  ];
}
