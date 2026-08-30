/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, GuruProfile, UserAccount, JadwalMengajar, KonfigurasiSekolah } from './types';
import { apiService } from './services/apiService';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ProfilGuruView } from './components/ProfilGuruView';
import { MasterDataView } from './components/MasterDataView';
import { JadwalMengajarView } from './components/JadwalMengajarView';
import { AbsensiView } from './components/AbsensiView';
import { JurnalMengajarView } from './components/JurnalMengajarView';
import { PenilaianView } from './components/PenilaianView';
import { BimbinganSiswaView } from './components/BimbinganSiswaView';
import { LaporanRekapView } from './components/LaporanRekapView';
import { KonfigurasiSekolahView } from './components/KonfigurasiSekolahView';
import { GoogleAppsScriptHubView } from './components/GoogleAppsScriptHubView';
import { BackupAndLogsView } from './components/BackupAndLogsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [guruProfile, setGuruProfile] = useState<GuruProfile | null>(null);
  const [config, setConfig] = useState<KonfigurasiSekolah | null>(null);
  const [isGasConnected, setIsGasConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Quick action from dashboard to specific KBM
  const [selectedKbmJadwal, setSelectedKbmJadwal] = useState<JadwalMengajar | null>(null);

  useEffect(() => {
    // Check local session
    const storedUser = localStorage.getItem('SAG_AUTH_USER');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('SAG_AUTH_USER');
      }
    }
    loadAppData();
    setIsLoadingAuth(false);

    const handleGlobalDataChange = async () => {
      const activeSession = apiService.getCurrentUser();
      if (activeSession) {
        setCurrentUser({ ...activeSession });
      }
      try {
        const [profile, schoolConfig, gasStatus] = await Promise.all([
          apiService.getGuruProfile(),
          apiService.getConfig(),
          apiService.checkGasConnection(),
        ]);
        if (profile) setGuruProfile({ ...profile });
        if (schoolConfig) setConfig({ ...schoolConfig });
        setIsGasConnected(gasStatus.connected);
      } catch (err) {
        console.error('Error auto-syncing app data:', err);
      }
    };

    window.addEventListener('sag_data_changed', handleGlobalDataChange);
    window.addEventListener('storage', handleGlobalDataChange);

    return () => {
      window.removeEventListener('sag_data_changed', handleGlobalDataChange);
      window.removeEventListener('storage', handleGlobalDataChange);
    };
  }, []);

  const loadAppData = async () => {
    try {
      const [profile, schoolConfig, gasStatus] = await Promise.all([
        apiService.getGuruProfile(),
        apiService.getConfig(),
        apiService.checkGasConnection(),
      ]);
      setGuruProfile(profile);
      setConfig(schoolConfig);
      setIsGasConnected(gasStatus.connected);
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    loadAppData();
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('SAG_AUTH_USER');
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300">Memuat Sistem Administrasi Guru...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        guruProfile={guruProfile}
        currentUser={currentUser}
        config={config}
        onConfigUpdated={(updated) => setConfig(updated)}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isGasConnected={isGasConnected}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          config={config}
          guruProfile={guruProfile}
          currentUser={currentUser}
          isGasConnected={isGasConnected}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              guruProfile={guruProfile}
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              onSelectJadwalForPbm={(j) => setSelectedKbmJadwal(j)}
            />
          )}

          {activeTab === 'profil_guru' && (
            <ProfilGuruView
              guruProfile={guruProfile || {
                guru_id: currentUser?.guru_id || 'GURU-ADMIN',
                nama_lengkap: currentUser?.nama_guru || 'Administrator Sistem',
                nip: currentUser?.nip || '19720415 199802 1 004',
                pangkat_golongan: currentUser?.role === 'admin' ? 'Pembina Utama Muda / IV c' : 'Penata / III c',
                jabatan: currentUser?.role === 'admin' ? 'Administrator Sistem & TI' : 'Guru Pengajar',
                mata_pelajaran: currentUser?.role === 'admin' ? 'Teknologi Informasi' : 'Matematika',
                email: currentUser?.email || 'admin@sman1tabanan.sch.id',
                telepon: '',
                foto_profil_url: '',
              }}
              currentUser={currentUser}
              onProfileUpdated={(p) => {
                setGuruProfile(p);
                const updatedSession = apiService.getCurrentUser();
                if (updatedSession) {
                  setCurrentUser({ ...updatedSession });
                }
              }}
            />
          )}

          {activeTab === 'master_data' && (
            currentUser?.role === 'admin' ? (
              <MasterDataView />
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-700">Akses Dibatasi (Khusus Administrator)</p>
                <p className="text-xs text-slate-500">Menu Data Master & Siswa hanya dapat diakses dan diedit oleh role Administrator.</p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'jadwal' && <JadwalMengajarView />}

          {activeTab === 'absensi' && <AbsensiView />}

          {activeTab === 'jurnal' && <JurnalMengajarView />}

          {activeTab === 'penilaian' && <PenilaianView />}

          {activeTab === 'bimbingan' && <BimbinganSiswaView />}

          {activeTab === 'laporan' && (
            <LaporanRekapView
              guruProfile={guruProfile}
              currentUser={currentUser}
              config={config}
            />
          )}

          {activeTab === 'konfigurasi' && config && (
            <KonfigurasiSekolahView
              config={config}
              onConfigUpdated={(updated) => setConfig(updated)}
            />
          )}

          {activeTab === 'gas_hub' && (
            currentUser?.role === 'admin' ? (
              <GoogleAppsScriptHubView />
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-700">Akses Dibatasi (Khusus Administrator)</p>
                <p className="text-xs text-slate-500">Pengaturan Google Apps Script & Database hanya dapat diakses oleh Administrator.</p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'backup_log' && (
            currentUser?.role === 'admin' ? (
              <BackupAndLogsView />
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-700">Akses Dibatasi (Khusus Administrator)</p>
                <p className="text-xs text-slate-500">Menu Backup & Log Aktivitas hanya dapat diakses oleh Administrator.</p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}
        </main>

        {/* Application Footer */}
        <footer className="mt-auto py-4 px-6 border-t border-slate-200 bg-white/80 backdrop-blur-xs text-center text-xs text-slate-500 font-medium">
          Aplikasi ini dikembangkan oleh Dewa Suwika -- 2026
        </footer>
      </div>
    </div>
  );
}
