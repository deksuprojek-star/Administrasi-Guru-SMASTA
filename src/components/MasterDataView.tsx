/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  School,
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  GraduationCap,
  KeyRound,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
import { Kelas, MataPelajaran, Siswa, UserAccount } from '../types';
import { apiService } from '../services/apiService';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'kelas' | 'mapel' | 'pengguna'>('siswa');
  const currentUser = apiService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('ALL');
  const [selectedTingkatFilterKelas, setSelectedTingkatFilterKelas] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Siswa
  const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [siswaForm, setSiswaForm] = useState<Partial<Siswa>>({
    nis: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    kelas_id: '',
    status: 'Aktif',
  });

  // Modal State for Kelas
  const [isKelasModalOpen, setIsKelasModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [kelasForm, setKelasForm] = useState<Partial<Kelas>>({
    kelas_id: '',
    nama_kelas: '',
    tingkat: 'X',
    tahun_ajaran: '2026/2027',
  });

  // Modal State for Mapel
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const [mapelForm, setMapelForm] = useState<Partial<MataPelajaran>>({
    mapel_id: '',
    kode_mapel: '',
    nama_mapel: '',
    tingkat: 'X, XI, XII',
    kkm_default: 75,
  });

  // Modal State for User Accounts & Roles
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userForm, setUserForm] = useState<Partial<UserAccount & { mata_pelajaran?: string; jabatan?: string; telepon?: string }>>({
    username: '',
    password: '',
    nama_guru: '',
    role: 'guru',
    nip: '',
    email: '',
    mata_pelajaran: 'Matematika',
    jabatan: 'Guru Pengajar',
    telepon: '',
    status_aktif: true,
  });

  // Reset Password Modal
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTargetKelas, setImportTargetKelas] = useState('');

  useEffect(() => {
    loadAllData();
    const handleDataChanged = () => {
      loadAllData();
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, []);

  const loadAllData = async () => {
    try {
      const [k, m, s, u] = await Promise.all([
        apiService.getKelasList(),
        apiService.getMapelList(),
        apiService.getSiswaList(),
        apiService.getUserList(),
      ]);
      setKelasList(k);
      setMapelList(m);
      setSiswaList(s);
      setUserList(u);
      if (k.length > 0 && !importTargetKelas) {
        setImportTargetKelas(k[0].kelas_id);
        setSiswaForm((prev) => ({ ...prev, kelas_id: k[0].kelas_id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- USER ACCOUNT HANDLERS (ADMIN ONLY) ---
  const handleOpenAddUser = () => {
    if (!isAdmin) {
      showToast('Hanya Administrator yang memiliki wewenang menambahkan data akun guru atau admin.', 'error');
      return;
    }
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      nama_guru: '',
      role: 'guru',
      nip: '',
      email: '',
      mata_pelajaran: mapelList[0]?.nama_mapel || 'Matematika',
      jabatan: 'Guru Pengajar',
      telepon: '',
      status_aktif: true,
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserAccount) => {
    if (!isAdmin) {
      showToast('Hanya Administrator yang memiliki wewenang mengedit data akun pengguna.', 'error');
      return;
    }
    setEditingUser(user);
    setUserForm({
      user_id: user.user_id,
      guru_id: user.guru_id,
      username: user.username,
      nama_guru: user.nama_guru,
      role: user.role,
      nip: user.nip || '',
      email: user.email || '',
      mata_pelajaran: (user as any).mata_pelajaran || 'Matematika',
      jabatan: (user as any).jabatan || (user.role === 'admin' ? 'Administrator Sistem' : 'Guru Pengajar'),
      telepon: (user as any).telepon || '',
      status_aktif: user.status_aktif !== false,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Hanya Administrator yang memiliki wewenang menyimpan akun pengguna.', 'error');
      return;
    }

    if (!userForm.username || !userForm.nama_guru || !userForm.role) {
      showToast('Username, Nama Lengkap, dan Role wajib diisi', 'error');
      return;
    }

    if (!editingUser && !userForm.password) {
      showToast('Kata sandi awal wajib diisi untuk akun baru', 'error');
      return;
    }

    const payload: any = {
      user_id: editingUser?.user_id || 'USR-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      username: userForm.username.trim(),
      password: userForm.password ? userForm.password.trim() : editingUser?.password || 'guru123',
      guru_id: editingUser?.guru_id || 'GURU-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      role: (userForm.role as 'admin' | 'guru') || 'guru',
      nama_guru: userForm.nama_guru.trim(),
      nip: userForm.nip?.trim(),
      email: userForm.email?.trim(),
      mata_pelajaran: userForm.mata_pelajaran || (userForm.role === 'admin' ? 'Teknologi Informasi' : 'Matematika'),
      jabatan: userForm.jabatan || (userForm.role === 'admin' ? 'Administrator Sistem' : 'Guru Pengajar'),
      telepon: userForm.telepon?.trim() || '',
      status_aktif: userForm.status_aktif !== false,
      created_at: editingUser?.created_at || new Date().toISOString(),
    };

    const res = await apiService.saveUser(payload);
    if (res.success) {
      showToast(res.message);
      setIsUserModalOpen(false);
      loadAllData();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (!isAdmin) {
      showToast('Hanya Administrator yang berwenang menghapus akun.', 'error');
      return;
    }

    if (confirm(`Yakin ingin menghapus akun ${user.nama_guru} (${user.role.toUpperCase()})?`)) {
      const res = await apiService.deleteUser(user.user_id);
      if (res.success) {
        showToast(res.message);
        loadAllData();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const handleOpenResetPassword = (user: UserAccount) => {
    if (!isAdmin) {
      showToast('Hanya Administrator yang berwenang mereset kata sandi akun.', 'error');
      return;
    }
    setTargetResetUser(user);
    setNewPasswordInput('');
    setIsResetPasswordModalOpen(true);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Hanya Administrator yang berwenang mereset kata sandi akun.', 'error');
      return;
    }

    if (!targetResetUser || !newPasswordInput.trim()) {
      showToast('Masukkan kata sandi baru', 'error');
      return;
    }

    const res = await apiService.resetUserPassword(targetResetUser.user_id, newPasswordInput.trim());
    if (res.success) {
      showToast(res.message);
      setIsResetPasswordModalOpen(false);
      loadAllData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // --- SISWA HANDLERS ---
  const handleOpenAddSiswa = () => {
    setEditingSiswa(null);
    setSiswaForm({
      nis: '',
      nama_lengkap: '',
      jenis_kelamin: 'L',
      kelas_id: selectedKelasFilter !== 'ALL' ? selectedKelasFilter : kelasList[0]?.kelas_id || '',
      status: 'Aktif',
    });
    setIsSiswaModalOpen(true);
  };

  const handleOpenEditSiswa = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setSiswaForm({ ...siswa });
    setIsSiswaModalOpen(true);
  };

  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaForm.nis || !siswaForm.nama_lengkap || !siswaForm.kelas_id) {
      showToast('NIS, Nama Lengkap, dan Kelas wajib diisi', 'error');
      return;
    }

    const payload: Siswa = {
      siswa_id: editingSiswa?.siswa_id || `SIS-${siswaForm.kelas_id}-${siswaForm.nis}`,
      nis: siswaForm.nis,
      nama_lengkap: siswaForm.nama_lengkap,
      jenis_kelamin: (siswaForm.jenis_kelamin as 'L' | 'P') || 'L',
      kelas_id: siswaForm.kelas_id,
      status: (siswaForm.status as any) || 'Aktif',
    };

    const res = await apiService.saveSiswa(payload);
    if (res.success) {
      showToast(res.message);
      setIsSiswaModalOpen(false);
      loadAllData();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteSiswa = async (siswaId: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus data siswa "${nama}"?`)) {
      const res = await apiService.deleteSiswa(siswaId);
      if (res.success) {
        showToast(res.message);
        loadAllData();
      }
    }
  };

  // --- KELAS HANDLERS ---
  const handleOpenAddKelas = () => {
    setEditingKelas(null);
    setKelasForm({
      kelas_id: '',
      nama_kelas: '',
      tingkat: 'X',
      tahun_ajaran: '2026/2027',
    });
    setIsKelasModalOpen(true);
  };

  const handleOpenEditKelas = (k: Kelas) => {
    setEditingKelas(k);
    setKelasForm({
      kelas_id: k.kelas_id,
      nama_kelas: k.nama_kelas,
      tingkat: k.tingkat || 'X',
      tahun_ajaran: k.tahun_ajaran || '2026/2027',
    });
    setIsKelasModalOpen(true);
  };

  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasForm.nama_kelas?.trim()) {
      showToast('Nama kelas wajib diisi', 'error');
      return;
    }
    const trimmedName = kelasForm.nama_kelas.trim();
    const cleanId =
      editingKelas?.kelas_id ||
      kelasForm.kelas_id ||
      `KLS-${trimmedName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

    const payload: Kelas = {
      kelas_id: cleanId,
      nama_kelas: trimmedName,
      tingkat: (kelasForm.tingkat as any) || 'X',
      tahun_ajaran: kelasForm.tahun_ajaran || '2026/2027',
      jumlah_siswa: editingKelas?.jumlah_siswa || 0,
    };

    const res = await apiService.saveKelas(payload);
    if (res.success) {
      showToast(res.message);
      setIsKelasModalOpen(false);
      loadAllData();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteKelas = async (kelasId: string) => {
    if (confirm(`Yakin ingin menghapus kelas ini? Siswa yang terkait tidak akan terhapus otomatis.`)) {
      const res = await apiService.deleteKelas(kelasId);
      if (res.success) {
        showToast(res.message);
        loadAllData();
      }
    }
  };

  // --- MAPEL HANDLERS ---
  const handleOpenAddMapel = () => {
    setEditingMapel(null);
    setMapelForm({
      mapel_id: '',
      kode_mapel: '',
      nama_mapel: '',
      tingkat: 'X, XI, XII',
      kkm_default: 75,
    });
    setIsMapelModalOpen(true);
  };

  const handleOpenEditMapel = (m: MataPelajaran) => {
    setEditingMapel(m);
    setMapelForm({
      mapel_id: m.mapel_id,
      kode_mapel: m.kode_mapel,
      nama_mapel: m.nama_mapel,
      tingkat: m.tingkat || 'X, XI, XII',
      kkm_default: m.kkm_default || 75,
    });
    setIsMapelModalOpen(true);
  };

  const handleSaveMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelForm.nama_mapel || !mapelForm.kode_mapel) {
      showToast('Kode dan Nama Mapel wajib diisi', 'error');
      return;
    }
    const cleanId =
      editingMapel?.mapel_id ||
      mapelForm.mapel_id ||
      `MP-${mapelForm.kode_mapel.toUpperCase().replace(/\s+/g, '')}`;

    const payload: MataPelajaran = {
      mapel_id: cleanId,
      kode_mapel: mapelForm.kode_mapel.toUpperCase().trim(),
      nama_mapel: mapelForm.nama_mapel.trim(),
      tingkat: mapelForm.tingkat || 'X, XI, XII',
      kkm_default: Number(mapelForm.kkm_default) || 75,
    };
    const res = await apiService.saveMapel(payload);
    if (res.success) {
      showToast(res.message);
      setIsMapelModalOpen(false);
      loadAllData();
    }
  };

  const handleDeleteMapel = async (mapelId: string, namaMapel: string) => {
    if (confirm(`Yakin ingin menghapus mata pelajaran "${namaMapel}"?`)) {
      const res = await apiService.deleteMapel(mapelId);
      if (res.success) {
        showToast(res.message);
        loadAllData();
      }
    }
  };

  // --- BATCH IMPORT SISWA ---
  const handleBatchImport = async () => {
    if (!importText.trim() || !importTargetKelas) {
      showToast('Silakan pilih kelas dan masukkan teks data siswa', 'error');
      return;
    }

    const lines = importText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Siswa[] = [];

    lines.forEach((line) => {
      // Supports tab-separated or comma-separated: NIS, Nama Lengkap, JK (L/P)
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 2) {
        const nis = parts[0].trim();
        const nama = parts[1].trim();
        const jk = parts[2]?.trim().toUpperCase().startsWith('P') ? 'P' : 'L';

        if (nis && nama) {
          parsed.push({
            siswa_id: `SIS-${importTargetKelas}-${nis}`,
            nis,
            nama_lengkap: nama,
            jenis_kelamin: jk,
            kelas_id: importTargetKelas,
            status: 'Aktif',
          });
        }
      }
    });

    if (parsed.length === 0) {
      showToast('Tidak ada data siswa yang valid dalam format yang dimasukkan', 'error');
      return;
    }

    const res = await apiService.importSiswaBatch(parsed);
    if (res.success) {
      showToast(res.message);
      setIsImportModalOpen(false);
      setImportText('');
      loadAllData();
    }
  };

  // Filtered Siswa
  const filteredSiswa = siswaList.filter((s) => {
    const matchKelas = selectedKelasFilter === 'ALL' || s.kelas_id === selectedKelasFilter;
    const matchQuery =
      !searchQuery ||
      s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery);
    return matchKelas && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Master & Peserta Didik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data terpusat master kelas, mata pelajaran, dan biodata siswa (Google Sheets DB)
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'siswa'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Siswa ({siswaList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kelas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'kelas'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Master Kelas ({kelasList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mapel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'mapel'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mata Pelajaran ({mapelList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pengguna')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'pengguna'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Akun & Role ({userList.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: DATA SISWA --- */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Filter Kelas */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-teal-600" />
                <span>Kelas:</span>
              </div>
              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
              >
                <option value="ALL">Semua Kelas ({siswaList.length} Siswa)</option>
                {kelasList.map((k) => (
                  <option key={k.kelas_id} value={k.kelas_id}>
                    Kelas {k.nama_kelas} ({k.jumlah_siswa || 0} Siswa)
                  </option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NIS / Nama Siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Nama Siswa</span>
              </button>

              <button
                onClick={handleOpenAddSiswa}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">NIS</th>
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-4 text-center">L/P</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data siswa ditemukan untuk kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    filteredSiswa.map((siswa, idx) => (
                      <tr key={siswa.siswa_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                          <div>{siswa.nis}</div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {siswa.nama_lengkap}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block w-5 h-5 rounded-full text-[10px] font-bold leading-5 text-center ${
                              siswa.jenis_kelamin === 'L'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {siswa.jenis_kelamin}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                            Kelas {siswa.nama_kelas || siswa.kelas_id}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {siswa.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditSiswa(siswa)}
                              className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSiswa(siswa.siswa_id, siswa.nama_lengkap)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Hapus Siswa"
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
        </div>
      )}

      {/* --- TAB 2: MASTER KELAS --- */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                Daftar rombongan belajar (Rombel) SMA (Tingkat X, XI, XII) terurut otomatis dari terkecil ke terbesar.
              </p>
              {/* Filter Tingkat Pills */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Filter:</span>
                {(['ALL', 'X', 'XI', 'XII'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTingkatFilterKelas(t)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      selectedTingkatFilterKelas === t
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'ALL' ? `Semua (${kelasList.length})` : `Tingkat ${t} (${kelasList.filter((k) => k.tingkat === t).length})`}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleOpenAddKelas}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kelasList
              .filter((k) => selectedTingkatFilterKelas === 'ALL' || k.tingkat === selectedTingkatFilterKelas)
              .map((k) => (
                <div
                  key={k.kelas_id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        Tingkat {k.tingkat}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditKelas(k)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded transition-colors"
                          title="Edit Nama / Data Kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKelas(k.kelas_id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-xl font-bold text-slate-900">Kelas {k.nama_kelas}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Jumlah: <span className="font-bold text-teal-700">{k.jumlah_siswa || 0} Siswa</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tahun Ajaran: {k.tahun_ajaran}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>ID: {k.kelas_id}</span>
                    <button
                      onClick={() => handleOpenEditKelas(k)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Nama</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: MATA PELAJARAN --- */}
      {activeTab === 'mapel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Daftar mata pelajaran kurikulum dan batas KKTP kelulusan standar.
            </p>
            <button
              onClick={handleOpenAddMapel}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Mapel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapelList.map((m) => (
              <div key={m.mapel_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {m.kode_mapel}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        KKTP: {m.kkm_default}
                      </span>
                      <button
                        onClick={() => handleOpenEditMapel(m)}
                        className="p-1 text-slate-400 hover:text-teal-600 rounded transition-colors"
                        title="Edit Mata Pelajaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMapel(m.mapel_id, m.nama_mapel)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Hapus Mata Pelajaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{m.nama_mapel}</h3>
                  <p className="text-xs text-slate-500 mt-1">Sasaran: Tingkat {m.tingkat}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ID: {m.mapel_id}</span>
                  <button
                    onClick={() => handleOpenEditMapel(m)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: AKUN & ROLE PENGGUNA (ADMIN & GURU) --- */}
      {activeTab === 'pengguna' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama akun, username, atau NIP..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Akun Pengguna</span>
                </button>
              </div>
            )}
          </div>

          {/* Role Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Total Akun Terdaftar</p>
                <p className="text-lg font-bold text-slate-900">{userList.length} Pengguna</p>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-800">Role Administrator</p>
                <p className="text-lg font-bold text-amber-900">
                  {userList.filter((u) => u.role === 'admin').length} Akun
                </p>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-teal-800">Role Guru Pengajar</p>
                <p className="text-lg font-bold text-teal-900">
                  {userList.filter((u) => u.role === 'guru').length} Akun
                </p>
              </div>
            </div>
          </div>

          {/* Table of Users */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Lengkap & Profil</th>
                    <th className="py-3 px-4">Username & NIP</th>
                    <th className="py-3 px-4">Role Sistem</th>
                    <th className="py-3 px-4">Email / Kontak</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userList
                    .filter((u) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        u.nama_guru.toLowerCase().includes(q) ||
                        u.username.toLowerCase().includes(q) ||
                        (u.nip && u.nip.includes(q))
                      );
                    })
                    .map((user) => {
                      const isRowAdmin = user.role === 'admin';
                      return (
                        <tr key={user.user_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isRowAdmin
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-teal-100 text-teal-800 border border-teal-300'
                                }`}
                              >
                                {user.nama_guru.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{user.nama_guru}</p>
                                <p className="text-[10px] text-slate-500 font-mono">ID: {user.user_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 font-mono">{user.username}</span>
                            {user.nip && (
                              <p className="text-[11px] text-slate-500">NIP: {user.nip}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isRowAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <ShieldCheck className="w-3 h-3 text-amber-700" />
                                Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                                <GraduationCap className="w-3 h-3 text-teal-700" />
                                Guru Pengajar
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {user.email ? (
                              <span>{user.email}</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum ada email</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {user.status_aktif !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <UserX className="w-3 h-3" />
                                Nonaktif
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenResetPassword(user)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Reset Kata Sandi"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditUser(user)}
                                  className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="Edit Akun"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ADD / EDIT SISWA --- */}
      {isSiswaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingSiswa ? 'Edit Biodata Siswa' : 'Tambah Siswa Baru'}
            </h2>
            <form onSubmit={handleSaveSiswa} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Siswa (NIS) *</label>
                <input
                  type="text"
                  required
                  value={siswaForm.nis}
                  onChange={(e) => setSiswaForm({ ...siswaForm, nis: e.target.value })}
                  placeholder="Contoh: 260101"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={siswaForm.nama_lengkap}
                  onChange={(e) => setSiswaForm({ ...siswaForm, nama_lengkap: e.target.value })}
                  placeholder="Nama sesuai akta / raport"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={siswaForm.jenis_kelamin}
                    onChange={(e) => setSiswaForm({ ...siswaForm, jenis_kelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas *</label>
                  <select
                    required
                    value={siswaForm.kelas_id}
                    onChange={(e) => setSiswaForm({ ...siswaForm, kelas_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {kelasList.map((k) => (
                      <option key={k.kelas_id} value={k.kelas_id}>
                        Kelas {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSiswaModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL BATCH IMPORT SISWA --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Import Massal Nama Siswa
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Salin data dari Excel/Spreadsheet (Format baris: <span className="font-mono font-bold">NIS, Nama Lengkap, JK (L/P)</span>).
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Kelas Import *</label>
                <select
                  value={importTargetKelas}
                  onChange={(e) => setImportTargetKelas(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                >
                  {kelasList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Teks Siswa (Tiap Baris Satu Siswa)</label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Contoh:\n260120, Muhammad Farhan, L\n260121, Nadya Salsabila, P\n260122, Rian Pratama, L`}
                  className="w-full p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBatchImport}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                >
                  Proses Import Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH / EDIT KELAS --- */}
      {isKelasModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editingKelas ? 'Edit Nama & Data Kelas' : 'Tambah Kelas Baru'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {editingKelas ? 'Ubah nama rombel atau tingkat kelas.' : 'Daftarkan rombel kelas baru ke dalam sistem.'}
            </p>
            <form onSubmit={handleSaveKelas} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  value={kelasForm.nama_kelas}
                  onChange={(e) => setKelasForm({ ...kelasForm, nama_kelas: e.target.value })}
                  placeholder="Contoh: X-1, XI-1, XII-1, X-12"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
                  <select
                    value={kelasForm.tingkat}
                    onChange={(e) => setKelasForm({ ...kelasForm, tingkat: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  >
                    <option value="X">Kelas X (Sepuluh)</option>
                    <option value="XI">Kelas XI (Sebelas)</option>
                    <option value="XII">Kelas XII (Dua Belas)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={kelasForm.tahun_ajaran}
                    onChange={(e) => setKelasForm({ ...kelasForm, tahun_ajaran: e.target.value })}
                    placeholder="2026/2027"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsKelasModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingKelas ? 'Simpan Perubahan' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH / EDIT MAPEL --- */}
      {isMapelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {editingMapel ? 'Perbarui nama mapel, kode, dan standar KKTP.' : 'Masukkan mata pelajaran baru ke kurikulum.'}
            </p>
            <form onSubmit={handleSaveMapel} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Mapel *</label>
                <input
                  type="text"
                  required
                  value={mapelForm.kode_mapel}
                  onChange={(e) => setMapelForm({ ...mapelForm, kode_mapel: e.target.value })}
                  placeholder="Contoh: MAT / FIS / BIO / PKWU"
                  className="w-full px-3 py-2 border rounded-lg font-medium uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  value={mapelForm.nama_mapel}
                  onChange={(e) => setMapelForm({ ...mapelForm, nama_mapel: e.target.value })}
                  placeholder="Contoh: Matematika Peminatan / Informatika"
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sasaran Tingkat</label>
                  <input
                    type="text"
                    value={mapelForm.tingkat}
                    onChange={(e) => setMapelForm({ ...mapelForm, tingkat: e.target.value })}
                    placeholder="X, XI, XII"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KKTP Default</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={mapelForm.kkm_default}
                    onChange={(e) => setMapelForm({ ...mapelForm, kkm_default: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsMapelModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingMapel ? 'Simpan Perubahan' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL USER ADD / EDIT --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
              </h2>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={userForm.nama_guru}
                  onChange={(e) => setUserForm({ ...userForm, nama_guru: e.target.value })}
                  placeholder="Contoh: Dra. Ni Wayan Sukerti, M.Pd."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Akun *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'guru' })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="guru">Guru Pengajar</option>
                    <option value="admin">Administrator Sistem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={userForm.status_aktif ? 'true' : 'false'}
                    onChange={(e) => setUserForm({ ...userForm, status_aktif: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="Contoh: sukerti"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={userForm.nip || ''}
                    onChange={(e) => setUserForm({ ...userForm, nip: e.target.value })}
                    placeholder="19840101 200801 2 001"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal *</label>
                  <input
                    type="password"
                    required
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              )}

              {userForm.role === 'guru' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran Diampu</label>
                    <select
                      value={userForm.mata_pelajaran}
                      onChange={(e) => setUserForm({ ...userForm, mata_pelajaran: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      {mapelList.map((m) => (
                        <option key={m.mapel_id} value={m.nama_mapel}>
                          {m.nama_mapel} ({m.kode_mapel})
                        </option>
                      ))}
                      <option value="Matematika">Matematika</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Bahasa Inggris">Bahasa Inggris</option>
                      <option value="Informatika">Informatika</option>
                      <option value="IPA (Fisika/Biologi/Kimia)">IPA (Fisika/Biologi/Kimia)</option>
                      <option value="IPS (Sejarah/Geografi/Ekonomi/Sosiologi)">IPS (Sejarah/Geografi/Ekonomi/Sosiologi)</option>
                      <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                      <option value="Pendidikan Agama & Budi Pekerti">Pendidikan Agama & Budi Pekerti</option>
                      <option value="PJOK">PJOK</option>
                      <option value="Seni Budaya">Seni Budaya</option>
                      <option value="Bimbingan Konseling (BK)">Bimbingan Konseling (BK)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jabatan / Tugas</label>
                    <input
                      type="text"
                      value={userForm.jabatan || ''}
                      onChange={(e) => setUserForm({ ...userForm, jabatan: e.target.value })}
                      placeholder="Guru Pengajar / Wali Kelas"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {userForm.role === 'admin' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan Administrator</label>
                  <input
                    type="text"
                    value={userForm.jabatan || ''}
                    onChange={(e) => setUserForm({ ...userForm, jabatan: e.target.value })}
                    placeholder="Administrator Sistem & TI"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email || ''}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="nama@sman1tabanan.sch.id"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={userForm.telepon || ''}
                    onChange={(e) => setUserForm({ ...userForm, telepon: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 border rounded-lg font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingUser ? 'Perbarui Akun' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL RESET PASSWORD --- */}
      {isResetPasswordModalOpen && targetResetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Reset Kata Sandi</h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Atur ulang kata sandi baru untuk <strong>{targetResetUser.nama_guru}</strong> ({targetResetUser.username}).
            </p>
            <form onSubmit={handleSaveResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru *</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
