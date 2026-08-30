/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Calendar,
  School,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  RotateCcw,
  Sparkles,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import { Kelas, Siswa, StatusAbsensi, AbsensiRecord } from '../types';
import { apiService } from '../services/apiService';

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

export const AbsensiView: React.FC = () => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isTeacherFiltered, setIsTeacherFiltered] = useState<boolean>(false);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [roster, setRoster] = useState<
    Array<{
      siswa: Siswa;
      status: StatusAbsensi;
      keterangan: string;
      absensi_id?: string;
    }>
  >([]);
  const [allClassStudents, setAllClassStudents] = useState<Siswa[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'bulanan' | 'semester' | 'riwayat'>('input');
  const [historyRecords, setHistoryRecords] = useState<AbsensiRecord[]>([]);

  // Filter Bulanan & Semesteran
  const [selectedBulan, setSelectedBulan] = useState<string>('08');
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  useEffect(() => {
    loadClasses();
    const handleDataChanged = () => {
      loadClasses();
      if (selectedKelasId) {
        loadStudentRoster();
        loadHistory();
      }
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, [selectedKelasId]);

  const loadClasses = async () => {
    const { classes, isFiltered } = await apiService.getTeacherTaughtClasses();
    setKelasList(classes);
    setIsTeacherFiltered(isFiltered);
    if (classes.length > 0) {
      setSelectedKelasId((prev) => (classes.some((c) => c.kelas_id === prev) ? prev : classes[0].kelas_id));
    }
  };

  useEffect(() => {
    if (selectedKelasId) {
      loadStudentRoster();
      loadHistory();
    }
  }, [selectedKelasId, selectedTanggal, activeSubTab]);

  const loadStudentRoster = async () => {
    if (!selectedKelasId) return;
    const students = await apiService.getSiswaList(selectedKelasId);
    setAllClassStudents(students);
    const existingAbsensi = await apiService.getAbsensiList({
      kelas_id: selectedKelasId,
      tanggal: selectedTanggal,
    });

    const existingMap = new Map(existingAbsensi.map((a) => [a.siswa_id, a]));

    // Format roster: Default status = 'Hadir' jika belum pernah disimpan
    const formatted = students
      .filter((s) => s.status === 'Aktif')
      .map((s) => {
        const prev = existingMap.get(s.siswa_id);
        return {
          siswa: s,
          status: prev ? prev.status : ('Hadir' as StatusAbsensi),
          keterangan: prev ? prev.keterangan : '',
          absensi_id: prev?.absensi_id,
        };
      });

    setRoster(formatted);
  };

  const loadHistory = async () => {
    const list = await apiService.getAbsensiList({ kelas_id: selectedKelasId });
    setHistoryRecords(list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = (siswaId: string, status: StatusAbsensi) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.siswa.siswa_id === siswaId ? { ...item, status } : item
      )
    );
  };

  const handleKeteranganChange = (siswaId: string, keterangan: string) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.siswa.siswa_id === siswaId ? { ...item, keterangan } : item
      )
    );
  };

  const handleSetAllStatus = (status: StatusAbsensi) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
    showToast(`Seluruh siswa diatur menjadi: ${status}`);
  };

  const handleSaveAttendance = async () => {
    if (roster.length === 0) {
      showToast('Tidak ada siswa pada kelas yang dipilih', 'error');
      return;
    }

    setIsSaving(true);
    const currentUser = apiService.getCurrentUser();
    const records: AbsensiRecord[] = roster.map((item) => ({
      absensi_id: item.absensi_id || `ABS-${selectedTanggal}-${item.siswa.nis}`,
      tanggal: selectedTanggal,
      kelas_id: selectedKelasId,
      siswa_id: item.siswa.siswa_id,
      nis: item.siswa.nis,
      nama_siswa: item.siswa.nama_lengkap,
      jenis_kelamin: item.siswa.jenis_kelamin,
      status: item.status,
      keterangan: item.keterangan || '',
      guru_id: currentUser?.guru_id || 'GURU-ADMIN',
      created_at: new Date().toISOString(),
    }));

    try {
      const res = await apiService.saveBatchAttendance(records);
      if (res.success) {
        showToast(res.message);
        loadStudentRoster();
        loadHistory();
      } else {
        showToast(res.message || 'Gagal menyimpan absensi', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper filter absensi bulanan
  const getFilteredAbsensiBulanan = () => {
    return historyRecords.filter((a) => {
      if (a.kelas_id !== selectedKelasId) return false;
      const d = new Date(a.tanggal);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = String(d.getFullYear());
      return m === selectedBulan && y === selectedTahun;
    });
  };

  const monthlyDates: string[] = Array.from(
    new Set(
      getFilteredAbsensiBulanan()
        .map((a) => a.tanggal)
        .sort()
    )
  );

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

  // Stats calculation for active roster
  const countHadir = roster.filter((r) => r.status === 'Hadir').length;
  const countSakit = roster.filter((r) => r.status === 'Sakit').length;
  const countIzin = roster.filter((r) => r.status === 'Izin').length;
  const countAlpha = roster.filter((r) => r.status === 'Alpha').length;
  const countDispensasi = roster.filter((r) => r.status === 'Dispensasi').length;

  const currentKelasObj = kelasList.find((k) => k.kelas_id === selectedKelasId);
  const selectedMonthLabel = BULAN_NAMES.find((b) => b.value === selectedBulan)?.label || 'Agustus';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <span>Presensi & Absensi Siswa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan kehadiran peserta didik per pertemuan PBM serta rekapitulasi kehadiran bulanan dan semesteran
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === 'input'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Input Presensi PBM</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bulanan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === 'bulanan'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Rekap Bulanan</span>
          </button>

          <button
            onClick={() => setActiveSubTab('semester')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === 'semester'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Rekap Semesteran</span>
          </button>

          <button
            onClick={() => setActiveSubTab('riwayat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === 'riwayat'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Log</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: INPUT PRESENSI HARIAN --- */}
      {activeSubTab === 'input' && (
        <div className="space-y-5">
          {/* Filter & Parameters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Tanggal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Hari / Tanggal Pertemuan PBM *</span>
                </label>
                <input
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Kelas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pilih Rombongan Belajar (Kelas) *</span>
                  </label>
                  {isTeacherFiltered && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Kelas Diampu ({kelasList.length})
                    </span>
                  )}
                </div>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                >
                  {kelasList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      Kelas {k.nama_kelas} ({k.jumlah_siswa || 0} Siswa)
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Kelas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Informasi Kelas
                </label>
                <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium truncate">
                  Tingkat {currentKelasObj?.tingkat || '-'} • TA {currentKelasObj?.tahun_ajaran || '2026/2027'}
                </div>
              </div>
            </div>

            {/* Quick Summary & Bulk Preset Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {/* Stat Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Total: {roster.length} Siswa</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                  Hadir: {countHadir}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                  Sakit: {countSakit}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                  Izin: {countIzin}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                  Alpha: {countAlpha}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold" title="Dispensasi dihitung Hadir pada rekap">
                  Dispensasi: {countDispensasi}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold border border-teal-300">
                  Total Hadir: {countHadir + countDispensasi}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 font-medium mr-1">Tindakan Cepat:</span>
                <button
                  type="button"
                  onClick={() => handleSetAllStatus('Hadir')}
                  className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-semibold transition-colors"
                >
                  Semua Hadir
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllStatus('Izin')}
                  className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 font-semibold transition-colors"
                >
                  Semua Izin
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-28">NIS</th>
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-4 text-center w-14">L/P</th>
                    <th className="py-3 px-4 text-center w-80">Status Kehadiran</th>
                    <th className="py-3 px-4">Keterangan Tambahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada siswa aktif terdaftar di kelas {currentKelasObj?.nama_kelas}.
                      </td>
                    </tr>
                  ) : (
                    roster.map((item, idx) => (
                      <tr
                        key={item.siswa.siswa_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.status === 'Alpha'
                            ? 'bg-rose-50/40'
                            : item.status === 'Sakit'
                            ? 'bg-amber-50/30'
                            : item.status === 'Izin'
                            ? 'bg-blue-50/30'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {item.siswa.nis}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.siswa.nama_lengkap}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block w-5 h-5 rounded-full text-[10px] font-bold leading-5 text-center ${
                              item.siswa.jenis_kelamin === 'L'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {item.siswa.jenis_kelamin}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {/* Segmented Status Pill Selector */}
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/80 gap-0.5">
                            {(['Hadir', 'Sakit', 'Izin', 'Alpha', 'Dispensasi'] as StatusAbsensi[]).map((st) => {
                              const isSelected = item.status === st;
                              let activeClass = '';
                              if (st === 'Hadir') activeClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                              if (st === 'Sakit') activeClass = 'bg-amber-500 text-white font-bold shadow-xs';
                              if (st === 'Izin') activeClass = 'bg-blue-600 text-white font-bold shadow-xs';
                              if (st === 'Alpha') activeClass = 'bg-rose-600 text-white font-bold shadow-xs';
                              if (st === 'Dispensasi') activeClass = 'bg-purple-600 text-white font-bold shadow-xs';

                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(item.siswa.siswa_id, st)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all font-medium ${
                                    isSelected
                                      ? activeClass
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  {st === 'Dispensasi' ? 'Disp' : st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder={item.status !== 'Hadir' ? 'Alasan (surat/keterangan)...' : 'Catatan opsional'}
                            value={item.keterangan}
                            onChange={(e) => handleKeteranganChange(item.siswa.siswa_id, e.target.value)}
                            className="w-full px-2.5 py-1 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>
                  Data presensi tersimpan aman dan terintegrasi otomatis dengan rekapitulasi bulanan & semesteran.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSaving || roster.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan Presensi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Presensi ({roster.length} Siswa)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: REKAP BULANAN --- */}
      {activeSubTab === 'bulanan' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Pilih Kelas:</span>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                >
                  {kelasList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
              Rekap Bulan: {selectedMonthLabel} {selectedTahun} • Kelas {currentKelasObj?.nama_kelas}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-center text-[11px]">
                <tr>
                  <th className="border border-slate-200 py-2 px-2 w-8" rowSpan={2}>No</th>
                  <th className="border border-slate-200 py-2 px-3 w-20" rowSpan={2}>NIS</th>
                  <th className="border border-slate-200 py-2 px-3 text-left min-w-[140px]" rowSpan={2}>Nama Siswa</th>
                  <th className="border border-slate-200 py-2 px-1.5 w-8" rowSpan={2}>L/P</th>
                  {monthlyDates.length > 0 && (
                    <th className="border border-slate-200 py-1 px-2" colSpan={monthlyDates.length}>
                      Tanggal Pertemuan (Bulan {selectedMonthLabel})
                    </th>
                  )}
                  <th className="border border-slate-200 py-1 px-2" colSpan={5}>Rekapitulasi</th>
                  <th className="border border-slate-200 py-2 px-2 w-16" rowSpan={2}>% Hadir</th>
                </tr>
                <tr>
                  {monthlyDates.map((tgl) => (
                    <th key={tgl} className="border border-slate-200 py-1 px-1.5 text-[10px] font-mono">
                      {tgl.split('-')[2]}
                    </th>
                  ))}
                  <th className="border border-slate-200 py-1 px-1.5 w-8 bg-emerald-50 text-emerald-800">H</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-8 bg-amber-50 text-amber-800">S</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-8 bg-blue-50 text-blue-800">I</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-8 bg-rose-50 text-rose-800">A</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-8 bg-purple-50 text-purple-800">D</th>
                </tr>
              </thead>
              <tbody>
                {allClassStudents.map((st, idx) => {
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
                      <td className="border border-slate-200 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-200 py-1.5 px-3 font-mono text-[11px]">{st.nis}</td>
                      <td className="border border-slate-200 py-1.5 px-3 font-semibold text-slate-900">{st.nama_lengkap}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center text-[11px]">{st.jenis_kelamin}</td>
                      {monthlyDates.map((tgl) => {
                        const rec = studentAbs.find((x) => x.tanggal === tgl);
                        const statusChar = rec ? rec.status.charAt(0) : '-';
                        return (
                          <td
                            key={tgl}
                            className={`border border-slate-200 py-1.5 px-1 text-center font-bold text-[10px] ${
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
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-emerald-700 bg-emerald-50/30">{h}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-amber-700 bg-amber-50/30">{s}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-blue-700 bg-blue-50/30">{i}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-rose-700 bg-rose-50/30">{a}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-purple-700 bg-purple-50/30">{d}</td>
                      <td className="border border-slate-200 py-1.5 px-2 text-center font-bold text-teal-800">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: REKAP SEMESTERAN --- */}
      {activeSubTab === 'semester' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Pilih Kelas:</span>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                >
                  {kelasList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
              Rekapitulasi Semester {selectedSemester} • Kelas {currentKelasObj?.nama_kelas}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-center text-[11px]">
                <tr>
                  <th className="border border-slate-200 py-2 px-2 w-8" rowSpan={2}>No</th>
                  <th className="border border-slate-200 py-2 px-3 w-20" rowSpan={2}>NIS</th>
                  <th className="border border-slate-200 py-2 px-3 text-left min-w-[140px]" rowSpan={2}>Nama Siswa</th>
                  <th className="border border-slate-200 py-2 px-1.5 w-8" rowSpan={2}>L/P</th>
                  {getSemesterMonths().map((m) => (
                    <th key={m.code} className="border border-slate-200 py-1 px-2" colSpan={3}>
                      {m.name}
                    </th>
                  ))}
                  <th className="border border-slate-200 py-1 px-2 bg-slate-200" colSpan={5}>
                    Total Semester ({selectedSemester})
                  </th>
                  <th className="border border-slate-200 py-2 px-2 w-16" rowSpan={2}>% Kehadiran</th>
                </tr>
                <tr>
                  {getSemesterMonths().map((m) => (
                    <React.Fragment key={m.code}>
                      <th className="border border-slate-200 py-1 px-1 text-[10px] bg-emerald-50 text-emerald-800">H</th>
                      <th className="border border-slate-200 py-1 px-1 text-[10px] bg-amber-50 text-amber-800">S</th>
                      <th className="border border-slate-200 py-1 px-1 text-[10px] bg-rose-50 text-rose-800">A</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-slate-200 py-1 px-1.5 w-7 bg-emerald-100 text-emerald-900 font-bold">H</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-7 bg-amber-100 text-amber-900 font-bold">S</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-7 bg-blue-100 text-blue-900 font-bold">I</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-7 bg-rose-100 text-rose-900 font-bold">A</th>
                  <th className="border border-slate-200 py-1 px-1.5 w-7 bg-purple-100 text-purple-900 font-bold">D</th>
                </tr>
              </thead>
              <tbody>
                {allClassStudents.map((st, idx) => {
                  const studentAbsSemester = historyRecords.filter((a) => {
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
                      <td className="border border-slate-200 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-200 py-1.5 px-3 font-mono text-[11px]">{st.nis}</td>
                      <td className="border border-slate-200 py-1.5 px-3 font-semibold text-slate-900">{st.nama_lengkap}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center text-[11px]">{st.jenis_kelamin}</td>
                      {getSemesterMonths().map((m) => {
                        const mAbs = historyRecords.filter((a) => {
                          if (a.siswa_id !== st.siswa_id || a.kelas_id !== selectedKelasId) return false;
                          const month = String(new Date(a.tanggal).getMonth() + 1).padStart(2, '0');
                          return month === m.code;
                        });
                        const mH = mAbs.filter((a) => a.status === 'Hadir' || a.status === 'Dispensasi').length;
                        const mS = mAbs.filter((a) => a.status === 'Sakit').length;
                        const mA = mAbs.filter((a) => a.status === 'Alpha').length;

                        return (
                          <React.Fragment key={m.code}>
                            <td className="border border-slate-200 py-1 px-1 text-center font-medium text-emerald-700 bg-emerald-50/20">
                              {mH || '-'}
                            </td>
                            <td className="border border-slate-200 py-1 px-1 text-center font-medium text-amber-700 bg-amber-50/20">
                              {mS || '-'}
                            </td>
                            <td className="border border-slate-200 py-1 px-1 text-center font-medium text-rose-700 bg-rose-50/20">
                              {mA || '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-emerald-800 bg-emerald-100/60">{totalH}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-amber-800 bg-amber-100/60">{totalS}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-blue-800 bg-blue-100/60">{totalI}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-rose-800 bg-rose-100/60">{totalA}</td>
                      <td className="border border-slate-200 py-1.5 px-1.5 text-center font-bold text-purple-800 bg-purple-100/60">{totalD}</td>
                      <td className="border border-slate-200 py-1.5 px-2 text-center font-bold text-teal-900">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: RIWAYAT ABSENSI LOG --- */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">
              Riwayat Presensi Kelas {currentKelasObj?.nama_kelas}
            </h2>
            <button
              onClick={loadHistory}
              className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Segarkan Data</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada data riwayat absensi tersimpan untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  historyRecords.map((r) => (
                    <tr key={r.absensi_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium">{r.tanggal}</td>
                      <td className="py-2 px-3 font-mono">{r.nis}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{r.nama_siswa}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Sakit'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'Izin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{r.keterangan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
