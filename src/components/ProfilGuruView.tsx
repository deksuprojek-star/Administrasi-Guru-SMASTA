/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Award,
  BookOpen,
  Mail,
  Phone,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  GraduationCap,
  Layers,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';
import { GuruProfile, UserAccount, Kelas, MataPelajaran } from '../types';
import { apiService } from '../services/apiService';

interface ProfilGuruViewProps {
  guruProfile: GuruProfile;
  currentUser?: UserAccount | null;
  onProfileUpdated: (profile: GuruProfile) => void;
}

export const ProfilGuruView: React.FC<ProfilGuruViewProps> = ({
  guruProfile,
  currentUser,
  onProfileUpdated,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [formData, setFormData] = useState<GuruProfile>({ ...guruProfile });
  const [teacherList, setTeacherList] = useState<GuruProfile[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(guruProfile?.guru_id || '');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [isAddingNewKelas, setIsAddingNewKelas] = useState(false);
  const [newKelasNama, setNewKelasNama] = useState('');
  const [newKelasTingkat, setNewKelasTingkat] = useState<'X' | 'XI' | 'XII'>('X');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    const handleDataChanged = () => {
      loadData();
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [profiles, classes, mapels] = await Promise.all([
        apiService.getGuruProfileList(),
        apiService.getKelasList(),
        apiService.getMapelList(),
      ]);
      setTeacherList(profiles);
      setKelasList(classes);
      setMapelList(mapels);

      if (isAdmin) {
        // Admin default to the first teacher or current profile
        const initial = profiles.find((p) => p.guru_id === guruProfile?.guru_id) || profiles[0];
        if (initial) {
          setSelectedTeacherId(initial.guru_id);
          setFormData(initial);
        }
      } else {
        // Guru only sees their own profile
        const myProfile = await apiService.getGuruProfile(currentUser?.guru_id || currentUser?.nip);
        setFormData(myProfile || guruProfile);
        setSelectedTeacherId(myProfile?.guru_id || guruProfile?.guru_id || '');
      }
    } catch (e) {
      console.error('Error loading teacher data:', e);
    }
  };

  const handleCreateCustomKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKelasNama.trim()) return;

    try {
      const created = await apiService.ensureKelasExists(newKelasNama.trim(), newKelasTingkat);
      const updatedClasses = await apiService.getKelasList();
      setKelasList(updatedClasses);

      // Auto-select for current teacher
      const current = formData.kelas_diampu || [];
      if (!current.includes(created.kelas_id)) {
        setFormData((prev) => ({ ...prev, kelas_diampu: [...current, created.kelas_id] }));
      }
      setNewKelasNama('');
      setIsAddingNewKelas(false);
      setSaveStatus({ type: 'success', message: `Kelas "${created.nama_kelas}" berhasil ditambahkan dan dipilih!` });
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Gagal menambahkan kelas baru' });
    }
  };

  const isSelectedAdmin = formData.guru_id === 'GURU-ADMIN' || (isAdmin && (!formData.guru_id || formData.guru_id === currentUser?.guru_id));

  const handleSelectTeacherChange = async (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setSaveStatus(null);
    const selected = teacherList.find((t) => t.guru_id === teacherId);
    if (selected) {
      setFormData(selected);
    } else {
      const loaded = await apiService.getGuruProfile(teacherId);
      setFormData(loaded);
    }
  };

  const handleChange = (field: keyof GuruProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleKelasDiampu = (kelasId: string) => {
    const current = formData.kelas_diampu || [];
    const exists = current.includes(kelasId);
    const updated = exists ? current.filter((k) => k !== kelasId) : [...current, kelasId];
    setFormData((prev) => ({ ...prev, kelas_diampu: updated }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas foto maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, foto_profil_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await apiService.saveGuruProfile(formData);
      if (res.success) {
        onProfileUpdated(formData);
        // Update in teacher list state
        setTeacherList((prev) =>
          prev.map((t) => (t.guru_id === formData.guru_id ? { ...formData } : t))
        );
        setSaveStatus({
          type: 'success',
          message: `Data profil ${isSelectedAdmin ? 'Administrator' : 'Guru'} "${formData.nama_lengkap}" berhasil diperbarui dan disinkronkan ke seluruh sistem!`,
        });
      } else {
        setSaveStatus({ type: 'error', message: res.message || 'Gagal menyimpan profil' });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isAdmin ? 'Profil Akun & Data Guru' : 'Profil Guru'}</span>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSelectedAdmin ? 'Profil Administrator' : 'Mode Admin (Edit Guru)'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">
                <GraduationCap className="w-3.5 h-3.5" />
                Guru Pengajar
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Anda dapat mengedit profil Administrator Anda sendiri atau memilih profil guru untuk memperbarui biodata mereka.'
              : 'Kelola biodata resmi Anda, pangkat golongan, kontak, dan kelas yang diampu.'}
          </p>
        </div>
      </div>

      {/* DROPDOWN PEMILIH GURU & ADMIN (KHUSUS ROLE ADMIN) */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-700" />
              <span>Pilih Profil untuk Diedit / Ditinjau:</span>
            </label>
            <span className="text-[11px] text-amber-700 font-medium">
              {teacherList.length > 1
                ? `1 Admin + ${teacherList.length - 1} Guru Terdaftar`
                : `1 Akun Administrator Sistem`}
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedTeacherId}
              onChange={(e) => handleSelectTeacherChange(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer appearance-none"
            >
              {teacherList.map((teacher) => (
                <option key={teacher.guru_id} value={teacher.guru_id}>
                  {teacher.guru_id === 'GURU-ADMIN'
                    ? `⭐ [ADMINISTRATOR] ${teacher.nama_lengkap} (Profil Saya)`
                    : `👨‍🏫 [GURU] ${teacher.nama_lengkap} — NIP: ${teacher.nip || '-'} (${teacher.mata_pelajaran})`}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-amber-700">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {teacherList.length <= 1 && (
            <p className="text-[11px] text-amber-800/90 pt-1">
              💡 <em>Belum ada guru pengajar yang ditambahkan. Anda dapat menambahkan guru baru melalui menu <strong>Data Master &amp; Peserta Didik &gt; Akun &amp; Role</strong>.</em>
            </p>
          )}
        </div>
      )}

      {saveStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Profile Card Header with Avatar */}
        <div className={`p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center sm:items-start gap-6 ${
          isSelectedAdmin
            ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900'
            : 'bg-gradient-to-r from-slate-900 to-teal-900'
        }`}>
          <div className="relative group">
            <img
              src={
                formData.foto_profil_url ||
                (isSelectedAdmin
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80')
              }
              alt="Foto Profil"
              className={`w-28 h-28 sm:w-32 sm:size-32 rounded-2xl object-cover border-4 shadow-xl ${
                isSelectedAdmin ? 'border-amber-400/40' : 'border-teal-400/40'
              }`}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-semibold text-white transition-opacity cursor-pointer backdrop-blur-2xs"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span>Ubah Foto</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${
              isSelectedAdmin
                ? 'bg-amber-500/30 border border-amber-400/40 text-amber-200'
                : 'bg-teal-500/30 border border-teal-400/40 text-teal-200'
            }`}>
              <Award className="w-3.5 h-3.5" />
              <span>NIP: {formData.nip || 'Belum diatur'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {formData.nama_lengkap}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isSelectedAdmin ? 'text-amber-200/90' : 'text-teal-200/90'}`}>
              {formData.jabatan || (isSelectedAdmin ? 'Administrator Sistem' : 'Guru Pengajar')} • {isSelectedAdmin ? 'Pengelola Sistem' : `Guru ${formData.mata_pelajaran || 'Mata Pelajaran'}`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2 text-xs text-slate-300">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">
                Pangkat: {formData.pangkat_golongan || (isSelectedAdmin ? 'Pembina Utama Muda / IV c' : 'Penata / III c')}
              </span>
              {!isSelectedAdmin && formData.kelas_diampu && formData.kelas_diampu.length > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-teal-800/60 border border-teal-600 text-teal-200">
                  Mengampu: {formData.kelas_diampu.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nama Lengkap & Gelar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap & Gelar *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.nama_lengkap}
                  onChange={(e) => handleChange('nama_lengkap', e.target.value)}
                  placeholder="Contoh: I Ketut Suartana, S.Pd., M.Pd."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* NIP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Induk Pegawai (NIP) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.nip}
                  onChange={(e) => handleChange('nip', e.target.value)}
                  placeholder="19820514 200801 1 009"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* Pangkat / Golongan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pangkat / Golongan Ruang
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.pangkat_golongan || ''}
                  onChange={(e) => handleChange('pangkat_golongan', e.target.value)}
                  placeholder="Pembina / IV a, Penata Tk. I / III d"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Jabatan / Tugas Tambahan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jabatan / Tugas Tambahan
              </label>
              <input
                type="text"
                value={formData.jabatan || ''}
                onChange={(e) => handleChange('jabatan', e.target.value)}
                placeholder="Guru Ahli Madya / Guru Pembimbing / Wakasek"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Mata Pelajaran / Bidang Tugas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isSelectedAdmin ? 'Bidang Tugas / Keahlian *' : 'Mata Pelajaran Utama Diampu *'}
                </label>
                <span className="text-[11px] text-teal-700 font-medium">Bisa ketik nama mapel/tugas baru</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  list="mapel-options"
                  value={formData.mata_pelajaran || ''}
                  onChange={(e) => handleChange('mata_pelajaran', e.target.value)}
                  placeholder={isSelectedAdmin ? 'Teknologi Informasi / Pengelola Sistem' : 'Ketik atau pilih nama mata pelajaran...'}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <datalist id="mapel-options">
                  {mapelList.map((m) => (
                    <option key={m.mapel_id} value={m.nama_mapel}>
                      {m.nama_mapel} ({m.kode_mapel})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Email Kontak */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Resmi / Kontak
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* No. Telepon / WhatsApp */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.telepon || ''}
                  onChange={(e) => handleChange('telepon', e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Kelas yang Diampu (Checkbox / Chips + Tambah Kelas Baru) */}
            <div className="sm:col-span-2 space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Daftar Kelas yang Diampu Guru:</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    {(formData.kelas_diampu || []).length} kelas dipilih
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewKelas(!isAddingNewKelas)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Kelas Baru</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Centang kelas yang diajar oleh guru ini untuk memfilter data siswa, jadwal, presensi, dan penilaian.
              </p>

              {/* Inline Add New Class Form */}
              {isAddingNewKelas && (
                <div className="p-3 bg-white rounded-lg border border-teal-300 shadow-xs space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Tambahkan Kelas yang Belum Tersedia:</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewKelas(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newKelasNama}
                      onChange={(e) => setNewKelasNama(e.target.value)}
                      placeholder="Nama Kelas (misal: X E, XI 4)"
                      className="px-2.5 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                    <select
                      value={newKelasTingkat}
                      onChange={(e) => setNewKelasTingkat(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs border rounded-md font-medium"
                    >
                      <option value="X">Tingkat X</option>
                      <option value="XI">Tingkat XI</option>
                      <option value="XII">Tingkat XII</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleCreateCustomKelas}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-2xs"
                    >
                      + Simpan & Pilih Kelas
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {kelasList.map((k) => {
                  const isChecked = (formData.kelas_diampu || []).includes(k.kelas_id) || (formData.kelas_diampu || []).includes(k.nama_kelas);
                  return (
                    <button
                      type="button"
                      key={k.kelas_id}
                      onClick={() => handleToggleKelasDiampu(k.kelas_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {k.nama_kelas} ({k.tingkat})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isAdmin ? 'Perubahan yang disimpan akan langsung memperbarui database master guru.' : 'Biodata ini digunakan pada lembar laporan dan administrasi guru.'}
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
