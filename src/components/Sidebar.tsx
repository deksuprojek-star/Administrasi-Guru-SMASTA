/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  CheckSquare,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  FileText,
  Settings,
  Database,
  ShieldCheck,
  Users,
  LogOut,
  ChevronRight,
  School,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ActiveTab, GuruProfile, UserAccount, KonfigurasiSekolah } from '../types';
import { apiService } from '../services/apiService';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  guruProfile?: GuruProfile | null;
  currentUser?: UserAccount | null;
  config?: KonfigurasiSekolah | null;
  onConfigUpdated?: (config: KonfigurasiSekolah) => void;
  onLogout?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isGasConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  guruProfile,
  currentUser,
  config,
  onConfigUpdated,
  onLogout,
  isOpen,
  setIsOpen,
  isGasConnected = false,
}) => {
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  const rawMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Utama', adminOnly: false },
    { id: 'profil_guru', label: isAdmin ? 'Profil Guru (Admin)' : 'Profil Saya', icon: UserCheck, section: 'Utama', adminOnly: false },
    { id: 'master_data', label: 'Data Master & Siswa', icon: Users, section: 'Administrasi', adminOnly: true },
    { id: 'jadwal', label: 'Jadwal Mengajar', icon: CalendarDays, section: 'Administrasi', adminOnly: false },
    { id: 'absensi', label: 'Presensi & Rekap Siswa', icon: CheckSquare, section: 'PBM Harian', adminOnly: false },
    { id: 'jurnal', label: 'Jurnal Mengajar', icon: BookOpen, section: 'PBM Harian', adminOnly: false },
    { id: 'penilaian', label: 'Penilaian Siswa', icon: GraduationCap, section: 'Evaluasi', adminOnly: false },
    { id: 'bimbingan', label: 'Bimbingan Guru Wali', icon: HeartHandshake, section: 'Evaluasi', adminOnly: false },
    { id: 'laporan', label: 'Laporan & Rekap', icon: FileText, section: 'Laporan', adminOnly: false },
    { id: 'konfigurasi', label: 'Konfigurasi Sekolah', icon: Settings, section: 'Pengaturan', adminOnly: false },
    { id: 'gas_hub', label: 'Google Apps Script & DB', icon: Database, section: 'Pengaturan', adminOnly: true },
    { id: 'backup_log', label: 'Backup & Log', icon: ShieldCheck, section: 'Pengaturan', adminOnly: true },
  ];

  const menuItems = rawMenuItems.filter((item) => (item.adminOnly ? isAdmin : true));

  const sections = Array.from(new Set(menuItems.map((m) => m.section)));

  const handleOpenLogoModal = () => {
    setLogoInputUrl(config?.logo_url || '');
    setIsLogoModalOpen(true);
  };

  const handleSaveLogoUrl = async () => {
    if (!config) {
      setActiveTab('konfigurasi');
      setIsLogoModalOpen(false);
      return;
    }
    const updated = { ...config, logo_url: logoInputUrl, kop_logo_kiri_url: logoInputUrl || config.kop_logo_kiri_url };
    await apiService.saveConfig(updated);
    if (onConfigUpdated) onConfigUpdated(updated);
    setIsLogoModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (result && config) {
          const updated = { ...config, logo_url: result, kop_logo_kiri_url: result };
          await apiService.saveConfig(updated);
          if (onConfigUpdated) onConfigUpdated(updated);
          setIsLogoModalOpen(false);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo Image / Icon */}
            <div className="relative group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30 overflow-hidden border border-teal-500/30">
                {config?.logo_url ? (
                  <img
                    src={config.logo_url}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain p-0.5 bg-white"
                  />
                ) : (
                  <School className="w-6 h-6" />
                )}
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-xs tracking-tight text-white leading-tight truncate">
                Sistem Administrasi Guru
              </h1>
              <p className="text-[11px] text-teal-400 font-semibold truncate">
                {config?.nama_sekolah || 'SMA Negeri 1 Tabanan'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Database Mode Status Indicator */}
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isGasConnected ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'
              }`}
            />
            <span className="font-medium text-slate-300">
              {isGasConnected ? 'GAS Web App Live' : 'Database Lokal Aktif'}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
            {isGasConnected ? 'Online' : 'Lokal'}
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {sections.map((sec) => (
            <div key={sec}>
              <div className="px-3 mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {sec}
              </div>
              <div className="space-y-0.5">
                {menuItems
                  .filter((item) => item.section === sec)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as ActiveTab);
                          if (window.innerWidth < 1024) setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-sm font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  (currentUser?.role === 'admin'
                    ? (guruProfile?.guru_id === 'GURU-ADMIN' ? guruProfile?.foto_profil_url : (currentUser?.foto_profil_url || guruProfile?.foto_profil_url))
                    : (guruProfile?.foto_profil_url || currentUser?.foto_profil_url)) ||
                  (currentUser?.role === 'admin'
                    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
                }
                alt="Foto Profil"
                className={`w-9 h-9 rounded-full object-cover border shrink-0 ${
                  currentUser?.role === 'admin' ? 'border-amber-400' : 'border-teal-500'
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white truncate" title={currentUser?.role === 'admin' ? (guruProfile?.guru_id === 'GURU-ADMIN' ? guruProfile?.nama_lengkap : currentUser?.nama_guru) || 'Administrator' : guruProfile?.nama_lengkap || currentUser?.nama_guru || 'Guru Pengajar'}>
                    {currentUser?.role === 'admin'
                      ? (guruProfile?.guru_id === 'GURU-ADMIN' ? guruProfile?.nama_lengkap : (currentUser?.nama_guru || guruProfile?.nama_lengkap || 'Administrator Sistem'))
                      : (guruProfile?.nama_lengkap || currentUser?.nama_guru || 'Pengguna Sistem')}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {currentUser?.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 tracking-wider">
                      <GraduationCap className="w-2.5 h-2.5" />
                      GURU
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 truncate">
                    {currentUser?.role === 'admin'
                      ? (guruProfile?.guru_id === 'GURU-ADMIN' ? (guruProfile?.jabatan || 'Admin Sekolah') : 'Admin Sekolah')
                      : (guruProfile?.mata_pelajaran || 'Pengajar')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Keluar dari Akun"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 text-center font-medium border-t border-slate-900 pt-1.5">
            Dewa Suwika -- 2026
          </div>
        </div>
      </aside>

      {/* Quick Logo Change Modal */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Ubah Logo Sekolah</h2>
              </div>
              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                {logoInputUrl ? (
                  <img src={logoInputUrl} alt="Preview Logo" className="w-full h-full object-contain" />
                ) : (
                  <School className="w-10 h-10 text-teal-600" />
                )}
              </div>
            </div>

            {/* Upload from file */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Unggah Berkas Gambar Logo</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-800 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-teal-600" />
                <span>{isUploading ? 'Memproses Berkas...' : 'Pilih File Logo dari Perangkat'}</span>
              </button>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Atau Masukkan URL Gambar Logo</label>
              <input
                type="url"
                value={logoInputUrl}
                onChange={(e) => setLogoInputUrl(e.target.value)}
                placeholder="https://.../logo.png"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Pilihan Cepat / Contoh:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setLogoInputUrl('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80')}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                >
                  Logo Tut Wuri Handayani
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('konfigurasi');
                    setIsLogoModalOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-[11px] font-semibold text-teal-800"
                >
                  Ke Halaman Konfigurasi Lengkap →
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveLogoUrl}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
              >
                Terapkan Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
