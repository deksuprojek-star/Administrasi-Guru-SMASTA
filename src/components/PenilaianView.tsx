/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  School,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  History,
} from 'lucide-react';
import { Kelas, MataPelajaran, Siswa, JenisPenilaian, PenilaianRecord } from '../types';
import { apiService } from '../services/apiService';

const JENIS_OPTIONS: JenisPenilaian[] = [
  'UH',
  'Praktik',
  'Projek',
  'Produk',
  'Portofolio',
  'SAS',
  'Lainnya',
];

export const PenilaianView: React.FC = () => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('');
  const [selectedJenis, setSelectedJenis] = useState<JenisPenilaian>('UH');
  const [namaTugasKd, setNamaTugasKd] = useState<string>('UH-1 Bilangan Bulat dan Pecahan');
  const [kkm, setKkm] = useState<number>(75);
  const [tanggalPenilaian, setTanggalPenilaian] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [rosterScores, setRosterScores] = useState<
    Array<{
      siswa: Siswa;
      nilai: number | string;
      keterangan: string;
      nilai_id?: string;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'riwayat'>('input');
  const [historyRecords, setHistoryRecords] = useState<PenilaianRecord[]>([]);

  useEffect(() => {
    loadInitialMaster();
    const handleDataChanged = () => {
      loadInitialMaster();
      if (selectedKelasId) {
        loadStudentsForGrading();
        if (activeTab === 'riwayat') {
          loadGradingHistory();
        }
      }
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, [selectedKelasId, activeTab]);

  const loadInitialMaster = async () => {
    const [k, m] = await Promise.all([
      apiService.getKelasList(),
      apiService.getMapelList(),
    ]);
    setKelasList(k);
    setMapelList(m);
    if (k.length > 0) setSelectedKelasId(k[0].kelas_id);
    if (m.length > 0) {
      setSelectedMapelId(m[0].mapel_id);
      setKkm(m[0].kkm_default || 75);
    }
  };

  useEffect(() => {
    if (selectedKelasId) {
      loadStudentsForGrading();
      if (activeTab === 'riwayat') {
        loadGradingHistory();
      }
    }
  }, [selectedKelasId, namaTugasKd, activeTab]);

  const loadStudentsForGrading = async () => {
    if (!selectedKelasId) return;
    const students = await apiService.getSiswaList(selectedKelasId);
    const existing = await apiService.getPenilaianList({
      kelas_id: selectedKelasId,
      nama_tugas_kd: namaTugasKd,
    });

    const scoreMap = new Map(existing.map((e) => [e.siswa_id, e]));

    const formatted = students
      .filter((s) => s.status === 'Aktif')
      .map((s) => {
        const prev = scoreMap.get(s.siswa_id);
        return {
          siswa: s,
          nilai: prev ? prev.nilai : 80,
          keterangan: prev ? prev.keterangan || '' : '',
          nilai_id: prev?.nilai_id,
        };
      });

    setRosterScores(formatted);
  };

  const loadGradingHistory = async () => {
    const list = await apiService.getPenilaianList({ kelas_id: selectedKelasId });
    setHistoryRecords(list);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleScoreChange = (siswaId: string, value: string) => {
    const num = Number(value);
    setRosterScores((prev) =>
      prev.map((item) =>
        item.siswa.siswa_id === siswaId
          ? {
              ...item,
              nilai: value === '' ? '' : Math.min(100, Math.max(0, num)),
            }
          : item
      )
    );
  };

  const handleSaveBatch = async () => {
    if (!namaTugasKd.trim() || rosterScores.length === 0) {
      showToast('Nama Tugas/KD dan data nilai wajib diisi', 'error');
      return;
    }

    setIsSaving(true);
    const records: PenilaianRecord[] = rosterScores.map((item) => {
      const val = Number(item.nilai) || 0;
      const isPassed = val >= kkm;
      return {
        nilai_id: item.nilai_id || `NIL-${selectedKelasId}-${namaTugasKd.replace(/\s+/g, '')}-${item.siswa.nis}`,
        tanggal: tanggalPenilaian,
        kelas_id: selectedKelasId,
        mapel_id: selectedMapelId || 'MP-01',
        jenis_penilaian: selectedJenis,
        nama_tugas_kd: namaTugasKd.trim(),
        kkm: Number(kkm) || 75,
        siswa_id: item.siswa.siswa_id,
        nis: item.siswa.nis,
        nama_siswa: item.siswa.nama_lengkap,
        nilai: val,
        keterangan: item.keterangan || (isPassed ? 'Tuntas' : 'Remedial'),
        guru_id: apiService.getCurrentUser()?.guru_id || 'GURU-ADMIN',
        tahun_ajaran: '2026/2027',
        semester: 'Ganjil',
      };
    });

    try {
      const res = await apiService.saveBatchPenilaian(records);
      if (res.success) {
        showToast(res.message);
        loadStudentsForGrading();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live statistics
  const validScores = rosterScores
    .map((r) => Number(r.nilai))
    .filter((n) => !isNaN(n) && n > 0);
  const avgScore = validScores.length
    ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
    : 0;
  const maxScore = validScores.length ? Math.max(...validScores) : 0;
  const minScore = validScores.length ? Math.min(...validScores) : 0;
  const tuntasCount = validScores.filter((n) => n >= kkm).length;
  const passingRate = validScores.length ? Math.round((tuntasCount / validScores.length) * 100) : 0;

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Penilaian & Asesmen Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Penginputan nilai formatif, sumatif, portofolio, dan SAS dengan verifikasi KKTP otomatis
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'input'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Form Nilai Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'riwayat'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Rekap Nilai</span>
          </button>
        </div>
      </div>

      {activeTab === 'input' ? (
        <div className="space-y-5">
          {/* Assessment Setup Form Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Kelas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-teal-600" />
                  <span>Pilih Kelas *</span>
                </label>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                >
                  {kelasList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Penilaian */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  <span>Jenis Penilaian *</span>
                </label>
                <select
                  value={selectedJenis}
                  onChange={(e) => setSelectedJenis(e.target.value as JenisPenilaian)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 font-semibold text-teal-800"
                >
                  {JENIS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'UH' ? 'Ulangan Harian (UH)' : opt === 'SAS' ? 'Sumatif Akhir Semester (SAS)' : opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span>Mata Pelajaran *</span>
                </label>
                <select
                  value={selectedMapelId}
                  onChange={(e) => {
                    setSelectedMapelId(e.target.value);
                    const mp = mapelList.find((m) => m.mapel_id === e.target.value);
                    if (mp) setKkm(mp.kkm_default);
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {mapelList.map((m) => (
                    <option key={m.mapel_id} value={m.mapel_id}>
                      {m.nama_mapel}
                    </option>
                  ))}
                </select>
              </div>

              {/* KKTP */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Batas KKTP (Kriteria Ketercapaian) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={kkm}
                  onChange={(e) => setKkm(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono font-bold text-teal-700 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Nama Tugas & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Tugas / KD / Materi Asesmen *
                </label>
                <input
                  type="text"
                  required
                  value={namaTugasKd}
                  onChange={(e) => setNamaTugasKd(e.target.value)}
                  placeholder="Contoh: UH-1 Bilangan Bulat dan Pecahan"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tanggal Penilaian</span>
                </label>
                <input
                  type="date"
                  value={tanggalPenilaian}
                  onChange={(e) => setTanggalPenilaian(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics of Current Grading */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Rata-rata Kelas</span>
              <span className="text-xl font-bold text-slate-800">{avgScore}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Nilai Tertinggi</span>
              <span className="text-xl font-bold text-emerald-600">{maxScore}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Nilai Terendah</span>
              <span className="text-xl font-bold text-rose-600">{minScore}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Ketercapaian (≥{kkm})</span>
              <span className="text-xl font-bold text-teal-700">{passingRate}% ({tuntasCount} Siswa)</span>
            </div>
          </div>

          {/* Student Grading Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-28">NIS</th>
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-4 w-32 text-center">Nilai (0-100)</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                    <th className="py-3 px-4">Keterangan / Catatan Remedial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterScores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada siswa pada kelas yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    rosterScores.map((item, idx) => {
                      const num = Number(item.nilai) || 0;
                      const isPassed = num >= kkm;
                      return (
                        <tr key={item.siswa.siswa_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 text-center font-medium text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                            {item.siswa.nis}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {item.siswa.nama_lengkap}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.nilai}
                              onChange={(e) => handleScoreChange(item.siswa.siswa_id, e.target.value)}
                              className={`w-20 px-2.5 py-1.5 text-center font-mono font-bold rounded-lg border text-sm ${
                                isPassed
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : 'border-rose-300 bg-rose-50 text-rose-800'
                              } focus:ring-2 focus:ring-teal-500 focus:outline-hidden`}
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPassed ? 'Tuntas' : 'Remedial'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={item.keterangan}
                              placeholder={isPassed ? 'Tuntas baik' : 'Perlu remedial KD terkait'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRosterScores((prev) =>
                                  prev.map((r) =>
                                    r.siswa.siswa_id === item.siswa.siswa_id
                                      ? { ...r, keterangan: val }
                                      : r
                                  )
                                );
                              }}
                              className="w-full px-2.5 py-1 text-xs border rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Penyimpanan dikirim dalam 1 batch operasi ke sheet <strong className="font-mono text-slate-700">06_PENILAIAN</strong>.
              </p>
              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={isSaving || rosterScores.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan Nilai...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Nilai ({rosterScores.length} Siswa)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Riwayat Penilaian */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">
              Riwayat Nilai Tersimpan Kelas {kelasList.find((k) => k.kelas_id === selectedKelasId)?.nama_kelas}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Tugas / KD</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3 text-center">Nilai</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Belum ada rekaman nilai tersimpan untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  historyRecords.map((r) => (
                    <tr key={r.nilai_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{r.tanggal}</td>
                      <td className="py-2 px-3 font-semibold">{r.jenis_penilaian}</td>
                      <td className="py-2 px-3">{r.nama_tugas_kd}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{r.nama_siswa}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-teal-800">{r.nilai}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.nilai >= r.kkm ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.keterangan || (r.nilai >= r.kkm ? 'Tuntas' : 'Remedial')}
                        </span>
                      </td>
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
