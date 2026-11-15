import type { IntelRecord, ExportConfig } from './types';
import { formatSentenceCaseEYD, getBentukKegiatan, getCreatedAt } from './format';

export interface KelompokLk {
  bidang: string;
  masalah: string;
  records: IntelRecord[];
}

const tahunDari = (rs: IntelRecord[]) => {
  const th = rs.map((r) => +r.tanggal.slice(0, 4)).filter((n) => !isNaN(n) && n > 0);
  if (th.length === 0) return 'Tahun ' + new Date().getFullYear();
  const a = Math.min(...th);
  const b = Math.max(...th);
  return a === b ? `Tahun ${a}` : `${a}-${b}`;
};

/** Masalah LK = kegiatan (+ negara) + periode, mis. 'Latihan Militer Bersama Korea Selatan Tahun 2026'. */
export function judulMasalah(
  kegiatan: string,
  negara: string | null,
  rs: IntelRecord[],
  bentuk?: string
): string {
  const kegiatanCapital = formatSentenceCaseEYD(kegiatan).replace(/[.!?]$/, '');
  return [kegiatanCapital, bentuk ? `(${bentuk})` : '', negara ?? '', tahunDari(rs)]
    .filter(Boolean)
    .join(' ');
}

const urut = (a: IntelRecord, b: IntelRecord) =>
  a.tanggal.localeCompare(b.tanggal) ||
  getCreatedAt(a).localeCompare(getCreatedAt(b)) ||
  a.id.localeCompare(b.id);

export function kelompokkanLk(records: IntelRecord[], cfg: ExportConfig): KelompokLk[] {
  const denganNegara = cfg.pengelompokanLk === 'bidang+kegiatan+negara';
  const peta = new Map<string, IntelRecord[]>();

  for (const r of records) {
    const k = [r.bidang, r.kegiatan, denganNegara ? r.negara : ''].join('\u0001');
    (peta.get(k) ?? peta.set(k, []).get(k)!).push(r);
  }

  const hasil: KelompokLk[] = [];

  for (const rs of peta.values()) {
    const { bidang, kegiatan, negara } = rs[0];
    if (rs.length > cfg.maksBarisPerLk) {
      // pecah per bentuk_kegiatan bila terlalu panjang
      const perBentuk = new Map<string, IntelRecord[]>();
      for (const r of rs) {
        const bk = getBentukKegiatan(r);
        (perBentuk.get(bk) ?? perBentuk.set(bk, []).get(bk)!).push(r);
      }
      if (perBentuk.size > 1) {
        for (const [bentuk, sub] of perBentuk) {
          hasil.push({
            bidang,
            masalah: judulMasalah(kegiatan, denganNegara ? negara : null, sub, bentuk),
            records: sub.sort(urut),
          });
        }
        continue;
      }
    }
    hasil.push({
      bidang,
      masalah: judulMasalah(kegiatan, denganNegara ? negara : null, rs),
      records: rs.sort(urut),
    });
  }

  const o = (b: string) => {
    const i = cfg.urutanBidang.indexOf(b);
    return i < 0 ? 999 : i;
  };

  return hasil.sort((a, b) => o(a.bidang) - o(b.bidang) || a.masalah.localeCompare(b.masalah, 'id'));
}
