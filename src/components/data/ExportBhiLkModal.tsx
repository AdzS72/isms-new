import React, { useState, useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  X,
  FileText,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Layers,
  Shield,
  UserCheck,
  Building,
  RotateCcw,
  BookOpen,
  FileCheck,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  buatBhi,
  buatLk,
  buatBhiNumberMap,
  unduhBlob,
  CONFIG_BAWAAN,
  ExportConfig,
  Penandatangan,
  Zona,
  nomorBhi,
  susunUraian,
  labelSumber,
  bagianZona,
  kelompokkanLk,
  getIsDemo,
  getCreatedAt,
  getIsuUtama,
  getSumberUrl,
  getTokoh,
  teksSemuaKapital,
  BULAN,
  STRATEGIC_COMPONENTS_9,
} from '../../export';
import { IntelRecord } from '../../export/types';
import { getCountriesByContinent } from '../../constants/countries';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ExportBhiLkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecords: any[];
  selectedRecords?: any[];
}

const exportBlobCache = new Map<string, Blob>();
const MAX_CACHED_EXPORTS = 4;

function exportCacheKey(
  type: 'BHI' | 'LK',
  records: IntelRecord[],
  signer: Penandatangan,
  config: ExportConfig,
  bhiNumberMap: Map<string, number>
): string {
  const recordNumbers = records.map((record) => [
    record.id,
    nomorBhi(record, undefined, bhiNumberMap),
  ]);
  return JSON.stringify([
    type,
    new Date().toISOString().slice(0, 10),
    records,
    recordNumbers,
    signer,
    config,
  ]);
}

function getCachedExport(key: string): Blob | undefined {
  const blob = exportBlobCache.get(key);
  if (blob) {
    exportBlobCache.delete(key);
    exportBlobCache.set(key, blob);
  }
  return blob;
}

function cacheExport(key: string, blob: Blob): void {
  exportBlobCache.delete(key);
  exportBlobCache.set(key, blob);
  while (exportBlobCache.size > MAX_CACHED_EXPORTS) {
    const oldestKey = exportBlobCache.keys().next().value;
    if (oldestKey === undefined) break;
    exportBlobCache.delete(oldestKey);
  }
}

export const ExportBhiLkModal: React.FC<ExportBhiLkModalProps> = ({
  isOpen,
  onClose,
  initialRecords,
  selectedRecords = [],
}) => {
  const { records: allDbRecords, currentUser, masterConfig } = useIntelligence();

  // Mode Sumber Data: 'filtered' (dari tabel saat ini) | 'selected' (centangan checkbox) | 'custom' (filter mandiri) | 'all' (seluruh database)
  const [dataScope, setDataScope] = useState<'filtered' | 'selected' | 'custom' | 'all'>(
    selectedRecords.length > 0 ? 'selected' : 'filtered'
  );

  // Form Penandatangan & KOP State (Revisi 3: Input nama KOP di atas garis)
  const defaultNama = currentUser?.name || 'Letda Lek Gutri Rahmad Zuwa';
  const defaultPangkat =
    currentUser?.role === 'admin'
      ? 'Mayor Lek NRP 538920 / Nosis 101'
      : currentUser?.role === 'pimpinan'
      ? 'Kolonel Inf NRP 492011 / Nosis 002'
      : 'Letda Lek NRP 542109 / Nosis 304';

  const [namaKopBaris1, setNamaKopBaris1] = useState('SATGAS WASKITA 25');
  const [namaKopBaris2, setNamaKopBaris2] = useState('');
  const namaKop = [namaKopBaris1.trim(), namaKopBaris2.trim()].filter(Boolean).join('\n');
  const [namaPenandatangan, setNamaPenandatangan] = useState(defaultNama);
  const [pangkatPenandatangan, setPangkatPenandatangan] = useState(defaultPangkat);
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState('');
  const [kotaPenandatangan, setKotaPenandatangan] = useState('');

  // Bulan & Tahun penandatanganan default
  const today = new Date();
  const defaultBulanTahun = `${BULAN[today.getMonth()]} ${today.getFullYear()}`;
  const [bulanTahunPenandatangan, setBulanTahunPenandatangan] = useState(defaultBulanTahun);

  // Konfigurasi Tambahan
  const [zona, setZona] = useState<Zona>('WIB');
  const [jamKejadian, setJamKejadian] = useState<'jam-input' | 'strip'>('jam-input');
  const [profilBhi, setProfilBhi] = useState<ExportConfig['profilBhi']>(CONFIG_BAWAAN.profilBhi);
  const [pengelompokanLk, setPengelompokanLk] = useState<'bidang+kegiatan+negara' | 'bidang+kegiatan'>('bidang+kegiatan+negara');
  const [excludeDemo, setExcludeDemo] = useState(true);

  // Filter Kustom Khusus Ekspor (Revisi 7: Tambahkan negara, Revisi 8: 9 Komponen Strategis)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedBenua, setSelectedBenua] = useState<string[]>([]);
  const [selectedNegara, setSelectedNegara] = useState<string[]>([]);
  const [selectedBidang, setSelectedBidang] = useState<string[]>([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState<string[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // State Eksekusi & Feedback
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'ringkasan' | 'lk-kelompok' | 'bhi-preview'>('ringkasan');

  // Master options
  const availableContinents = useMemo(() => {
    return masterConfig?.continents || ['Amerika', 'Eropa', 'Asia', 'Afrika', 'Australia & Pasifik', 'Timur Tengah', 'Global / Multilateral'];
  }, [masterConfig?.continents]);

  // Revisi 8: 9 Komponen Strategis
  const strategicComponents = STRATEGIC_COMPONENTS_9;

  // Revisi 7: Daftar Negara Dinamis (berdasarkan Kawasan/Benua terpilih & database)
  const availableCountryOptions = useMemo(() => {
    if (!isOpen) return [];
    const set = new Set<string>();
    const baseList = getCountriesByContinent(
      selectedBenua.length > 0 ? selectedBenua : undefined,
      masterConfig?.countries
    );
    baseList.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    allDbRecords.forEach((r) => {
      if (r?.negara) {
        if (selectedBenua.length === 0 || selectedBenua.includes(r.benua)) {
          set.add(r.negara);
        }
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [isOpen, selectedBenua, masterConfig?.countries, allDbRecords]);

  const availableKegiatanList = useMemo(() => {
    if (!isOpen) return [];
    const set = new Set<string>();
    (masterConfig?.kegiatanTemplates || []).forEach((k) => set.add(k));
    allDbRecords.forEach((r) => {
      if (r?.kegiatan) set.add(r.kegiatan);
    });
    return Array.from(set).sort();
  }, [isOpen, masterConfig?.kegiatanTemplates, allDbRecords]);

  // Evaluasi Data Terpilih berdasarkan Scope & Filter
  const finalRecordsToExport: IntelRecord[] = useMemo(() => {
    if (!isOpen) return [];
    let source: any[] = [];

    if (dataScope === 'selected' && selectedRecords.length > 0) {
      source = selectedRecords;
    } else if (dataScope === 'filtered') {
      source = initialRecords;
    } else {
      source = allDbRecords;
    }

    return source.filter((r) => {
      if (!r) return false;

      // 1. Filter Demo
      if (excludeDemo && getIsDemo(r)) {
        return false;
      }

      // 2. Jika dalam mode custom atau filter aktif
      if (dataScope === 'custom') {
        if (startDate && r.tanggal < startDate) return false;
        if (endDate && r.tanggal > endDate) return false;

        if (selectedBenua.length > 0) {
          const rBenua = (r.benua || '').toLowerCase();
          const matchBenua = selectedBenua.some((b) => b.toLowerCase() === rBenua);
          if (!matchBenua) return false;
        }

        // Revisi 7: Filter Negara
        if (selectedNegara.length > 0) {
          const rNegara = (r.negara || '').toLowerCase();
          const matchNegara = selectedNegara.some((n) => n.toLowerCase() === rNegara);
          if (!matchNegara) return false;
        }

        // Revisi 8: Filter 9 Komponen Strategis
        if (selectedBidang.length > 0) {
          const rBidang = (r.bidang || '').toLowerCase();
          const matchBidang = selectedBidang.some((b) => b.toLowerCase() === rBidang);
          if (!matchBidang) return false;
        }

        if (selectedKegiatan.length > 0 && !selectedKegiatan.includes(r.kegiatan)) {
          return false;
        }
      }

      return true;
    });
  }, [
    isOpen,
    dataScope,
    selectedRecords,
    initialRecords,
    allDbRecords,
    excludeDemo,
    startDate,
    endDate,
    selectedBenua,
    selectedNegara,
    selectedBidang,
    selectedKegiatan,
  ]);

  const allRecordBhiNumberMap = useMemo(
    () => (isOpen ? buatBhiNumberMap(allDbRecords) : new Map<string, number>()),
    [isOpen, allDbRecords]
  );

  // Filtered exports normally use the all-record map; rebuild only when the view supplies records outside it.
  const bhiNumberMap = useMemo(() => {
    if (!isOpen) return allRecordBhiNumberMap;
    const hasUnknownRecords = finalRecordsToExport.some(
      (record) => !allRecordBhiNumberMap.has(record.id)
    );
    if (!hasUnknownRecords) return allRecordBhiNumberMap;

    const recordsById = new Map<string, IntelRecord>();
    allDbRecords.forEach((record) => recordsById.set(record.id, record));
    finalRecordsToExport.forEach((record) => {
      if (!recordsById.has(record.id)) recordsById.set(record.id, record);
    });
    return buatBhiNumberMap(Array.from(recordsById.values()));
  }, [isOpen, allRecordBhiNumberMap, allDbRecords, finalRecordsToExport]);

  const bhiNumberRange = useMemo(() => {
    if (!isOpen || finalRecordsToExport.length === 0) return '-';
    let min = Infinity;
    let max = -Infinity;
    for (const record of finalRecordsToExport) {
      const number = nomorBhi(record, undefined, bhiNumberMap);
      min = Math.min(min, number);
      max = Math.max(max, number);
    }
    return `${min} - ${max}`;
  }, [isOpen, finalRecordsToExport, bhiNumberMap]);

  // Konfigurasi Export Terpadu
  const currentExportConfig: ExportConfig = useMemo(() => {
    return {
      ...CONFIG_BAWAAN,
      zona,
      jamKejadian,
      profilBhi,
      pengelompokanLk,
      urutanBidang: [...strategicComponents],
      namaKop: namaKop || undefined,
    };
  }, [zona, jamKejadian, profilBhi, pengelompokanLk, strategicComponents, namaKop]);

  // Kelompok LK dari data yang akan diekspor
  const groupingConfig = useMemo(
    () => ({ ...CONFIG_BAWAAN, pengelompokanLk }),
    [pengelompokanLk]
  );

  const previewKelompokLk = useMemo(() => {
    if (finalRecordsToExport.length === 0) return [];
    return kelompokkanLk(finalRecordsToExport, groupingConfig);
  }, [finalRecordsToExport, groupingConfig]);

  // Audit Kualitas Teks
  const qualityAudit = useMemo(() => {
    if (!isOpen) return { emptySources: 0, allCapsUraian: 0 };
    let emptySources = 0;
    let allCapsUraian = 0;

    finalRecordsToExport.forEach((r) => {
      if (teksSemuaKapital(getIsuUtama(r))) allCapsUraian++;
      if (!getSumberUrl(r)) emptySources++;
    });

    return { emptySources, allCapsUraian };
  }, [isOpen, finalRecordsToExport]);

  // Rentang Tanggal Aktual dari Data Terpilih
  const actualDateRange = useMemo(() => {
    if (!isOpen || finalRecordsToExport.length === 0) return { min: '-', max: '-' };
    let min = finalRecordsToExport[0].tanggal;
    let max = finalRecordsToExport[0].tanggal;
    finalRecordsToExport.forEach((r) => {
      if (r.tanggal < min) min = r.tanggal;
      if (r.tanggal > max) max = r.tanggal;
    });
    return {
      min: format(parseISO(min), 'dd MMM yyyy', { locale: idLocale }),
      max: format(parseISO(max), 'dd MMM yyyy', { locale: idLocale }),
    };
  }, [isOpen, finalRecordsToExport]);

  // Helper Preset Tanggal
  const applyDatePreset = (preset: '7d' | '30d' | '90d' | 'thisYear' | 'all') => {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];

    if (preset === '7d') {
      setStartDate(subDays(now, 7).toISOString().split('T')[0]);
      setEndDate(nowStr);
    } else if (preset === '30d') {
      setStartDate(subDays(now, 30).toISOString().split('T')[0]);
      setEndDate(nowStr);
    } else if (preset === '90d') {
      setStartDate(subDays(now, 90).toISOString().split('T')[0]);
      setEndDate(nowStr);
    } else if (preset === 'thisYear') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(nowStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Validasi Form sebelum Unduh
  const validateSigner = (): boolean => {
    if (!namaPenandatangan.trim() || !pangkatPenandatangan.trim()) {
      setErrorMessage('Nama pejabat penandatangan dan pangkat/NRP/Nosis wajib diisi.');
      return false;
    }
    if (finalRecordsToExport.length === 0) {
      setErrorMessage('Tidak ada data intelijen yang cocok untuk diekspor pada filter terpilih.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const updateExportProgress = (
    label: 'BHI' | 'LK',
    completed: number,
    total: number,
    stage: 'rows' | 'packing',
    offset = 0,
    scale = 1
  ) => {
    const stageProgress = stage === 'packing'
      ? 95
      : total > 0
      ? Math.round((completed / total) * 90)
      : 0;
    setExportProgress(Math.min(100, Math.round(offset + stageProgress * scale)));
    setExportStatus(
      stage === 'packing'
        ? `Menyimpan dokumen ${label}...`
        : `Menyusun ${label} ${completed.toLocaleString('id-ID')}/${total.toLocaleString('id-ID')}`
    );
  };

  // Eksekusi Ekspor BHI
  const handleExportBhi = async () => {
    if (!validateSigner()) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Menyiapkan dokumen BHI...');
    setErrorMessage(null);
    setExportSuccessMessage(null);

    try {
      const penandatangan: Penandatangan = {
        namaKop: namaKop || undefined,
        nama: namaPenandatangan.trim(),
        pangkat: pangkatPenandatangan.trim(),
        jabatan: jabatanPenandatangan.trim() || undefined,
        kota: kotaPenandatangan.trim() || undefined,
        bulanTahun: bulanTahunPenandatangan.trim() || undefined,
        tajuk: [
          kotaPenandatangan.trim()
            ? `${kotaPenandatangan.trim()},     ${bulanTahunPenandatangan.trim()}`
            : bulanTahunPenandatangan.trim(),
          jabatanPenandatangan.trim(),
        ].filter(Boolean),
      };

      const key = exportCacheKey(
        'BHI',
        finalRecordsToExport,
        penandatangan,
        currentExportConfig,
        bhiNumberMap
      );
      let blob = getCachedExport(key);
      if (!blob) {
        blob = await buatBhi(
          finalRecordsToExport,
          penandatangan,
          currentExportConfig,
          bhiNumberMap,
          (completed, total, stage) => updateExportProgress('BHI', completed, total, stage)
        );
        cacheExport(key, blob);
      } else {
        setExportProgress(100);
        setExportStatus('Menggunakan dokumen BHI dari cache...');
      }
      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      const filename = `BHI_Buku_Harian_Intelijen_${dateStr}.docx`;

      unduhBlob(blob, filename);
      setExportSuccessMessage(`Dokumen Buku Harian Intelijen (${filename}) berhasil dibuat dan diunduh.`);
    } catch (err: any) {
      console.error('BHI Export Error:', err);
      setErrorMessage(`Gagal membuat dokumen BHI: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsExporting(false);
      setExportStatus('');
      setExportProgress(0);
    }
  };

  // Eksekusi Ekspor LK
  const handleExportLk = async () => {
    if (!validateSigner()) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Menyiapkan dokumen LK...');
    setErrorMessage(null);
    setExportSuccessMessage(null);

    try {
      const penandatangan: Penandatangan = {
        namaKop: namaKop || undefined,
        nama: namaPenandatangan.trim(),
        pangkat: pangkatPenandatangan.trim(),
        jabatan: jabatanPenandatangan.trim() || undefined,
        kota: kotaPenandatangan.trim() || undefined,
        bulanTahun: bulanTahunPenandatangan.trim() || undefined,
      };

      const key = exportCacheKey(
        'LK',
        finalRecordsToExport,
        penandatangan,
        currentExportConfig,
        bhiNumberMap
      );
      let blob = getCachedExport(key);
      if (!blob) {
        blob = await buatLk(
          finalRecordsToExport,
          penandatangan,
          currentExportConfig,
          bhiNumberMap,
          (completed, total, stage) => updateExportProgress('LK', completed, total, stage),
          previewKelompokLk
        );
        cacheExport(key, blob);
      } else {
        setExportProgress(100);
        setExportStatus('Menggunakan dokumen LK dari cache...');
      }
      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      const filename = `LK_Lembaran_Kerja_${previewKelompokLk.length}_Kelompok_${dateStr}.docx`;

      unduhBlob(blob, filename);
      setExportSuccessMessage(`Dokumen Lembaran Kerja (${filename}) berhasil dibuat dan diunduh.`);
    } catch (err: any) {
      console.error('LK Export Error:', err);
      setErrorMessage(`Gagal membuat dokumen LK: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsExporting(false);
      setExportStatus('');
      setExportProgress(0);
    }
  };

  // Eksekusi Ekspor Keduanya
  const handleExportBoth = async () => {
    if (!validateSigner()) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Menyiapkan dokumen BHI...');
    setErrorMessage(null);
    setExportSuccessMessage(null);

    try {
      const penandatangan: Penandatangan = {
        namaKop: namaKop || undefined,
        nama: namaPenandatangan.trim(),
        pangkat: pangkatPenandatangan.trim(),
        jabatan: jabatanPenandatangan.trim() || undefined,
        kota: kotaPenandatangan.trim() || undefined,
        bulanTahun: bulanTahunPenandatangan.trim() || undefined,
      };

      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');

      // 1. Ekspor BHI
      const penandatanganBhi: Penandatangan = {
        ...penandatangan,
        tajuk: [
          kotaPenandatangan.trim()
            ? `${kotaPenandatangan.trim()},     ${bulanTahunPenandatangan.trim()}`
            : bulanTahunPenandatangan.trim(),
          jabatanPenandatangan.trim(),
        ].filter(Boolean),
      };
      const bhiKey = exportCacheKey(
        'BHI',
        finalRecordsToExport,
        penandatanganBhi,
        currentExportConfig,
        bhiNumberMap
      );
      let bhiBlob = getCachedExport(bhiKey);
      if (!bhiBlob) {
        bhiBlob = await buatBhi(
          finalRecordsToExport,
          penandatanganBhi,
          currentExportConfig,
          bhiNumberMap,
          (completed, total, stage) => updateExportProgress('BHI', completed, total, stage, 0, 0.5)
        );
        cacheExport(bhiKey, bhiBlob);
      } else {
        setExportProgress(50);
        setExportStatus('Menggunakan dokumen BHI dari cache...');
      }
      unduhBlob(bhiBlob, `BHI_Buku_Harian_Intelijen_${dateStr}.docx`);
      setExportStatus('Menyiapkan dokumen LK...');

      // 2. Ekspor LK dengan jeda singkat agar browser tidak memblokir multi-download
      setTimeout(async () => {
        try {
          const lkKey = exportCacheKey(
            'LK',
            finalRecordsToExport,
            penandatangan,
            currentExportConfig,
            bhiNumberMap
          );
          let lkBlob = getCachedExport(lkKey);
          if (!lkBlob) {
            lkBlob = await buatLk(
              finalRecordsToExport,
              penandatangan,
              currentExportConfig,
              bhiNumberMap,
              (completed, total, stage) =>
                updateExportProgress('LK', completed, total, stage, 50, 0.5),
              previewKelompokLk
            );
            cacheExport(lkKey, lkBlob);
          } else {
            setExportProgress(100);
            setExportStatus('Menggunakan dokumen LK dari cache...');
          }
          unduhBlob(lkBlob, `LK_Lembaran_Kerja_${previewKelompokLk.length}_Kelompok_${dateStr}.docx`);
          setExportSuccessMessage('Kedua dokumen (BHI & LK) berhasil dibuat dan diunduh secara berurutan.');
          setIsExporting(false);
          setExportStatus('');
          setExportProgress(0);
        } catch (lkErr: any) {
          setErrorMessage(`Gagal membuat LK: ${lkErr.message}`);
          setIsExporting(false);
          setExportStatus('');
          setExportProgress(0);
        }
      }, 700);
    } catch (err: any) {
      console.error('Both Export Error:', err);
      setErrorMessage(`Gagal memproses ekspor: ${err.message || 'Terjadi kesalahan sistem'}`);
      setIsExporting(false);
      setExportStatus('');
      setExportProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850 text-white px-6 py-4 flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <FileCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Ekspor Dokumen Intelijen Strategis: BHI & LK
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-semibold">
                  DOCX FORMAT
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Buku Harian Intelijen (BHI) & Lembaran Kerja (LK) Terstandarisasi Satgas Waskita
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-navy-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scrollable Layout */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {exportSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{exportSuccessMessage}</span>
            </div>
          )}

          {/* Section 1: Pilihan Sumber Data & Cakupan */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                1. Pilih Sumber & Cakupan Data yang Diekspor
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={excludeDemo}
                    onChange={(e) => setExcludeDemo(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Keluarkan Data Demo (is_demo = true)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDataScope('filtered')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dataScope === 'filtered'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Filter Tabel Aktif</div>
                <div className={`text-[11px] mt-0.5 ${dataScope === 'filtered' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {initialRecords.length} rekaman di tabel
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDataScope('selected')}
                disabled={selectedRecords.length === 0}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRecords.length === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                    : dataScope === 'selected'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold cursor-pointer'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="font-bold text-xs">Data Tercentang</div>
                <div className={`text-[11px] mt-0.5 ${dataScope === 'selected' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {selectedRecords.length} rekaman dipilih
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDataScope('custom');
                  setIsFilterPanelOpen(true);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dataScope === 'custom'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Filter Khusus</span>
                  {dataScope === 'custom' && <span className="text-[10px] bg-blue-700 px-1.5 py-0.2 rounded">Kustom</span>}
                </div>
                <div className={`text-[11px] mt-0.5 ${dataScope === 'custom' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Sesuaikan rentang/bidang/negara
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDataScope('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dataScope === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Semua Data Basis</div>
                <div className={`text-[11px] mt-0.5 ${dataScope === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {allDbRecords.length} total rekaman
                </div>
              </button>
            </div>

            {/* Panel Filter Kustom yang dapat Dilipat / Dibuka */}
            {dataScope === 'custom' && (
              <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Penyesuaian Parameter Filter Dokumen:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyDatePreset('7d')}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('30d')}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      30 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('thisYear')}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      Tahun Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('all')}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      Semua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Dari Tanggal:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Sampai Tanggal:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Kawasan / Benua:</label>
                    <select
                      value={selectedBenua[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBenua(val ? [val] : []);
                        setSelectedNegara([]); // Reset negara saat benua berubah
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Semua Kawasan</option>
                      {availableContinents.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Revisi 7: Filter Negara */}
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Negara:</label>
                    <select
                      value={selectedNegara[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedNegara(val ? [val] : []);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Semua Negara ({availableCountryOptions.length})</option>
                      {availableCountryOptions.map((countryName) => (
                        <option key={countryName} value={countryName}>
                          {countryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Revisi 8: List Bidang 9 Komponen Strategis */}
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Komponen / Bidang (9 Komponen):</label>
                    <select
                      value={selectedBidang[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBidang(val ? [val] : []);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Semua Komponen</option>
                      {strategicComponents.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Ringkasan & Status Data Terpilih */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-blue-700 font-medium">Total Baris BHI</span>
              <div className="text-xl font-bold font-mono text-blue-900 mt-0.5">
                {finalRecordsToExport.length}
              </div>
              <span className="text-[10px] text-blue-600">nomor BHI {bhiNumberRange}</span>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-indigo-700 font-medium">Jumlah Kelompok LK</span>
              <div className="text-xl font-bold font-mono text-indigo-900 mt-0.5">
                {previewKelompokLk.length}
              </div>
              <span className="text-[10px] text-indigo-600">tabel lembaran kerja</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-emerald-700 font-medium">Rentang Waktu Data</span>
              <div className="text-xs font-bold text-emerald-900 mt-1 truncate">
                {actualDateRange.min}
              </div>
              <span className="text-[10px] text-emerald-600 truncate block">s.d. {actualDateRange.max}</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-amber-700 font-medium">Pemeriksaan Audit</span>
              <div className="text-xs font-semibold text-amber-900 mt-1">
                {qualityAudit.emptySources} sumber kosong
              </div>
              <span className="text-[10px] text-amber-700">
                {qualityAudit.allCapsUraian > 0 ? `${qualityAudit.allCapsUraian} teks huruf kapital` : 'Format uraian EYD bersih'}
              </span>
            </div>
          </div>

          {/* Section 3: Formulir Pejabat Penandatangan & KOP (Wajib) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                2. Data Kop Surat & Pejabat Penandatangan Dokumen
              </h4>
              <span className="text-[10px] text-slate-400 italic">
                Format Resmi Satgas Waskita
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Revisi 3: Input Nama KOP (di atas garis kiri atas) */}
              <div className="sm:col-span-2 md:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Nama KOP - Baris 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SATGAS WASKITA 25"
                      value={namaKopBaris1}
                      onChange={(e) => setNamaKopBaris1(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold tracking-wider text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Nama KOP - Baris 2
                    </label>
                    <input
                      type="text"
                      placeholder="Baris kedua KOP"
                      value={namaKopBaris2}
                      onChange={(e) => setNamaKopBaris2(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold tracking-wider text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Kedua baris ditampilkan di atas garis horizontal kiri atas; baris kedua opsional.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Nama Pejabat Penandatangan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Letda Lek Gutri Rahmad Zuwa"
                  value={namaPenandatangan}
                  onChange={(e) => setNamaPenandatangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Pangkat / NRP / Nosis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Letda Lek NRP 542109 / Nosis 304"
                  value={pangkatPenandatangan}
                  onChange={(e) => setPangkatPenandatangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Nama Jabatan Penandatangan
                </label>
                <input
                  type="text"
                  placeholder="Dansatgas Waskita 25,"
                  value={jabatanPenandatangan}
                  onChange={(e) => setJabatanPenandatangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Kota Penandatanganan
                </label>
                <input
                  type="text"
                  placeholder="Bogor"
                  value={kotaPenandatangan}
                  onChange={(e) => setKotaPenandatangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Bulan & Tahun (Contoh: "November 2026")
                </label>
                <input
                  type="text"
                  placeholder="November 2026"
                  value={bulanTahunPenandatangan}
                  onChange={(e) => setBulanTahunPenandatangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Hari sengaja dikosongkan (format resmi)</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Zona Waktu Tampilan Jam
                </label>
                <select
                  value={zona}
                  onChange={(e) => setZona(e.target.value as Zona)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
                >
                  <option value="WIB">WIB (Waktu Indonesia Barat - UTC+7)</option>
                  <option value="WITA">WITA (Waktu Indonesia Tengah - UTC+8)</option>
                  <option value="WIT">WIT (Waktu Indonesia Timur - UTC+9)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Pengaturan Format Spesifik & Aturan Masalah */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              3. Parameter Standardisasi Intelijen
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Metode Pengelompokan LK:</label>
                <select
                  value={pengelompokanLk}
                  onChange={(e) => setPengelompokanLk(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="bidang+kegiatan+negara">Bidang + Kegiatan + Negara (Direkomendasikan)</option>
                  <option value="bidang+kegiatan">Bidang + Kegiatan (Cakupan Lebih Luas)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Profil Format BHI:</label>
                <select
                  value={profilBhi}
                  onChange={(e) => setProfilBhi(e.target.value as ExportConfig['profilBhi'])}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="standar">Standar (11 pt)</option>
                  <option value="ringkas">Ringkas (9 pt, untuk data besar)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">WAKTU / JAM Kejadian BHI:</label>
                <select
                  value={jamKejadian}
                  onChange={(e) => setJamKejadian(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="jam-input">Gunakan Jam Input Sistem (created_at)</option>
                  <option value="strip">Tanda Strip (-)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Nilai, Sumber & Keterangan:</label>
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 font-mono">
                  SUMBER: <strong className="text-slate-900">OSINT</strong> | NILAI: <strong className="text-slate-900">A-2</strong> | KET: <strong className="text-slate-900">Dimonitor</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Tab Pratinjau Kelompok LK & Preview BHI */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/80 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTabPreview('ringkasan')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTabPreview === 'ringkasan' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pratinjau Kelompok LK ({previewKelompokLk.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabPreview('bhi-preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTabPreview === 'bhi-preview' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pratinjau 5 Baris Pertama BHI
                </button>
              </div>
              <span className="text-[11px] text-slate-500">
                Format Resmi Word A4 Lanskap • Header/Footer RAHASIA
              </span>
            </div>

            <div className="p-4 max-h-56 overflow-y-auto">
              {activeTabPreview === 'ringkasan' ? (
                previewKelompokLk.length > 0 ? (
                  <div className="space-y-2">
                    {previewKelompokLk.map((k, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="font-bold text-slate-900 mr-2">{idx + 1}.</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px] mr-2">
                            {k.bidang}
                          </span>
                          <span className="font-medium text-slate-800">{k.masalah}</span>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-slate-500">{k.records.length} rekaman</span>
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]">
                            BHI: {k.records.map((r) => nomorBhi(r, undefined, bhiNumberMap)).slice(0, 3).join(', ')}
                            {k.records.length > 3 && '...'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    Tidak ada data yang memenuhi kriteria filter ekspor.
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {finalRecordsToExport.slice(0, 5).map((r, i) => {
                    const u = susunUraian(getIsuUtama(r), r.tanggal, 'bhi', currentExportConfig, r.negara, getTokoh(r), true);
                    const s = labelSumber(getSumberUrl(r));
                    const tz = bagianZona(getCreatedAt(r), zona);

                    return (
                      <div key={r.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-bold text-blue-700">No BHI: {nomorBhi(r, i + 1, bhiNumberMap)}</span>
                          <span className="text-slate-500">Terima: {tz.tanggal} ({tz.jam})</span>
                        </div>
                        <div className="text-slate-800 line-clamp-2">
                          <strong>Uraian:</strong> {u.teks}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-3">
                          <span>Sumber: <strong>{s}</strong></span>
                          <span>Negara: {r.negara}</span>
                          <span>Bidang: {r.bidang}</span>
                        </div>
                      </div>
                    );
                  })}
                  {finalRecordsToExport.length > 5 && (
                    <div className="text-center text-[11px] text-slate-400 py-1">
                      ... dan {finalRecordsToExport.length - 5} baris lainnya akan disertakan dalam dokumen.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          {isExporting && (
            <div className="mb-4" role="status" aria-live="polite">
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
                <span>{exportStatus}</span>
                <span>{exportProgress}%</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label="Progress ekspor BHI dan LK"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={exportProgress}
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Dokumen dihasilkan secara client-side murni tanpa transmisi keluar.</span>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {/* Tombol Ekspor BHI */}
              <button
                type="button"
                onClick={handleExportBhi}
                disabled={isExporting || finalRecordsToExport.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{isExporting && exportStatus.includes('BHI') ? exportStatus : 'Ekspor BHI (.docx)'}</span>
              </button>

              {/* Tombol Ekspor LK */}
              <button
                type="button"
                onClick={handleExportLk}
                disabled={isExporting || finalRecordsToExport.length === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isExporting && exportStatus.includes('LK') ? exportStatus : 'Ekspor LK (.docx)'}</span>
              </button>

              {/* Tombol Ekspor Keduanya */}
              <button
                type="button"
                onClick={handleExportBoth}
                disabled={isExporting || finalRecordsToExport.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? exportStatus || 'Memproses Dokumen...' : 'Ekspor Keduanya (BHI & LK)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
