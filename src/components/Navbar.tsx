/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Calendar, Clock, Sparkles, Database, CheckCircle2, ShieldCheck, GraduationCap } from 'lucide-react';
import { KonfigurasiSekolah, GuruProfile, ActiveTab, UserAccount } from '../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  config?: KonfigurasiSekolah | null;
  guruProfile?: GuruProfile | null;
  currentUser?: UserAccount | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isGasConnected?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  sidebarOpen,
  setSidebarOpen,
  config,
  guruProfile,
  currentUser,
  activeTab,
  setActiveTab,
  isGasConnected = false,
  onLogout,
}) => {
  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dateFormatted = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const schoolName = config?.nama_sekolah || 'SMA NEGERI 1 TABANAN';
  const schoolAddress = config?.alamat_sekolah || (config?.npsn ? `NPSN: ${config.npsn}` : 'NPSN: 50101123');
  const academicYear = config?.tahun_ajaran || '2026/2027';
  const activeSemester = config?.semester_aktif || 'Ganjil';
  const isAdmin = currentUser?.role === 'admin';

  const handleToggle = () => {
    if (setSidebarOpen) {
      setSidebarOpen(!sidebarOpen);
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & School / Breadcrumb Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm sm:text-base tracking-tight">
                {schoolName}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                TA {academicYear} • Semester {activeSemester}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              {schoolAddress}
            </p>
          </div>
        </div>

        {/* Right Side: Role Badge, Date, Live Mode Badge & Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs ${
              isAdmin
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-teal-50 text-teal-800 border-teal-300'
            }`}
            title={`Login sebagai: ${currentUser?.nama_guru || 'Pengguna'} (${currentUser?.role?.toUpperCase()})`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>{isAdmin ? 'Admin' : 'Guru'}</span>
          </div>

          {/* Date Tag */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/80 text-xs font-medium text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>{dateFormatted}</span>
          </div>

          {/* Apps Script Connection Badge */}
          {isAdmin ? (
            <button
              onClick={() => setActiveTab('gas_hub')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isGasConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Klik untuk konfigurasi Google Apps Script Web App & Sheets (Admin)"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isGasConnected ? 'GAS Terhubung' : 'Lokal / GAS'}
              </span>
            </button>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isGasConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-300 text-slate-700'
              }`}
              title="Status Koneksi Database Sistem"
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">
                {isGasConnected ? 'GAS Terhubung' : 'Database Aktif'}
              </span>
            </div>
          )}

          {/* Quick Action: Master Data / Absensi based on role */}
          {isAdmin ? (
            activeTab !== 'master_data' && (
              <button
                onClick={() => setActiveTab('master_data')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kelola Data & Akun</span>
              </button>
            )
          ) : (
            activeTab !== 'absensi' && (
              <button
                onClick={() => setActiveTab('absensi')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Isi Absensi</span>
              </button>
            )
          )}

          {/* Avatar Profile Trigger */}
          <button
            onClick={() => setActiveTab('profil_guru')}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-teal-500/30 transition-all"
            title={`Profil: ${currentUser?.nama_guru || 'Pengguna'}`}
          >
            {guruProfile?.foto_profil_url ? (
              <img
                src={guruProfile.foto_profil_url}
                alt="Profil"
                className={`w-8 h-8 rounded-full object-cover border ${
                  isAdmin ? 'border-amber-400' : 'border-teal-500'
                }`}
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-teal-100 text-teal-800 border-teal-300'
                }`}
              >
                {(currentUser?.nama_guru || (isAdmin ? 'A' : 'G')).charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
