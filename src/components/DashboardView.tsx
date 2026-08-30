/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  School,
  Calendar,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  GraduationCap,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import {
  GuruProfile,
  UserAccount,
  Kelas,
  Siswa,
  JadwalMengajar,
  AbsensiRecord,
  JurnalMengajar,
  LogAktivitas,
  ActiveTab,
} from '../types';
import { apiService } from '../services/apiService';

interface DashboardViewProps {
  guruProfile: GuruProfile | null;
  currentUser?: UserAccount | null;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectJadwalForPbm?: (jadwal: JadwalMengajar) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  guruProfile,
  currentUser,
  setActiveTab,
  onSelectJadwalForPbm,
}) => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalMengajar[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogAktivitas[]>([]);
  const [loading, setLoading] = useState(true);

  const [teacherClassInfo, setTeacherClassInfo] = useState<{
    classes: Kelas[];
    isFiltered: boolean;
    totalAllClasses: number;
  }>({ classes: [], isFiltered: false, totalAllClasses: 0 });

  // Determine current day in Indonesian
  const dayIndex = new Date().getDay();
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
  const currentDayName = indonesianDays[dayIndex];

  useEffect(() => {
    loadDashboardData();
    const handleDataChanged = () => {
      loadDashboardData();
    };
    window.addEventListener('sag_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sag_data_changed', handleDataChanged);
    };
  }, [currentUser, guruProfile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [k, s, j, jrn, abs, logs, teacherClasses] = await Promise.all([
        apiService.getKelasList(),
        apiService.getSiswaList(),
        apiService.getJadwalList(),
        apiService.getJurnalList(),
        apiService.getAbsensiList(),
        apiService.getLogs(),
        apiService.getTeacherTaughtClasses(),
      ]);
      setKelasList(k);
      setSiswaList(s);
      setJadwalList(j);
      setJurnalList(jrn);
      setAbsensiList(abs);
      setRecentLogs(logs.slice(0, 5));
      setTeacherClassInfo(teacherClasses);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const isGuru = currentUser?.role === 'guru';
  const displayKelasList = isGuru && teacherClassInfo.isFiltered ? teacherClassInfo.classes : kelasList;
  const totalKelas = displayKelasList.length;

  // Hitung jumlah siswa sesuai setting kelas guru yang diampu
  const taughtClassIds = new Set(displayKelasList.map((c) => c.kelas_id));
  const taughtClassNames = new Set(displayKelasList.map((c) => c.nama_kelas.trim().toLowerCase()));
  const filteredSiswaList = isGuru && teacherClassInfo.isFiltered
    ? siswaList.filter((s) => s.status === 'Aktif' && (taughtClassIds.has(s.kelas_id) || taughtClassNames.has((s.nama_kelas || s.kelas_id).trim().toLowerCase())))
    : siswaList.filter((s) => s.status === 'Aktif');

  const totalSiswa = filteredSiswaList.length;

  // Jadwal Hari Ini
  const relevantJadwalList = isGuru && teacherClassInfo.isFiltered
    ? jadwalList.filter((j) => taughtClassIds.has(j.kelas_id) || taughtClassNames.has(j.kelas_id.trim().toLowerCase()))
    : jadwalList;
  const jadwalHariIni = relevantJadwalList.filter((j) => j.hari === currentDayName);

  // Hitung tingkat kehadiran (Dispensasi dihitung Hadir)
  const relevantAbsensi = isGuru && teacherClassInfo.isFiltered
    ? absensiList.filter((a) => taughtClassIds.has(a.kelas_id) || taughtClassNames.has(a.kelas_id.trim().toLowerCase()))
    : absensiList;
  const totalAbsen = relevantAbsensi.length;
  const totalHadirDanDispen = relevantAbsensi.filter((a) => a.status === 'Hadir' || a.status === 'Dispensasi').length;
  const persentaseHadir = totalAbsen > 0 ? Math.round((totalHadirDanDispen / totalAbsen) * 100) : 100;

  // User Display Name synchronized across Sidebar & Dashboard
  const isAdmin = currentUser?.role === 'admin';
  const adminDisplayName =
    guruProfile?.guru_id === 'GURU-ADMIN'
      ? (guruProfile?.nama_lengkap || currentUser?.nama_guru || 'Administrator Sistem')
      : (currentUser?.nama_guru || guruProfile?.nama_lengkap || 'Administrator Sistem');
  const guruDisplayName =
    guruProfile?.nama_lengkap ||
    currentUser?.nama_guru ||
    currentUser?.username ||
    'Guru Pengajar';

  const displayName = isAdmin ? adminDisplayName : guruDisplayName;

  const adminRoleSubtitle =
    (guruProfile?.guru_id === 'GURU-ADMIN' ? guruProfile?.jabatan : (currentUser as any)?.jabatan) ||
    'Administrator Sistem';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-4xl min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span className="truncate">Sistem Administrasi Guru SMA Negeri 1 Tabanan</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white mb-1.5 truncate" title={`Selamat Datang, ${displayName}`}>
            Selamat Datang, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed truncate">
            {isAdmin ? (
              <span className="text-teal-100 font-medium">{adminRoleSubtitle} • Hak Akses Manajemen Penuh</span>
            ) : (
              <>
                {guruProfile?.jabatan || 'Guru Pengajar'} • Mata Pelajaran{' '}
                <span className="font-semibold text-white">{guruProfile?.mata_pelajaran || 'Matematika'}</span>
              </>
            )}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Jumlah Kelas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Kelas
            </span>
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">{totalKelas}</div>
            <p className="text-xs text-slate-500 mt-1">
              {isGuru && teacherClassInfo.isFiltered ? 'Kelas yang diampu (Setting Guru)' : 'Total seluruh kelas'}
            </p>
          </div>
        </div>

        {/* Card 2: Jumlah Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Siswa
            </span>
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">{totalSiswa}</div>
            <p className="text-xs text-slate-500 mt-1">
              {isGuru && teacherClassInfo.isFiltered ? 'Siswa aktif di kelas yang diampu' : 'Total siswa aktif terdaftar'}
            </p>
          </div>
        </div>

        {/* Card 3: Jadwal Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jadwal Hari Ini
            </span>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">{jadwalHariIni.length}</div>
            <p className="text-xs text-slate-500 mt-1">Sesi PBM ({currentDayName})</p>
          </div>
        </div>

        {/* Card 4: Kehadiran Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Kehadiran
            </span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
              {persentaseHadir}%
            </div>
            <p className="text-xs text-slate-500 mt-1">Tingkat kehadiran siswa</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Today's Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Jadwal Hari Ini */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Jadwal Mengajar Hari Ini ({currentDayName})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih sesi untuk langsung mengisi absensi atau menulis jurnal PBM
              </p>
            </div>
            <button
              onClick={() => setActiveTab('jadwal')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Semua Jadwal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5">
            {jadwalHariIni.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Tidak ada jadwal mengajar pada hari {currentDayName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan waktu untuk penyusunan administrasi, asesmen, atau bimbingan siswa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jadwalHariIni.map((item) => (
                  <div
                    key={item.jadwal_id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-teal-50/30 hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-600 text-white font-bold flex flex-col items-center justify-center text-xs shrink-0 shadow-xs">
                        <span>Jam</span>
                        <span className="text-[11px] font-semibold">{item.jam_ke}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            Kelas {item.nama_kelas || item.kelas_id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
                            {item.nama_mapel || 'Matematika'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tahun Ajaran: 2026/2027 • Pengampu: {guruProfile?.nama_lengkap || currentUser?.nama_guru || 'Guru Pengajar'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (onSelectJadwalForPbm) onSelectJadwalForPbm(item);
                          setActiveTab('absensi');
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Isi Absensi</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectJadwalForPbm) onSelectJadwalForPbm(item);
                          setActiveTab('jurnal');
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>Tulis Jurnal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Links & Recent Audit Logs */}
        <div className="space-y-6">
          {/* Quick Nav Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="font-bold text-sm text-slate-800 mb-3">Menu Cepat Administrasi</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab('penilaian')}
                className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group"
              >
                <GraduationCap className="w-5 h-5 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-800">Penilaian</div>
                <div className="text-[11px] text-slate-500">Input nilai UH & SAS</div>
              </button>

              <button
                onClick={() => setActiveTab('bimbingan')}
                className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group"
              >
                <FileCheck className="w-5 h-5 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-800">Bimbingan</div>
                <div className="text-[11px] text-slate-500">Guru Wali & Konseling</div>
              </button>

              <button
                onClick={() => setActiveTab('laporan')}
                className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group"
              >
                <BookOpen className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-800">Laporan</div>
                <div className="text-[11px] text-slate-500">Rekap & Cetak PDF</div>
              </button>

              {currentUser?.role === 'admin' ? (
                <button
                  onClick={() => setActiveTab('gas_hub')}
                  className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group"
                >
                  <School className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-slate-800">Google Hub</div>
                  <div className="text-[11px] text-slate-500">Apps Script & DB</div>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('profil_guru')}
                  className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group"
                >
                  <Users className="w-5 h-5 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-slate-800">Profil Guru</div>
                  <div className="text-[11px] text-slate-500">Biodata & Tugas PBM</div>
                </button>
              )}
            </div>
          </div>

          {/* Audit Log Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-slate-800">Aktivitas Terakhir</h2>
              <button
                onClick={() => setActiveTab('backup_log')}
                className="text-[11px] font-semibold text-teal-600 hover:underline"
              >
                Lihat Log
              </button>
            </div>
            <div className="space-y-2.5">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan aktivitas.</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.log_id} className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
