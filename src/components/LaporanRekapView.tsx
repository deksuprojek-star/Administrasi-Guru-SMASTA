/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  School,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
  Filter,
  BarChart3,
  CalendarDays,
  Loader2,
  FileDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  GuruProfile,
  UserAccount,
  Kelas,
  Siswa,
  AbsensiRecord,
  JurnalMengajar,
  PenilaianRecord,
  BimbinganSiswa,
  KonfigurasiSekolah,
} from '../types';
import { apiService } from '../services/apiService';

interface LaporanRekapViewProps {
  guruProfile: GuruProfile | null;
  currentUser?: UserAccount | null;
  config?: KonfigurasiSekolah | null;
}

const BULAN_NAMES = [
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
];

export const LaporanRekapView: React.FC<LaporanRekapViewProps> = ({
  guruProfile,
  currentUser,
  config: propConfig,
}) => {
  const [reportType, setReportType] = useState<
    'absensi_bulanan' | 'absensi_semester' | 'absensi_ringkas' | 'nilai' | 'jurnal' | 'bimbingan'
  >('absensi_bulanan');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [config, setConfig] = useState<KonfigurasiSekolah | null>(propConfig || null);

  // Filter Absensi
  const [selectedBulan, setSelectedBulan] = useState<string>('08');
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Raw data
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [penilaianList, setPenilaianList] = useState<PenilaianRecord[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalMengajar[]>([]);
  const [bimbinganList, setBimbinganList] = useState<BimbinganSiswa[]>([]);

  const [teacherFilterInfo, setTeacherFilterInfo] = useState<{
    isFiltered: boolean;
    totalAllClasses: number;
  }>({ isFiltered: false, totalAllClasses: 0 });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMaster();
    const handleDataChanged = () => {
      loadMaster();
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, [currentUser, guruProfile]);

  const loadMaster = async () => {
    const [teacherClassData, s, a, p, j, b, cfg] = await Promise.all([
      apiService.getTeacherTaughtClasses(),
      apiService.getSiswaList(),
      apiService.getAbsensiList(),
      apiService.getPenilaianList(),
      apiService.getJurnalList(),
      apiService.getBimbinganList(),
      apiService.getConfig(),
    ]);

    const availableClasses = teacherClassData.classes;
    setTeacherFilterInfo({
      isFiltered: teacherClassData.isFiltered,
      totalAllClasses: teacherClassData.totalAllClasses,
    });

    setKelasList(availableClasses);
    setSiswaList(s);
    setAbsensiList(a);
    setPenilaianList(p);
    setJurnalList(j);
    setBimbinganList(b);
    if (!config && cfg) setConfig(cfg);
    if (availableClasses.length > 0) setSelectedKelasId(availableClasses[0].kelas_id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const isLandscape =
        reportType === 'absensi_bulanan' || reportType === 'absensi_semester' || reportType === 'absensi_ringkas';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      let heightLeft = printHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - printHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const activeKelasName = activeKelasObj?.nama_kelas || selectedKelasId || 'Umum';
      const cleanClassName = activeKelasName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const timeStamp = new Date().toISOString().slice(0, 10);
      const fileName = `Laporan_${reportType}_Kelas_${cleanClassName}_${timeStamp}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Gagal membuat PDF otomatis:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const activeKelasObj = kelasList.find((k) => k.kelas_id === selectedKelasId);
  const classStudents = siswaList.filter((s) => s.kelas_id === selectedKelasId);

  // Helper untuk filter absensi bulanan
  const getFilteredAbsensiBulanan = () => {
    return absensiList.filter((a) => {
      if (a.kelas_id !== selectedKelasId) return false;
      const d = new Date(a.tanggal);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = String(d.getFullYear());
      return m === selectedBulan && y === selectedTahun;
    });
  };

  // Daftar tanggal aktif dalam bulan yang dipilih
  const monthlyDates: string[] = Array.from(
    new Set(
      getFilteredAbsensiBulanan()
        .map((a) => a.tanggal)
        .sort()
    )
  );

  // Helper untuk filter semester
  // Ganjil: Bulan 07, 08, 09, 10, 11, 12
  // Genap: Bulan 01, 02, 03, 04, 05, 06
  const getSemesterMonths = () => {
    if (selectedSemester === 'Ganjil') {
      return [
        { code: '07', name: 'Juli' },
        { code: '08', name: 'Agustus' },
        { code: '09', name: 'September' },
        { code: '10', name: 'Oktober' },
        { code: '11', name: 'November' },
        { code: '12', name: 'Desember' },
      ];
    }
    return [
      { code: '01', name: 'Januari' },
      { code: '02', name: 'Februari' },
      { code: '03', name: 'Maret' },
      { code: '04', name: 'April' },
      { code: '05', name: 'Mei' },
      { code: '06', name: 'Juni' },
    ];
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const activeKelas = activeKelasObj?.nama_kelas || selectedKelasId;

    if (reportType === 'absensi_bulanan') {
      csvContent += `Rekap Absensi Bulanan - Bulan ${selectedBulan}/${selectedTahun} - Kelas ${activeKelas}\n`;
      csvContent += 'No,NIS,Nama Lengkap Siswa,L/P,Hadir,Sakit,Izin,Alpha,Dispensasi,Persentase (Hadir+Dispen)\n';
      classStudents.forEach((st, idx) => {
        const studentAbs = getFilteredAbsensiBulanan().filter((a) => a.siswa_id === st.siswa_id);
        const h = studentAbs.filter((a) => a.status === 'Hadir').length;
        const s = studentAbs.filter((a) => a.status === 'Sakit').length;
        const i = studentAbs.filter((a) => a.status === 'Izin').length;
        const a = studentAbs.filter((a) => a.status === 'Alpha').length;
        const d = studentAbs.filter((a) => a.status === 'Dispensasi').length;
        const total = studentAbs.length || 1;
        const rate = Math.round(((h + d) / total) * 100);
        csvContent += `${idx + 1},${st.nis},"${st.nama_lengkap}",${st.jenis_kelamin},${h},${s},${i},${a},${d},${rate}%\n`;
      });
    } else if (reportType === 'absensi_semester') {
      csvContent += `Rekap Absensi Semester ${selectedSemester} - Kelas ${activeKelas}\n`;
      csvContent += 'No,NIS,Nama Lengkap Siswa,L/P,Hadir,Sakit,Izin,Alpha,Dispensasi,Total Pertemuan,Persentase (Hadir+Dispen)\n';
      classStudents.forEach((st, idx) => {
        const studentAbs = absensiList.filter((a) => {
          if (a.siswa_id !== st.siswa_id || a.kelas_id !== selectedKelasId) return false;
          const month = String(new Date(a.tanggal).getMonth() + 1).padStart(2, '0');
          const semMonths = getSemesterMonths().map((m) => m.code);
          return semMonths.includes(month);
        });
        const h = studentAbs.filter((a) => a.status === 'Hadir').length;
        const s = studentAbs.filter((a) => a.status === 'Sakit').length;
        const i = studentAbs.filter((a) => a.status === 'Izin').length;
        const a = studentAbs.filter((a) => a.status === 'Alpha').length;
        const d = studentAbs.filter((a) => a.status === 'Dispensasi').length;
        const total = studentAbs.length || 1;
        const rate = Math.round(((h + d) / total) * 100);
        csvContent += `${idx + 1},${st.nis},"${st.nama_lengkap}",${st.jenis_kelamin},${h},${s},${i},${a},${d},${studentAbs.length},${rate}%\n`;
      });
    } else if (reportType === 'absensi_ringkas') {
      csvContent += 'No,NIS,Nama Siswa,Hadir,Sakit,Izin,Alpha,Dispensasi,Persentase (Hadir+Dispen)\n';
      classStudents.forEach((st, idx) => {
        const studentAbs = absensiList.filter((a) => a.siswa_id === st.siswa_id);
        const h = studentAbs.filter((a) => a.status === 'Hadir').length;
        const s = studentAbs.filter((a) => a.status === 'Sakit').length;
        const i = studentAbs.filter((a) => a.status === 'Izin').length;
        const a = studentAbs.filter((a) => a.status === 'Alpha').length;
        const d = studentAbs.filter((a) => a.status === 'Dispensasi').length;
        const total = studentAbs.length || 1;
        const rate = Math.round(((h + d) / total) * 100);
        csvContent += `${idx + 1},${st.nis},"${st.nama_lengkap}",${h},${s},${i},${a},${d},${rate}%\n`;
      });
    } else if (reportType === 'nilai') {
      csvContent += 'No,NIS,Nama Siswa,Tugas/KD,Jenis,Nilai,Status\n';
      const classScores = penilaianList.filter((p) => p.kelas_id === selectedKelasId);
      classScores.forEach((sc, idx) => {
        csvContent += `${idx + 1},${sc.nis},"${sc.nama_siswa}","${sc.nama_tugas_kd}",${sc.jenis_penilaian},${sc.nilai},${sc.keterangan}\n`;
      });
    } else if (reportType === 'jurnal') {
      csvContent += 'No,Tanggal,Kelas,Jam Ke,Materi Pokok PBM,Catatan PBM,Tindak Lanjut\n';
      const relevantJurnal = teacherFilterInfo.isFiltered
        ? jurnalList.filter((j) => kelasList.some((k) => k.kelas_id === j.kelas_id || k.nama_kelas === j.nama_kelas))
        : jurnalList;
      relevantJurnal.forEach((j, idx) => {
        csvContent += `${idx + 1},${j.tanggal},"${j.nama_kelas || j.kelas_id}","${j.jam_ke}","${j.materi_pembelajaran}","${j.catatan}","${j.rencana_tindak_lanjut}"\n`;
      });
    } else if (reportType === 'bimbingan') {
      csvContent += 'No,Tanggal,NIS,Nama Siswa,Kelas,Jenis Bimbingan,Masalah,Solusi\n';
      const relevantBimbingan = teacherFilterInfo.isFiltered
        ? bimbinganList.filter((b) => b.guru_id === currentUser?.guru_id || kelasList.some((k) => k.kelas_id === b.kelas_id || k.nama_kelas === b.nama_kelas))
        : bimbinganList;
      relevantBimbingan.forEach((b, idx) => {
        csvContent += `${idx + 1},${b.tanggal},${b.nis},"${b.nama_siswa}","${b.nama_kelas || b.kelas_id}","${b.jenis_bimbingan}","${b.masalah_observasi || ''}","${b.solusi_rekomendasi || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_${reportType}_Kelas_${activeKelas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMonthLabel = BULAN_NAMES.find((b) => b.value === selectedBulan)?.label || 'Agustus';

  const relevantJurnalList = teacherFilterInfo.isFiltered
    ? jurnalList.filter((j) => kelasList.some((k) => k.kelas_id === j.kelas_id || k.nama_kelas === j.nama_kelas))
    : jurnalList;

  const relevantBimbinganList = teacherFilterInfo.isFiltered
    ? bimbinganList.filter((b) => b.guru_id === currentUser?.guru_id || kelasList.some((k) => k.kelas_id === b.kelas_id || k.nama_kelas === b.nama_kelas))
    : bimbinganList;

  return (
    <div className="space-y-6">
      {/* Non-Printable Header & Controls */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Laporan & Rekapitulasi Administrasi Guru</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cetak rekapitulasi absensi bulanan, absensi semesteran, leger penilaian siswa, dan jurnal PBM resmi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              title="Download format CSV / Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleSavePDF}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Unduh langsung berkas dokumen PDF resmi"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Simpan PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Cetak melalui printer atau dialog browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          {/* Report Type Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
            {[
              { id: 'absensi_bulanan', label: '📅 Rekap Absensi Bulanan' },
              { id: 'absensi_semester', label: '📊 Rekap Absensi Semesteran' },
              { id: 'absensi_ringkas', label: '📋 Rekap Absensi Total' },
              { id: 'nilai', label: '🎓 Rekap Nilai Siswa' },
              { id: 'jurnal', label: '📖 Jurnal Mengajar PBM' },
              { id: 'bimbingan', label: '🤝 Rekap Bimbingan Siswa' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  reportType === tab.id
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Detailed Filters row */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
            {/* Kelas Selector */}
            {reportType.startsWith('absensi') || reportType === 'nilai' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">Pilih Kelas:</span>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                >
                  {kelasList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      Kelas {k.nama_kelas} ({k.jumlah_siswa || 0} Siswa)
                    </option>
                  ))}
                </select>
                {teacherFilterInfo.isFiltered && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                    Kelas Diampu ({kelasList.length} dari {teacherFilterInfo.totalAllClasses} Kelas)
                  </span>
                )}
              </div>
            ) : null}

            {/* Bulan Selector for Rekap Bulanan */}
            {reportType === 'absensi_bulanan' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Bulan:</span>
                  <select
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                  >
                    {BULAN_NAMES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Tahun:</span>
                  <select
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </>
            )}

            {/* Semester Selector for Rekap Semester */}
            {reportType === 'absensi_semester' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Semester:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="Ganjil">Semester Ganjil (Juli - Desember)</option>
                  <option value="Genap">Semester Genap (Januari - Juni)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FORMAL PRINTABLE REPORT CONTAINER --- */}
      <div
        ref={printableRef}
        id="sag-printable-report"
        className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-slate-900 print:border-none print:shadow-none print:p-0"
      >
        {/* Formal School Letterhead / KOP SURAT RESMI */}
        {config?.kop_surat_url ? (
          <div className="pb-3 border-b-2 border-slate-900 flex justify-center">
            <img
              src={config.kop_surat_url}
              alt="KOP Surat Resmi Sekolah"
              className="w-full max-h-36 object-contain"
            />
          </div>
        ) : (
          <div className="pb-3 border-b-2 border-slate-900">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Kiri KOP */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {config?.logo_url || config?.kop_logo_kiri_url ? (
                  <img
                    src={config.kop_logo_kiri_url || config.logo_url}
                    alt="Logo Sekolah"
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    <School className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* KOP Text Center */}
              <div className="flex-1 text-center space-y-0.5">
                <p className="text-xs font-semibold text-slate-800 tracking-wider uppercase leading-tight">
                  {config?.kop_text_baris1 || 'PEMERINTAH PROVINSI BALI'}
                </p>
                <p className="text-xs font-semibold text-slate-800 tracking-wider uppercase leading-tight">
                  {config?.kop_text_baris2 || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'}
                </p>
                <p className="text-sm font-black text-slate-950 tracking-wide uppercase leading-snug">
                  {config?.kop_text_baris3 || config?.nama_sekolah || 'SMA NEGERI 1 TABANAN (TERAKREDITASI A)'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium leading-tight">
                  {config?.kop_text_baris4 || `${config?.alamat_sekolah || 'Jl. Gunung Agung No. 122, Tabanan'} | Telp: ${config?.telepon || '(0361) 811234'} | NPSN: ${config?.npsn || '50101123'}`}
                </p>
              </div>

              {/* Spacer / Logo Kanan KOP (jika ada) */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {config?.kop_logo_kanan_url ? (
                  <img
                    src={config.kop_logo_kanan_url}
                    alt="Logo Kanan"
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <div className="w-14 h-14" />
                )}
              </div>
            </div>

            {/* Garis Khas KOP Surat Resmi (Double Line) */}
            <div className="mt-2 border-t-2 border-b border-slate-900 pt-0.5" />
          </div>
        )}

        {/* Report Document Title */}
        <div className="text-center my-3 space-y-0.5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {reportType === 'absensi_bulanan' && `REKAPITULASI PRESENSI PESERTA DIDIK BULANAN`}
            {reportType === 'absensi_semester' && `REKAPITULASI PRESENSI PESERTA DIDIK SEMESTER ${selectedSemester.toUpperCase()}`}
            {reportType === 'absensi_ringkas' && `LEGER REKAPITULASI PRESENSI SISWA`}
            {reportType === 'nilai' && `LEGER HASIL PENILAIAN HASIL BELAJAR PESERTA DIDIK`}
            {reportType === 'jurnal' && `JURNAL AGENDA PROSES BELAJAR MENGAJAR (PBM)`}
            {reportType === 'bimbingan' && `LEMBAR CATATAN BIMBINGAN GURU WALI KELAS`}
          </h2>
          <p className="text-[11px] text-slate-600 font-medium">
            Tahun Ajaran {config?.tahun_ajaran || '2026/2027'} • Semester {config?.semester_aktif || selectedSemester}
          </p>
        </div>

        {/* Report Metadata Info Box */}
        <div className="grid grid-cols-2 gap-4 my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="space-y-1">
            <div>
              <span className="text-slate-500">Mata Pelajaran:</span>{' '}
              <strong className="text-slate-800">{guruProfile?.mata_pelajaran || 'Matematika'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Nama Guru Pengampu:</span>{' '}
              <strong className="text-slate-800">{guruProfile?.nama_lengkap || currentUser?.nama_guru || 'Guru Pengampu'}</strong>
            </div>
            <div>
              <span className="text-slate-500">NIP Guru:</span>{' '}
              <strong className="text-slate-800">{guruProfile?.nip || currentUser?.nip || '-'}</strong>
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div>
              <span className="text-slate-500">Kelas / Rombel:</span>{' '}
              <strong className="text-teal-800 font-bold">
                {activeKelasObj ? `Kelas ${activeKelasObj.nama_kelas}` : 'Semua Kelas'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Periode Rekap:</span>{' '}
              <strong className="text-slate-800">
                {reportType === 'absensi_bulanan' && `Bulan ${selectedMonthLabel} ${selectedTahun}`}
                {reportType === 'absensi_semester' && `Semester ${selectedSemester} TA ${config?.tahun_ajaran || '2026/2027'}`}
                {reportType !== 'absensi_bulanan' && reportType !== 'absensi_semester' && `Tahun Ajaran ${config?.tahun_ajaran || '2026/2027'}`}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Jumlah Siswa:</span>{' '}
              <strong className="text-slate-800">{classStudents.length} Peserta Didik</strong>
            </div>
          </div>
        </div>

        {/* --- 1. REKAP ABSENSI BULANAN (Matriks Tanggal + Rekap H,S,I,A,D) --- */}
        {reportType === 'absensi_bulanan' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300 text-center">
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-8" rowSpan={2}>No</th>
                  <th className="border border-slate-300 py-2 px-3 w-20" rowSpan={2}>NIS</th>
                  <th className="border border-slate-300 py-2 px-3 text-left min-w-[140px]" rowSpan={2}>Nama Siswa</th>
                  <th className="border border-slate-300 py-2 px-1.5 w-8" rowSpan={2}>L/P</th>
                  {/* Tanggal-tanggal pertemuan jika ada */}
                  {monthlyDates.length > 0 && (
                    <th className="border border-slate-300 py-1 px-2" colSpan={monthlyDates.length}>
                      Pertemuan Tanggal (Bulan {selectedMonthLabel})
                    </th>
                  )}
                  <th className="border border-slate-300 py-1 px-2" colSpan={5}>
                    Rekapitulasi Kehadiran
                  </th>
                  <th className="border border-slate-300 py-2 px-2 w-16" rowSpan={2}>% Hadir</th>
                </tr>
                <tr>
                  {monthlyDates.map((tgl) => {
                    const day = tgl.split('-')[2];
                    return (
                      <th key={tgl} className="border border-slate-300 py-1 px-1.5 w-7 text-[10px] font-mono">
                        {day}
                      </th>
                    );
                  })}
                  <th className="border border-slate-300 py-1 px-1.5 w-8 bg-emerald-50 text-emerald-800">H</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-8 bg-amber-50 text-amber-800">S</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-8 bg-blue-50 text-blue-800">I</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-8 bg-rose-50 text-rose-800">A</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-8 bg-purple-50 text-purple-800">D</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st, idx) => {
                  const studentAbs = getFilteredAbsensiBulanan().filter((a) => a.siswa_id === st.siswa_id);
                  const h = studentAbs.filter((a) => a.status === 'Hadir').length;
                  const s = studentAbs.filter((a) => a.status === 'Sakit').length;
                  const i = studentAbs.filter((a) => a.status === 'Izin').length;
                  const a = studentAbs.filter((a) => a.status === 'Alpha').length;
                  const d = studentAbs.filter((a) => a.status === 'Dispensasi').length;
                  const total = studentAbs.length || 1;
                  const percent = Math.round(((h + d) / total) * 100);

                  return (
                    <tr key={st.siswa_id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-3 font-mono text-[11px]">{st.nis}</td>
                      <td className="border border-slate-300 py-1.5 px-3 font-semibold">{st.nama_lengkap}</td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center text-[11px]">{st.jenis_kelamin}</td>
                      {/* Status per tanggal */}
                      {monthlyDates.map((tgl) => {
                        const rec = studentAbs.find((x) => x.tanggal === tgl);
                        const statusChar = rec ? rec.status.charAt(0) : '-';
                        return (
                          <td
                            key={tgl}
                            className={`border border-slate-300 py-1.5 px-1 text-center font-bold text-[10px] ${
                              statusChar === 'H'
                                ? 'text-emerald-700 bg-emerald-50/20'
                                : statusChar === 'S'
                                ? 'text-amber-700 bg-amber-50/40'
                                : statusChar === 'I'
                                ? 'text-blue-700 bg-blue-50/40'
                                : statusChar === 'A'
                                ? 'text-rose-700 bg-rose-50/60 font-black'
                                : statusChar === 'D'
                                ? 'text-purple-700 bg-purple-50/40'
                                : 'text-slate-300'
                            }`}
                          >
                            {statusChar}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-emerald-700 bg-emerald-50/40">
                        {h}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-amber-700 bg-amber-50/40">
                        {s}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-blue-700 bg-blue-50/40">
                        {i}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-rose-700 bg-rose-50/40">
                        {a}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-purple-700 bg-purple-50/40">
                        {d}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-teal-900">
                        {percent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 2. REKAP ABSENSI SEMESTERAN (Ringkasan 6 Bulan + Total Semester) --- */}
        {reportType === 'absensi_semester' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300 text-center">
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-8" rowSpan={2}>No</th>
                  <th className="border border-slate-300 py-2 px-3 w-20" rowSpan={2}>NIS</th>
                  <th className="border border-slate-300 py-2 px-3 text-left min-w-[140px]" rowSpan={2}>Nama Siswa</th>
                  <th className="border border-slate-300 py-2 px-1.5 w-8" rowSpan={2}>L/P</th>
                  {getSemesterMonths().map((m) => (
                    <th key={m.code} className="border border-slate-300 py-1 px-2" colSpan={3}>
                      {m.name}
                    </th>
                  ))}
                  <th className="border border-slate-300 py-1 px-2 bg-slate-200" colSpan={5}>
                    Total Semester ({selectedSemester})
                  </th>
                  <th className="border border-slate-300 py-2 px-2 w-16" rowSpan={2}>% Kehadiran</th>
                </tr>
                <tr>
                  {getSemesterMonths().map((m) => (
                    <React.Fragment key={m.code}>
                      <th className="border border-slate-300 py-1 px-1 text-[10px] bg-emerald-50 text-emerald-800">H</th>
                      <th className="border border-slate-300 py-1 px-1 text-[10px] bg-amber-50 text-amber-800">S</th>
                      <th className="border border-slate-300 py-1 px-1 text-[10px] bg-rose-50 text-rose-800">A</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-slate-300 py-1 px-1.5 w-7 bg-emerald-100 text-emerald-900 font-bold">H</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-7 bg-amber-100 text-amber-900 font-bold">S</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-7 bg-blue-100 text-blue-900 font-bold">I</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-7 bg-rose-100 text-rose-900 font-bold">A</th>
                  <th className="border border-slate-300 py-1 px-1.5 w-7 bg-purple-100 text-purple-900 font-bold">D</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st, idx) => {
                  const studentAbsSemester = absensiList.filter((a) => {
                    if (a.siswa_id !== st.siswa_id || a.kelas_id !== selectedKelasId) return false;
                    const month = String(new Date(a.tanggal).getMonth() + 1).padStart(2, '0');
                    const semMonths = getSemesterMonths().map((m) => m.code);
                    return semMonths.includes(month);
                  });

                  const totalH = studentAbsSemester.filter((a) => a.status === 'Hadir').length;
                  const totalS = studentAbsSemester.filter((a) => a.status === 'Sakit').length;
                  const totalI = studentAbsSemester.filter((a) => a.status === 'Izin').length;
                  const totalA = studentAbsSemester.filter((a) => a.status === 'Alpha').length;
                  const totalD = studentAbsSemester.filter((a) => a.status === 'Dispensasi').length;
                  const totalAll = studentAbsSemester.length || 1;
                  const rate = Math.round(((totalH + totalD) / totalAll) * 100);

                  return (
                    <tr key={st.siswa_id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-3 font-mono text-[11px]">{st.nis}</td>
                      <td className="border border-slate-300 py-1.5 px-3 font-semibold">{st.nama_lengkap}</td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center text-[11px]">{st.jenis_kelamin}</td>
                      {/* Rincian per bulan semester */}
                      {getSemesterMonths().map((m) => {
                        const mAbs = absensiList.filter((a) => {
                          if (a.siswa_id !== st.siswa_id || a.kelas_id !== selectedKelasId) return false;
                          const month = String(new Date(a.tanggal).getMonth() + 1).padStart(2, '0');
                          return month === m.code;
                        });
                        const mH = mAbs.filter((a) => a.status === 'Hadir' || a.status === 'Dispensasi').length;
                        const mS = mAbs.filter((a) => a.status === 'Sakit').length;
                        const mA = mAbs.filter((a) => a.status === 'Alpha').length;

                        return (
                          <React.Fragment key={m.code}>
                            <td className="border border-slate-300 py-1 px-1 text-center font-medium text-emerald-700 bg-emerald-50/20">
                              {mH || '-'}
                            </td>
                            <td className="border border-slate-300 py-1 px-1 text-center font-medium text-amber-700 bg-amber-50/20">
                              {mS || '-'}
                            </td>
                            <td className="border border-slate-300 py-1 px-1 text-center font-medium text-rose-700 bg-rose-50/20">
                              {mA || '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {/* Total Semester Kumulatif */}
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-emerald-800 bg-emerald-100/60">
                        {totalH}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-amber-800 bg-amber-100/60">
                        {totalS}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-blue-800 bg-blue-100/60">
                        {totalI}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-rose-800 bg-rose-100/60">
                        {totalA}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1.5 text-center font-bold text-purple-800 bg-purple-100/60">
                        {totalD}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-teal-900">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 3. REKAP ABSENSI RINGKAS (Total) --- */}
        {reportType === 'absensi_ringkas' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300 text-center">
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-10">No</th>
                  <th className="border border-slate-300 py-2 px-3 w-24">NIS</th>
                  <th className="border border-slate-300 py-2 px-4 text-left">Nama Lengkap Siswa</th>
                  <th className="border border-slate-300 py-2 px-2 w-12">L/P</th>
                  <th className="border border-slate-300 py-2 px-2 w-12 bg-emerald-50">H</th>
                  <th className="border border-slate-300 py-2 px-2 w-12 bg-amber-50">S</th>
                  <th className="border border-slate-300 py-2 px-2 w-12 bg-blue-50">I</th>
                  <th className="border border-slate-300 py-2 px-2 w-12 bg-rose-50">A</th>
                  <th className="border border-slate-300 py-2 px-2 w-12 bg-purple-50">D</th>
                  <th className="border border-slate-300 py-2 px-3 w-20">Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st, idx) => {
                  const studentAbs = absensiList.filter((a) => a.siswa_id === st.siswa_id);
                  const h = studentAbs.filter((a) => a.status === 'Hadir').length;
                  const s = studentAbs.filter((a) => a.status === 'Sakit').length;
                  const i = studentAbs.filter((a) => a.status === 'Izin').length;
                  const a = studentAbs.filter((a) => a.status === 'Alpha').length;
                  const d = studentAbs.filter((a) => a.status === 'Dispensasi').length;
                  const total = studentAbs.length || 1;
                  const percent = Math.round(((h + d) / total) * 100);

                  return (
                    <tr key={st.siswa_id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-3 font-mono">{st.nis}</td>
                      <td className="border border-slate-300 py-1.5 px-4 font-semibold">{st.nama_lengkap}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{st.jenis_kelamin}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-semibold text-emerald-700 bg-emerald-50/40">
                        {h}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-semibold text-amber-700 bg-amber-50/40">
                        {s}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-semibold text-blue-700 bg-blue-50/40">
                        {i}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-semibold text-rose-700 bg-rose-50/40">
                        {a}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-semibold text-purple-700 bg-purple-50/40">
                        {d}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center font-bold text-teal-800">
                        {percent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 4. REKAP NILAI --- */}
        {reportType === 'nilai' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-10 text-center">No</th>
                  <th className="border border-slate-300 py-2 px-3 w-24">NIS</th>
                  <th className="border border-slate-300 py-2 px-4">Nama Lengkap Siswa</th>
                  <th className="border border-slate-300 py-2 px-3">Jenis & KD</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-16">Nilai</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-28">Ketercapaian KKTP</th>
                </tr>
              </thead>
              <tbody>
                {penilaianList
                  .filter((p) => p.kelas_id === selectedKelasId)
                  .map((p, idx) => (
                    <tr key={p.nilai_id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-3 font-mono">{p.nis}</td>
                      <td className="border border-slate-300 py-1.5 px-4 font-semibold">{p.nama_siswa}</td>
                      <td className="border border-slate-300 py-1.5 px-3">
                        [{p.jenis_penilaian}] {p.nama_tugas_kd}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center font-bold font-mono">
                        {p.nilai}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center">
                        <span
                          className={`font-semibold ${
                            p.nilai >= p.kkm ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {p.keterangan || (p.nilai >= p.kkm ? 'Tuntas KKTP' : 'Remedial')}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 5. JURNAL MENGAJAR PBM --- */}
        {reportType === 'jurnal' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-10 text-center">No</th>
                  <th className="border border-slate-300 py-2 px-3 w-24">Tanggal</th>
                  <th className="border border-slate-300 py-2 px-2 w-24 text-center">Kelas / Jam</th>
                  <th className="border border-slate-300 py-2 px-4">Materi Pokok Pembelajaran (PBM)</th>
                  <th className="border border-slate-300 py-2 px-4">Catatan PBM & Rencana Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody>
                {relevantJurnalList.map((j, idx) => (
                  <tr key={j.jurnal_id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 py-2 px-3 font-mono">{j.tanggal}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-medium">
                      Kelas {j.nama_kelas || j.kelas_id} (Jam {j.jam_ke})
                    </td>
                    <td className="border border-slate-300 py-2 px-4 font-semibold text-slate-900">
                      {j.materi_pembelajaran}
                    </td>
                    <td className="border border-slate-300 py-2 px-4">
                      <div>{j.catatan}</div>
                      {j.rencana_tindak_lanjut && (
                        <div className="text-[11px] text-teal-800 font-semibold italic mt-0.5">
                          Tindak Lanjut: {j.rencana_tindak_lanjut}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 6. BIMBINGAN SISWA --- */}
        {reportType === 'bimbingan' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-10 text-center">No</th>
                  <th className="border border-slate-300 py-2 px-3 w-24">Tanggal</th>
                  <th className="border border-slate-300 py-2 px-3">Nama Siswa / Kelas</th>
                  <th className="border border-slate-300 py-2 px-3 w-28">Kategori</th>
                  <th className="border border-slate-300 py-2 px-4">Masalah & Rekomendasi Solusi</th>
                </tr>
              </thead>
              <tbody>
                {relevantBimbinganList.map((b, idx) => (
                  <tr key={b.bimbingan_id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 py-2 px-3 font-mono">{b.tanggal}</td>
                    <td className="border border-slate-300 py-2 px-3">
                      <strong>{b.nama_siswa}</strong> ({b.nis}) • Kelas {b.nama_kelas || b.kelas_id}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{b.jenis_bimbingan}</td>
                    <td className="border border-slate-300 py-2 px-4">
                      <div>
                        <strong>Masalah:</strong> {b.masalah_observasi}
                      </div>
                      <div className="text-teal-900 mt-0.5">
                        <strong>Solusi:</strong> {b.solusi_rekomendasi}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formal Signature Area for Printing */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-xs">
          <div className="text-center space-y-16">
            <p>
              Mengetahui,
              <br />
              Kepala {config?.nama_sekolah || 'SMA Negeri 1 Tabanan'}
            </p>
            <div>
              <p className="font-bold underline uppercase">{config?.nama_kepala_sekolah || 'I Wayan Sudarta, S.Pd., M.Pd.'}</p>
              <p className="text-[11px] text-slate-500">NIP. {config?.nip_kepala_sekolah || '19720415 199802 1 004'}</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <p>
              {config?.kabupaten_kota ? config.kabupaten_kota.replace('Kabupaten ', '') : 'Tabanan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              <br />
              Guru Mata Pelajaran
            </p>
            <div>
              <p className="font-bold underline uppercase">
                {guruProfile?.nama_lengkap || currentUser?.nama_guru || 'Guru Pengampu'}
              </p>
              <p className="text-[11px] text-slate-500">
                NIP. {guruProfile?.nip || currentUser?.nip || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
