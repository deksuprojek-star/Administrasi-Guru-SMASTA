/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Clock,
  School,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { JadwalMengajar, Kelas, MataPelajaran } from '../types';
import { apiService } from '../services/apiService';

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export const JadwalMengajarView: React.FC = () => {
  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formHari, setFormHari] = useState<typeof DAYS[number]>('Senin');
  const [formKelasId, setFormKelasId] = useState<string>('');
  const [formMapelName, setFormMapelName] = useState<string>('');
  const [selectedJamKe, setSelectedJamKe] = useState<number[]>([1, 2]);

  // Quick Inline Add Class
  const [isAddingClassInline, setIsAddingClassInline] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTingkat, setNewClassTingkat] = useState<'X' | 'XI' | 'XII'>('X');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [j, k, m] = await Promise.all([
      apiService.getJadwalList(),
      apiService.getKelasList(),
      apiService.getMapelList(),
    ]);
    setJadwalList(j.filter((item) => item.hari !== ('Sabtu' as any)));
    setKelasList(k);
    setMapelList(m);
    if (k.length > 0 && !formKelasId) setFormKelasId(k[0].kelas_id);
    if (m.length > 0 && !formMapelName) setFormMapelName(m[0].nama_mapel);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormHari('Senin');
    setFormKelasId(kelasList[0]?.kelas_id || '');
    setFormMapelName(mapelList[0]?.nama_mapel || '');
    setSelectedJamKe([1, 2]);
    setIsAddingClassInline(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JadwalMengajar) => {
    setEditingId(item.jadwal_id);
    setFormHari(DAYS.includes(item.hari as any) ? (item.hari as any) : 'Senin');
    setFormKelasId(item.kelas_id);
    const existingMapel = mapelList.find((m) => m.mapel_id === item.mapel_id);
    setFormMapelName(existingMapel ? existingMapel.nama_mapel : item.mapel_id);
    const periods = item.jam_ke.split(',').map((p) => Number(p.trim())).filter(Boolean);
    setSelectedJamKe(periods.length ? periods : [1]);
    setIsAddingClassInline(false);
    setIsModalOpen(true);
  };

  const handleQuickAddClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const created = await apiService.ensureKelasExists(newClassName.trim(), newClassTingkat);
      const updatedClasses = await apiService.getKelasList();
      setKelasList(updatedClasses);
      setFormKelasId(created.kelas_id);
      setNewClassName('');
      setIsAddingClassInline(false);
      showToast(`Kelas ${created.nama_kelas} berhasil ditambahkan!`);
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan kelas', 'error');
    }
  };

  const toggleJamKe = (num: number) => {
    if (selectedJamKe.includes(num)) {
      if (selectedJamKe.length === 1) return; // minimal 1 jam
      setSelectedJamKe(selectedJamKe.filter((n) => n !== num));
    } else {
      setSelectedJamKe([...selectedJamKe, num].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKelasId || !formMapelName.trim() || selectedJamKe.length === 0) {
      showToast('Mohon lengkapi semua kolom isian jadwal', 'error');
      return;
    }

    // Ensure mapel exists (allows typing custom unlisted subject)
    const mapelObj = await apiService.ensureMapelExists(formMapelName.trim());
    const currentUser = apiService.getCurrentUser();

    const payload: JadwalMengajar = {
      jadwal_id: editingId || `JDW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      hari: formHari,
      kelas_id: formKelasId,
      mapel_id: mapelObj.mapel_id,
      jam_ke: selectedJamKe.join(','),
      guru_id: currentUser?.guru_id || 'GURU-ADMIN',
    };

    const res = await apiService.saveJadwal(payload);
    if (res.success) {
      showToast(res.message);
      setIsModalOpen(false);
      loadData();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDelete = async (jadwalId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal mengajar ini?')) {
      const res = await apiService.deleteJadwal(jadwalId);
      if (res.success) {
        showToast(res.message);
        loadData();
      }
    }
  };

  const filteredJadwal = selectedDayFilter === 'ALL'
    ? jadwalList
    : jadwalList.filter((j) => j.hari === selectedDayFilter);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            Jadwal Mengajar Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Susunan jam pelajaran mingguan 5 hari kerja (Senin s.d. Jumat) dan pemetaan kelas ampu PBM
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Mengajar</span>
        </button>
      </div>

      {/* Day Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedDayFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            selectedDayFilter === 'ALL'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Hari ({jadwalList.length})
        </button>
        {DAYS.map((day) => {
          const count = jadwalList.filter((j) => j.hari === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                selectedDayFilter === day
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {day} ({count})
            </button>
          );
        })}
      </div>

      {/* Weekly Schedule Visual Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const dayItems = jadwalList
            .filter((j) => j.hari === day)
            .sort((a, b) => {
              const firstA = Number(a.jam_ke.split(',')[0]);
              const firstB = Number(b.jam_ke.split(',')[0]);
              return firstA - firstB;
            });

          if (selectedDayFilter !== 'ALL' && selectedDayFilter !== day) return null;

          return (
            <div
              key={day}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
            >
              <div className="p-3.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>{day}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal-600 font-semibold">
                  {dayItems.length} Sesi
                </span>
              </div>

              <div className="p-3.5 flex-1 space-y-2.5">
                {dayItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    Tidak ada jadwal mengajar
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <div
                      key={item.jadwal_id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50/40 hover:border-teal-300 transition-all flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                            Jam Ke: {item.jam_ke}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Kelas {item.nama_kelas}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-teal-700">
                          {item.nama_mapel}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.jadwal_id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editingId ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Konfigurasi hari (Senin - Jumat), rombel kelas ampu, mapel, dan jam pelajaran.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Hari */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hari Pelaksanaan *</label>
                <select
                  value={formHari}
                  onChange={(e) => setFormHari(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kelas & Mapel */}
              <div className="space-y-3">
                {/* Kelas Field */}
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

                  {isAddingClassInline && (
                    <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg mb-2 space-y-2">
                      <div className="text-[11px] font-bold text-teal-900 flex items-center justify-between">
                        <span>Tambah Kelas Cepat</span>
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
                          + Tambah
                        </button>
                      </div>
                    </div>
                  )}

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
                      list="jadwal-mapel-list"
                      value={formMapelName}
                      onChange={(e) => setFormMapelName(e.target.value)}
                      placeholder="Pilih atau ketik mata pelajaran..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                    <datalist id="jadwal-mapel-list">
                      {mapelList.map((m) => (
                        <option key={m.mapel_id} value={m.nama_mapel}>
                          {m.nama_mapel} ({m.kode_mapel})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Jam Ke (Multi-select pills 1 - 10) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">
                    Pilih Jam Ke (Dapat memilih lebih dari satu jam) *
                  </label>
                  <span className="text-[11px] font-bold text-teal-700">
                    Terpilih: Jam {selectedJamKe.join(', ') || 'Belum dipilih'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {PERIODS.map((period) => {
                    const isSelected = selectedJamKe.includes(period);
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => toggleJamKe(period)}
                        className={`py-2 text-center rounded-lg border font-bold text-xs transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Jam {period}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
