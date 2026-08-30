/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  School,
  Clock,
  Save,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';
import { JurnalMengajar, Kelas, MataPelajaran } from '../types';
import { apiService } from '../services/apiService';

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const JurnalMengajarView: React.FC = () => {
  const [jurnalList, setJurnalList] = useState<JurnalMengajar[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isTeacherFiltered, setIsTeacherFiltered] = useState<boolean>(false);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formKelasId, setFormKelasId] = useState('');
  const [formMapelName, setFormMapelName] = useState('');
  const [selectedJamKe, setSelectedJamKe] = useState<number[]>([1, 2]);
  const [formMateri, setFormMateri] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formTindakLanjut, setFormTindakLanjut] = useState('');

  // Quick Class Creation
  const [isAddingClassInline, setIsAddingClassInline] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTingkat, setNewClassTingkat] = useState<'X' | 'XI' | 'XII'>('X');

  useEffect(() => {
    loadData();
    const handleDataChanged = () => {
      loadData();
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, []);

  const loadData = async () => {
    const [j, teacherClassesResult, m] = await Promise.all([
      apiService.getJurnalList(),
      apiService.getTeacherTaughtClasses(),
      apiService.getMapelList(),
    ]);
    setJurnalList(j);
    setKelasList(teacherClassesResult.classes);
    setIsTeacherFiltered(teacherClassesResult.isFiltered);
    setMapelList(m);
    if (teacherClassesResult.classes.length > 0 && !formKelasId) {
      setFormKelasId(teacherClassesResult.classes[0].kelas_id);
    }
    if (m.length > 0 && !formMapelName) setFormMapelName(m[0].nama_mapel);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleJamKe = (num: number) => {
    if (selectedJamKe.includes(num)) {
      if (selectedJamKe.length === 1) return;
      setSelectedJamKe(selectedJamKe.filter((n) => n !== num));
    } else {
      setSelectedJamKe([...selectedJamKe, num].sort((a, b) => a - b));
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormKelasId(kelasList[0]?.kelas_id || '');
    setFormMapelName(mapelList[0]?.nama_mapel || '');
    setSelectedJamKe([1, 2]);
    setFormMateri('');
    setFormCatatan('');
    setFormTindakLanjut('');
    setIsAddingClassInline(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JurnalMengajar) => {
    setEditingId(item.jurnal_id);
    setFormTanggal(item.tanggal);
    setFormKelasId(item.kelas_id);
    const existingMapel = mapelList.find((m) => m.mapel_id === item.mapel_id);
    setFormMapelName(existingMapel ? existingMapel.nama_mapel : item.mapel_id);
    const periods = item.jam_ke.split(',').map((p) => Number(p.trim())).filter(Boolean);
    setSelectedJamKe(periods.length ? periods : [1]);
    setFormMateri(item.materi_pembelajaran);
    setFormCatatan(item.catatan);
    setFormTindakLanjut(item.rencana_tindak_lanjut);
    setIsAddingClassInline(false);
    setIsModalOpen(true);
  };

  const handleQuickAddClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const created = await apiService.ensureKelasExists(newClassName.trim(), newClassTingkat);
      const teacherClassesResult = await apiService.getTeacherTaughtClasses();
      setKelasList(teacherClassesResult.classes);
      setIsTeacherFiltered(teacherClassesResult.isFiltered);
      setFormKelasId(created.kelas_id);
      setNewClassName('');
      setIsAddingClassInline(false);
      showToast(`Kelas ${created.nama_kelas} berhasil ditambahkan!`);
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan kelas', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanggal || !formKelasId || !formMateri.trim() || !formMapelName.trim()) {
      showToast('Tanggal, Kelas, Mapel, dan Materi Pembelajaran wajib diisi', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const mapelObj = await apiService.ensureMapelExists(formMapelName.trim());
      const currentUser = apiService.getCurrentUser();

      const payload: JurnalMengajar = {
        jurnal_id: editingId || `JRN-${formTanggal.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        tanggal: formTanggal,
        kelas_id: formKelasId,
        mapel_id: mapelObj.mapel_id,
        jam_ke: selectedJamKe.join(','),
        materi_pembelajaran: formMateri.trim(),
        catatan: formCatatan.trim(),
        rencana_tindak_lanjut: formTindakLanjut.trim(),
        guru_id: currentUser?.guru_id || 'GURU-ADMIN',
        created_at: new Date().toISOString(),
      };

      const res = await apiService.saveJurnal(payload);
      if (res.success) {
        showToast(res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus rekaman jurnal mengajar ini?')) {
      const res = await apiService.deleteJurnal(id);
      if (res.success) {
        showToast(res.message);
        loadData();
      }
    }
  };

  const filteredList = jurnalList.filter((j) => {
    const matchKelas = selectedKelasFilter === 'ALL' || j.kelas_id === selectedKelasFilter;
    const matchSearch =
      !searchQuery ||
      j.materi_pembelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.catatan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKelas && matchSearch;
  });

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Jurnal Mengajar Harian
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi proses pembelajaran tatap muka, materi pokok, catatan kelas, dan tindak lanjut PBM
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Jurnal Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 shrink-0">Filter Kelas:</span>
          {isTeacherFiltered && (
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
              Kelas Diampu ({kelasList.length})
            </span>
          )}
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
          >
            <option value="ALL">Semua Kelas ({jurnalList.length} Entri)</option>
            {kelasList.map((k) => (
              <option key={k.kelas_id} value={k.kelas_id}>
                Kelas {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi atau catatan PBM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Journal Cards List */}
      <div className="space-y-3.5">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Belum ada jurnal mengajar</p>
            <p className="text-xs text-slate-500 mt-1">
              Klik tombol &quot;Tulis Jurnal Baru&quot; untuk mencatat materi pembelajaran hari ini.
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.jurnal_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-teal-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-bold text-xs">
                    Kelas {item.nama_kelas}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                    Jam Ke: {item.jam_ke}
                  </span>
                  <span className="text-xs font-semibold text-teal-700">
                    {item.nama_mapel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>{item.tanggal}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-slate-400 hover:text-teal-600 rounded"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.jurnal_id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Materi Pokok */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {item.materi_pembelajaran}
                </h3>
              </div>

              {/* Catatan PBM & Tindak Lanjut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {item.catatan && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-semibold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                      Catatan Pembelajaran:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{item.catatan}</p>
                  </div>
                )}

                {item.rencana_tindak_lanjut && (
                  <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/80">
                    <span className="font-semibold text-teal-800 block mb-1 text-[11px] uppercase tracking-wider">
                      Rencana Tindak Lanjut:
                    </span>
                    <p className="text-teal-900 leading-relaxed">{item.rencana_tindak_lanjut}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Jurnal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header (Fixed) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0 bg-slate-50/60">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>{editingId ? 'Edit Jurnal Mengajar' : 'Catat Jurnal Mengajar Baru'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi materi pembelajaran tatap muka, catatan kelas, dan rencana tindak lanjut.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal PBM *</label>
                    <input
                      type="date"
                      required
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Kelas *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingClassInline(!isAddingClassInline)}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAddingClassInline ? 'Tutup' : 'Tambah Kelas Baru'}</span>
                      </button>
                    </div>
                    <select
                      value={formKelasId}
                      onChange={(e) => setFormKelasId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      {kelasList.map((k) => (
                        <option key={k.kelas_id} value={k.kelas_id}>
                          Kelas {k.nama_kelas} (Tingkat {k.tingkat})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inline Add Class */}
                {isAddingClassInline && (
                  <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2">
                    <div className="text-[11px] font-bold text-teal-900 flex items-center justify-between">
                      <span>Tambahkan Kelas yang Tidak Tersedia:</span>
                      <button type="button" onClick={() => setIsAddingClassInline(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Nama (misal: X 4)"
                        className="px-2 py-1 bg-white border rounded text-xs"
                      />
                      <select
                        value={newClassTingkat}
                        onChange={(e) => setNewClassTingkat(e.target.value as any)}
                        className="px-2 py-1 bg-white border rounded text-xs font-medium"
                      >
                        <option value="X">Tingkat X</option>
                        <option value="XI">Tingkat XI</option>
                        <option value="XII">Tingkat XII</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleQuickAddClass}
                        className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold"
                      >
                        + Tambah Kelas
                      </button>
                    </div>
                  </div>
                )}

                {/* Mapel Field (Free text with suggestions) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Mata Pelajaran *</label>
                    <span className="text-[11px] text-teal-700">Bisa ketik nama mapel lain</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="jurnal-mapel-list"
                      value={formMapelName}
                      onChange={(e) => setFormMapelName(e.target.value)}
                      placeholder="Pilih atau ketik mata pelajaran..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                    <datalist id="jurnal-mapel-list">
                      {mapelList.map((m) => (
                        <option key={m.mapel_id} value={m.nama_mapel}>
                          {m.nama_mapel} ({m.kode_mapel})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Jam Ke (Multi-select) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-700">
                      Jam Pelajaran Ke (Multi-pilihan) *
                    </label>
                    <span className="text-[11px] font-bold text-teal-700">
                      Jam: {selectedJamKe.join(', ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PERIODS.map((p) => {
                      const active = selectedJamKe.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleJamKe(p)}
                          className={`py-1.5 text-center rounded-lg border font-bold text-xs transition-all ${
                            active
                              ? 'bg-teal-600 text-white border-teal-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Materi Pembelajaran */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Materi Pokok / Kompetensi Dasar / Topik *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formMateri}
                    onChange={(e) => setFormMateri(e.target.value)}
                    placeholder="Contoh: Operasi Hitung Campuran Bilangan Bulat dan Pecahan"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Proses Pembelajaran
                  </label>
                  <textarea
                    rows={2}
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    placeholder="Catatan keaktifan siswa, kendala, atau hal penting selama PBM berlangsung..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* Rencana Tindak Lanjut */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rencana Tindak Lanjut
                  </label>
                  <textarea
                    rows={2}
                    value={formTindakLanjut}
                    onChange={(e) => setFormTindakLanjut(e.target.value)}
                    placeholder="Pengayaan, remedial materi, penugasan proyek, atau bimbingan sebaya..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400 italic">
                  * Kolom bertanda bintang wajib diisi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Jurnal'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
