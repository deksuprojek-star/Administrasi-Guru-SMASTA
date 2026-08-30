/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Calendar,
  School,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  HeartHandshake,
  Users,
  UserPlus,
  BookOpen,
  HelpCircle,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react';
import { BimbinganSiswa, Kelas, Siswa, JenisBimbingan, SiswaAsuhRecord } from '../types';
import { apiService } from '../services/apiService';

const JENIS_BIMBINGAN: JenisBimbingan[] = [
  'Akademik',
  'Karakter',
  'Sosial',
  'Kedisiplinan',
  'Karir',
  'Pribadi',
  'Lainnya',
];

export const BimbinganSiswaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bimbingan' | 'siswa_asuh'>('bimbingan');
  const [bimbinganList, setBimbinganList] = useState<BimbinganSiswa[]>([]);
  const [siswaAsuhList, setSiswaAsuhList] = useState<SiswaAsuhRecord[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  
  // Modals & form state
  const [isModalBimbinganOpen, setIsModalBimbinganOpen] = useState(false);
  const [isModalSiswaAsuhOpen, setIsModalSiswaAsuhOpen] = useState(false);
  const [editingBimbinganId, setEditingBimbinganId] = useState<string | null>(null);
  const [editingAsuhId, setEditingAsuhId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAsuhQuery, setSearchAsuhQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Bimbingan
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formInputMode, setFormInputMode] = useState<'asuh' | 'kelas' | 'manual'>('asuh');
  const [formAsuhId, setFormAsuhId] = useState('');
  const [formKelasId, setFormKelasId] = useState('');
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formManualNis, setFormManualNis] = useState('');
  const [formManualNama, setFormManualNama] = useState('');
  const [formManualKelas, setFormManualKelas] = useState('');
  const [formJenis, setFormJenis] = useState<JenisBimbingan>('Akademik');
  const [formMasalah, setFormMasalah] = useState('');
  const [formSolusi, setFormSolusi] = useState('');
  const [formTindakLanjut, setFormTindakLanjut] = useState('');

  // Form Siswa Asuh
  const [formAsuhNis, setFormAsuhNis] = useState('');
  const [formAsuhNama, setFormAsuhNama] = useState('');
  const [formAsuhKelas, setFormAsuhKelas] = useState('');
  const [formAsuhJK, setFormAsuhJK] = useState<'L' | 'P'>('L');
  const [formAsuhCatatan, setFormAsuhCatatan] = useState('');
  const [selectedFromMasterSiswa, setSelectedFromMasterSiswa] = useState('');

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
    const [b, asuh, k, s] = await Promise.all([
      apiService.getBimbinganList(),
      apiService.getSiswaAsuhList(),
      apiService.getKelasList(),
      apiService.getSiswaList(),
    ]);
    setBimbinganList(b);
    setSiswaAsuhList(asuh);
    setKelasList(k);
    setSiswaList(s);
    
    if (k.length > 0 && !formKelasId) setFormKelasId(k[0].kelas_id);
    if (k.length > 0 && !formAsuhKelas) setFormAsuhKelas(k[0].nama_kelas);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // --- HANDLERS FOR BIMBINGAN ---
  const handleOpenAddBimbingan = () => {
    setEditingBimbinganId(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    if (siswaAsuhList.length > 0) {
      setFormInputMode('asuh');
      setFormAsuhId(siswaAsuhList[0].asuh_id);
    } else {
      setFormInputMode('kelas');
      const firstK = kelasList[0]?.kelas_id || '';
      setFormKelasId(firstK);
      const stds = siswaList.filter((s) => s.kelas_id === firstK);
      setFormSiswaId(stds[0]?.siswa_id || '');
    }
    setFormJenis('Akademik');
    setFormMasalah('');
    setFormSolusi('');
    setFormTindakLanjut('');
    setIsModalBimbinganOpen(true);
  };

  const handleOpenEditBimbingan = (item: BimbinganSiswa) => {
    setEditingBimbinganId(item.bimbingan_id);
    setFormTanggal(item.tanggal);
    setFormInputMode('manual');
    setFormManualNis(item.nis);
    setFormManualNama(item.nama_siswa);
    setFormManualKelas(item.nama_kelas || item.kelas_id);
    setFormJenis(item.jenis_bimbingan);
    setFormMasalah(item.masalah_observasi || item.masalah_bimbingan || '');
    setFormSolusi(item.solusi_rekomendasi || '');
    setFormTindakLanjut(item.tindak_lanjut || item.rencana_tindak_lanjut || '');
    setIsModalBimbinganOpen(true);
  };

  const handleSubmitBimbingan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanggal || !formMasalah.trim()) {
      showToast('Mohon lengkapi tanggal dan uraian masalah bimbingan', 'error');
      return;
    }

    let nis = '';
    let nama_siswa = '';
    let nama_kelas = '';
    let kelas_id = '';
    let siswa_id = '';

    if (formInputMode === 'asuh') {
      const selectedAsuh = siswaAsuhList.find((a) => a.asuh_id === formAsuhId);
      if (!selectedAsuh) {
        showToast('Pilih siswa bimbingan/asuh yang valid', 'error');
        return;
      }
      nis = selectedAsuh.nis;
      nama_siswa = selectedAsuh.nama_lengkap;
      nama_kelas = selectedAsuh.nama_kelas;
      kelas_id = selectedAsuh.nama_kelas;
      siswa_id = selectedAsuh.siswa_id || `ASUH-${selectedAsuh.nis}`;
    } else if (formInputMode === 'kelas') {
      const selectedS = siswaList.find((s) => s.siswa_id === formSiswaId);
      if (!selectedS) {
        showToast('Pilih siswa dari kelas yang valid', 'error');
        return;
      }
      nis = selectedS.nis;
      nama_siswa = selectedS.nama_lengkap;
      const kObj = kelasList.find((k) => k.kelas_id === formKelasId);
      nama_kelas = kObj?.nama_kelas || formKelasId;
      kelas_id = formKelasId;
      siswa_id = selectedS.siswa_id;
    } else {
      if (!formManualNama.trim()) {
        showToast('Masukkan nama siswa bimbingan', 'error');
        return;
      }
      nis = formManualNis.trim() || `NIS-${Date.now().toString().slice(-4)}`;
      nama_siswa = formManualNama.trim();
      nama_kelas = formManualKelas.trim() || 'Umum';
      kelas_id = formManualKelas.trim() || 'Umum';
      siswa_id = `MAN-${nis}`;
    }

    setIsSaving(true);
    const payload: BimbinganSiswa = {
      bimbingan_id: editingBimbinganId || `BIM-${Date.now()}-${nis}`,
      tanggal: formTanggal,
      siswa_id,
      nis,
      nama_siswa,
      kelas_id,
      nama_kelas,
      jenis_bimbingan: formJenis,
      masalah_observasi: formMasalah.trim(),
      solusi_rekomendasi: formSolusi.trim(),
      tindak_lanjut: formTindakLanjut.trim(),
      guru_id: apiService.getCurrentUser()?.guru_id || 'GURU-ADMIN',
      created_at: new Date().toISOString(),
    };

    try {
      const res = await apiService.saveBimbingan(payload);
      if (res.success) {
        showToast(res.message);
        setIsModalBimbinganOpen(false);
        loadData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBimbingan = async (id: string) => {
    if (confirm('Yakin ingin menghapus rekaman bimbingan siswa ini?')) {
      const res = await apiService.deleteBimbingan(id);
      if (res.success) {
        showToast(res.message);
        loadData();
      }
    }
  };

  // --- HANDLERS FOR SISWA ASUH (GURU WALI INPUT MANUALLY) ---
  const handleOpenAddAsuh = () => {
    setEditingAsuhId(null);
    setFormAsuhNis('');
    setFormAsuhNama('');
    setFormAsuhKelas(kelasList[0]?.nama_kelas || 'X-1');
    setFormAsuhJK('L');
    setFormAsuhCatatan('');
    setSelectedFromMasterSiswa('');
    setIsModalSiswaAsuhOpen(true);
  };

  const handleOpenEditAsuh = (asuh: SiswaAsuhRecord) => {
    setEditingAsuhId(asuh.asuh_id);
    setFormAsuhNis(asuh.nis);
    setFormAsuhNama(asuh.nama_lengkap);
    setFormAsuhKelas(asuh.nama_kelas);
    setFormAsuhJK(asuh.jenis_kelamin || 'L');
    setFormAsuhCatatan(asuh.catatan_khusus || '');
    setSelectedFromMasterSiswa('');
    setIsModalSiswaAsuhOpen(true);
  };

  const handlePickFromMasterSiswa = (siswaId: string) => {
    setSelectedFromMasterSiswa(siswaId);
    if (!siswaId) return;
    const found = siswaList.find((s) => s.siswa_id === siswaId);
    if (found) {
      setFormAsuhNis(found.nis);
      setFormAsuhNama(found.nama_lengkap);
      const kObj = kelasList.find((k) => k.kelas_id === found.kelas_id);
      setFormAsuhKelas(kObj?.nama_kelas || found.kelas_id);
      setFormAsuhJK(found.jenis_kelamin as 'L' | 'P');
    }
  };

  const handleSubmitAsuh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAsuhNama.trim()) {
      showToast('Nama siswa asuh wajib diisi', 'error');
      return;
    }

    setIsSaving(true);
    const currentUser = apiService.getCurrentUser();
    const payload: Partial<SiswaAsuhRecord> = {
      asuh_id: editingAsuhId || undefined,
      guru_id: currentUser?.guru_id || 'GURU-ADMIN',
      siswa_id: selectedFromMasterSiswa || undefined,
      nis: formAsuhNis.trim() || `ASUH-${Date.now().toString().slice(-4)}`,
      nama_lengkap: formAsuhNama.trim(),
      nama_kelas: formAsuhKelas.trim(),
      jenis_kelamin: formAsuhJK,
      catatan_khusus: formAsuhCatatan.trim(),
    };

    try {
      const res = await apiService.saveSiswaAsuh(payload);
      if (res.success) {
        showToast(res.message);
        setIsModalSiswaAsuhOpen(false);
        loadData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsuh = async (asuhId: string) => {
    if (confirm('Hapus siswa ini dari daftar siswa asuh/bimbingan wali?')) {
      const res = await apiService.deleteSiswaAsuh(asuhId);
      if (res.success) {
        showToast(res.message);
        loadData();
      }
    }
  };

  // Filtered Lists
  const filteredBimbingan = bimbinganList.filter((b) => {
    const matchKelas = selectedKelasFilter === 'ALL' || b.kelas_id === selectedKelasFilter || b.nama_kelas === selectedKelasFilter;
    const matchSearch =
      !searchQuery ||
      b.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nis.includes(searchQuery) ||
      (b.masalah_observasi && b.masalah_observasi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchKelas && matchSearch;
  });

  const filteredAsuh = siswaAsuhList.filter((a) => {
    if (!searchAsuhQuery) return true;
    const q = searchAsuhQuery.toLowerCase();
    return (
      a.nama_lengkap.toLowerCase().includes(q) ||
      a.nis.includes(q) ||
      a.nama_kelas.toLowerCase().includes(q) ||
      (a.catatan_khusus && a.catatan_khusus.toLowerCase().includes(q))
    );
  });

  const classStudents = siswaList.filter((s) => s.kelas_id === formKelasId);

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-teal-600" />
            <span>Bimbingan Siswa & Layanan Guru Asuh / Guru Wali</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data siswa asuh mandiri dan catat agenda bimbingan karakter, akademik, serta kedisiplinan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'bimbingan' ? (
            <button
              onClick={handleOpenAddBimbingan}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Bimbingan Baru</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddAsuh}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa Asuh Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('bimbingan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'bimbingan'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Jurnal & Catatan Bimbingan ({bimbinganList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siswa_asuh')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'siswa_asuh'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Siswa Asuh Guru Wali ({siswaAsuhList.length})</span>
        </button>
      </div>

      {/* --- TAB 1: JURNAL BIMBINGAN --- */}
      {activeTab === 'bimbingan' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-700">Filter Kelas:</span>
              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 font-medium"
              >
                <option value="ALL">Semua Kelas ({bimbinganList.length} Catatan)</option>
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
                placeholder="Cari siswa, NIS, atau kasus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3.5">
            {filteredBimbingan.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                <HeartHandshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Belum ada catatan bimbingan</p>
                <p className="text-xs text-slate-500 mt-1">
                  Catat setiap observasi, pembinaan siswa bermasalah, atau apresiasi prestasi belajar.
                </p>
                <button
                  onClick={handleOpenAddBimbingan}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold hover:bg-teal-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Bimbingan Sekarang
                </button>
              </div>
            ) : (
              filteredBimbingan.map((item) => (
                <div
                  key={item.bimbingan_id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {item.nama_siswa}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        (NIS: {item.nis})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        Kelas {item.nama_kelas || item.kelas_id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        {item.jenis_bimbingan}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{item.tanggal}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBimbingan(item)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBimbingan(item.bimbingan_id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Masalah & Solusi Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80">
                      <span className="font-semibold text-amber-900 block mb-1 text-[11px] uppercase tracking-wider">
                        Masalah / Observasi:
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {item.masalah_observasi || item.masalah_bimbingan || '-'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/80">
                      <span className="font-semibold text-teal-900 block mb-1 text-[11px] uppercase tracking-wider">
                        Solusi / Rekomendasi:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{item.solusi_rekomendasi || '-'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/80">
                      <span className="font-semibold text-indigo-900 block mb-1 text-[11px] uppercase tracking-wider">
                        Tindak Lanjut & Evaluasi:
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {item.tindak_lanjut || item.rencana_tindak_lanjut || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: KELOLA SISWA ASUH GURU WALI (INPUT MANDIRI GURU) --- */}
      {activeTab === 'siswa_asuh' && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-teal-950">
                Fitur Siswa Asuh & Bimbingan Khusus Guru Wali
              </p>
              <p className="mt-1 text-teal-800 leading-relaxed">
                Guru wali dapat menginput dan menetapkan sendiri peserta didik yang menjadi anak asuh/mentee bimbingan mandiri (lintas kelas dari tingkat X, XI, hingga XII). Siswa yang ditambahkan di sini otomatis tersedia saat membuat catatan bimbingan guru.
              </p>
            </div>
          </div>

          {/* Controls for Siswa Asuh */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              Total Siswa Asuh Terdaftar: <strong className="text-teal-700 font-bold">{siswaAsuhList.length} Siswa</strong>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa asuh, NIS, atau kelas..."
                value={searchAsuhQuery}
                onChange={(e) => setSearchAsuhQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Table of Siswa Asuh */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3 w-28">NIS</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-3 w-20 text-center">L/P</th>
                  <th className="py-3 px-3 w-28">Kelas Asal</th>
                  <th className="py-3 px-4">Catatan Khusus / Latar Belakang</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAsuh.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada siswa asuh yang diinput</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik tombol "Tambah Siswa Asuh Baru" di atas untuk mendaftarkan siswa bimbingan Anda.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAsuh.map((asuh, idx) => (
                    <tr key={asuh.asuh_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{asuh.nis}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{asuh.nama_lengkap}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            asuh.jenis_kelamin === 'L'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {asuh.jenis_kelamin || 'L'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          Kelas {asuh.nama_kelas}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {asuh.catatan_khusus || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditAsuh(asuh)}
                            className="p-1 text-slate-400 hover:text-teal-600 rounded"
                            title="Edit Data Siswa Asuh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsuh(asuh.asuh_id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus Siswa Asuh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL ADD / EDIT BIMBINGAN --- */}
      {isModalBimbinganOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editingBimbinganId ? 'Edit Catatan Bimbingan' : 'Catat Bimbingan Siswa'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Pilih siswa asuh guru wali atau input siswa secara fleksibel lintas kelas.
            </p>

            <form onSubmit={handleSubmitBimbingan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Bimbingan *</label>
                  <select
                    value={formJenis}
                    onChange={(e) => setFormJenis(e.target.value as JenisBimbingan)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    {JENIS_BIMBINGAN.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Pemilihan Siswa */}
              {!editingBimbinganId && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="block font-bold text-slate-800">Metode Pemilihan Siswa:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormInputMode('asuh')}
                      className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                        formInputMode === 'asuh'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Siswa Asuh Wali ({siswaAsuhList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormInputMode('kelas')}
                      className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                        formInputMode === 'kelas'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Pilih Dari Kelas
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormInputMode('manual')}
                      className={`p-2 rounded-lg text-center font-semibold border transition-all ${
                        formInputMode === 'manual'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Ketik Manual
                    </button>
                  </div>
                </div>
              )}

              {/* Input Siswa Berdasarkan Mode */}
              {formInputMode === 'asuh' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Siswa Asuh Guru Wali *
                  </label>
                  {siswaAsuhList.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                      <p className="font-semibold">Belum ada siswa asuh yang didaftarkan.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalBimbinganOpen(false);
                          setActiveTab('siswa_asuh');
                          handleOpenAddAsuh();
                        }}
                        className="text-teal-700 font-bold underline"
                      >
                        + Tambah Siswa Asuh Sekarang
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formAsuhId}
                      onChange={(e) => setFormAsuhId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold text-teal-900"
                    >
                      {siswaAsuhList.map((a) => (
                        <option key={a.asuh_id} value={a.asuh_id}>
                          {a.nama_lengkap} (NIS: {a.nis}) • Kelas {a.nama_kelas}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {formInputMode === 'kelas' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pilih Kelas *</label>
                    <select
                      value={formKelasId}
                      onChange={(e) => {
                        const nextK = e.target.value;
                        setFormKelasId(nextK);
                        const stds = siswaList.filter((s) => s.kelas_id === nextK);
                        if (stds.length > 0) setFormSiswaId(stds[0].siswa_id);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      {kelasList.map((k) => (
                        <option key={k.kelas_id} value={k.kelas_id}>
                          Kelas {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                    <select
                      value={formSiswaId}
                      onChange={(e) => setFormSiswaId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold text-teal-900"
                    >
                      {classStudents.length === 0 ? (
                        <option value="">Tidak ada siswa</option>
                      ) : (
                        classStudents.map((s) => (
                          <option key={s.siswa_id} value={s.siswa_id}>
                            {s.nama_lengkap} ({s.nis})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              )}

              {formInputMode === 'manual' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">NIS Siswa</label>
                      <input
                        type="text"
                        placeholder="Contoh: 2026101"
                        value={formManualNis}
                        onChange={(e) => setFormManualNis(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Siswa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap..."
                        value={formManualNama}
                        onChange={(e) => setFormManualNama(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kelas Asal</label>
                      <input
                        type="text"
                        placeholder="Contoh: X-4"
                        value={formManualKelas}
                        onChange={(e) => setFormManualKelas(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Masalah */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Masalah / Observasi / Laporan Kasus *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formMasalah}
                  onChange={(e) => setFormMasalah(e.target.value)}
                  placeholder="Deskripsi masalah yang dihadapi atau perilaku yang diobservasi..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Solusi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Solusi / Arahan / Kesepakatan Bersama
                </label>
                <textarea
                  rows={2}
                  value={formSolusi}
                  onChange={(e) => setFormSolusi(e.target.value)}
                  placeholder="Langkah penyelesaian yang disepakati dengan siswa/wali murid..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Tindak Lanjut */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Tindak Lanjut & Monitoring
                </label>
                <textarea
                  rows={2}
                  value={formTindakLanjut}
                  onChange={(e) => setFormTindakLanjut(e.target.value)}
                  placeholder="Evaluasi berkala, koordinasi guru BK / orang tua..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalBimbinganOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ADD / EDIT SISWA ASUH GURU WALI --- */}
      {isModalSiswaAsuhOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editingAsuhId ? 'Edit Data Siswa Asuh' : 'Tambah Siswa Asuh Guru Wali'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Input data anak asuh/mentee bimbingan guru secara mandiri.
            </p>

            <form onSubmit={handleSubmitAsuh} className="space-y-3.5 text-xs">
              {/* Opsi Cepat: Pilih dari Database Siswa Sekolah */}
              {!editingAsuhId && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ambil Cepat dari Database Siswa (Opsional):
                  </label>
                  <select
                    value={selectedFromMasterSiswa}
                    onChange={(e) => handlePickFromMasterSiswa(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white text-slate-800 font-medium"
                  >
                    <option value="">-- Ketik manual atau pilih siswa --</option>
                    {siswaList.map((s) => (
                      <option key={s.siswa_id} value={s.siswa_id}>
                        {s.nama_lengkap} ({s.nis}) - Kelas {s.kelas_id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS Siswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: 20260401"
                    value={formAsuhNis}
                    onChange={(e) => setFormAsuhNis(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formAsuhJK}
                    onChange={(e) => setFormAsuhJK(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap siswa..."
                  value={formAsuhNama}
                  onChange={(e) => setFormAsuhNama(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas Asal Siswa *</label>
                <div className="flex gap-2">
                  <select
                    value={formAsuhKelas}
                    onChange={(e) => setFormAsuhKelas(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    {kelasList.map((k) => (
                      <option key={k.kelas_id} value={k.nama_kelas}>
                        Kelas {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ketik jika lain..."
                    value={formAsuhKelas}
                    onChange={(e) => setFormAsuhKelas(e.target.value)}
                    className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Khusus / Latar Belakang Siswa (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formAsuhCatatan}
                  onChange={(e) => setFormAsuhCatatan(e.target.value)}
                  placeholder="Contoh: Siswa tinggal dengan wali, perlu dorongan motivasi belajar..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalSiswaAsuhOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Siswa Asuh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
