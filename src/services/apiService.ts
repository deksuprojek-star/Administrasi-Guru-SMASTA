/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GuruProfile,
  UserAccount,
  Kelas,
  MataPelajaran,
  Siswa,
  JadwalMengajar,
  AbsensiRecord,
  JurnalMengajar,
  PenilaianRecord,
  BimbinganSiswa,
  SiswaAsuhRecord,
  KonfigurasiSekolah,
  LogAktivitas,
  ApiResponse,
} from '../types';
import {
  initialGuruProfile,
  initialGuruProfiles,
  initialUserAccount,
  initialUserAccounts,
  initialKonfigurasiSekolah,
  initialKelasList,
  initialMapelList,
  initialSiswaList,
  initialJadwalList,
  initialAbsensiList,
  initialJurnalList,
  initialPenilaianList,
  initialBimbinganList,
  initialLogList,
} from '../data/initialData';
import { sortKelasList, getTingkatOrder } from '../utils/classSort';

const STORAGE_KEYS = {
  GAS_URL: 'SAG_GAS_WEBAPP_URL',
  GURU: 'SAG_GURU_PROFILE',
  GURU_PROFILES: 'SAG_GURU_PROFILES_LIST',
  USER: 'SAG_USER_ACCOUNT',
  USERS: 'SAG_USERS_LIST',
  CONFIG: 'SAG_CONFIG_SEKOLAH',
  KELAS: 'SAG_MASTER_KELAS',
  MAPEL: 'SAG_MASTER_MAPEL',
  SISWA: 'SAG_MASTER_SISWA',
  JADWAL: 'SAG_JADWAL_MENGAJAR',
  ABSENSI: 'SAG_ABSENSI_DATA',
  JURNAL: 'SAG_JURNAL_DATA',
  PENILAIAN: 'SAG_PENILAIAN_DATA',
  BIMBINGAN: 'SAG_BIMBINGAN_DATA',
  ASUH: 'SAG_SISWA_ASUH_DATA',
  LOGS: 'SAG_LOGS_DATA',
};

const LEGACY_DELETED_CLASSES = new Set([
  'x a', 'x b', 'x c', 'x d',
  'xa', 'xb', 'xc', 'xd',
  'xi a', 'xi b', 'xi c', 'xi d',
  'xia', 'xib', 'xic', 'xid',
  'xii a', 'xii b', 'xii c', 'xii d',
  'xiia', 'xiib', 'xiic', 'xiid',
  'kls-10a', 'kls-10b', 'kls-10c', 'kls-10d',
  'kls-11a', 'kls-11b', 'kls-11c', 'kls-11d',
  'kls-12a', 'kls-12b', 'kls-12c', 'kls-12d',
  'kls-xa', 'kls-xb', 'kls-xc', 'kls-xd',
  'kls-xia', 'kls-xib', 'kls-xic', 'kls-xid',
  'kls-xiia', 'kls-xiib', 'kls-xiic', 'kls-xiid',
]);

export function isLegacyDeletedClass(kelasIdOrName: string): boolean {
  if (!kelasIdOrName) return false;
  const clean = kelasIdOrName.trim().toLowerCase();
  return LEGACY_DELETED_CLASSES.has(clean) || LEGACY_DELETED_CLASSES.has(clean.replace(/\s+/g, ''));
}

class ApiService {
  private gasUrl: string = '';

  constructor() {
    this.gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
    this.initLocalStorage();
  }

  public notifyDataChanged(type: string, payload?: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sag_data_changed', {
          detail: { type, payload, timestamp: Date.now() },
        })
      );
    }
  }

  public getGasUrl(): string {
    return this.gasUrl;
  }

  public setGasUrl(url: string): void {
    this.gasUrl = url.trim();
    localStorage.setItem(STORAGE_KEYS.GAS_URL, this.gasUrl);
  }

  public setGasWebAppUrl(url: string): void {
    this.setGasUrl(url);
  }

  public isOnlineGasMode(): boolean {
    return Boolean(this.gasUrl && this.gasUrl.startsWith('http'));
  }

  public isOnlineMode(): boolean {
    return this.isOnlineGasMode();
  }

  public async checkGasConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.isOnlineGasMode()) {
      return { connected: false, message: 'Offline / Local Database Mode' };
    }
    try {
      const res = await fetch(this.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const data = await res.json();
      return {
        connected: data.success === true,
        message: data.message || 'Connected to Google Apps Script',
      };
    } catch (e: any) {
      return { connected: false, message: e.message || 'Gagal menghubungi GAS' };
    }
  }

  public async testConnection(url?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = url || this.gasUrl;
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script kosong' };
    }
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const data = await res.json();
      return {
        success: data.success === true,
        message: data.message || 'Koneksi ke Google Sheets & GAS berhasil!',
      };
    } catch (e: any) {
      return { success: false, message: 'Gagal terhubung ke GAS: ' + e.message };
    }
  }

  private initLocalStorage() {
    // 1. Inisialisasi Kelas: Hapus kelas lama (X A s.d. XII D) dan pastikan 36 kelas standar (X-1..X-12, XI-1..XI-12, XII-1..XII-12) selalu ada,
    //    serta SEMUA data kelas manual yang dibuat pengguna tetap dipertahankan.
    const rawKelas = localStorage.getItem(STORAGE_KEYS.KELAS);
    if (!rawKelas) {
      localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(initialKelasList));
    } else {
      try {
        let existingClasses: Kelas[] = JSON.parse(rawKelas);
        
        // Hapus kelas legacy yang diminta untuk dihapus (X A..XD, XI A..XID, XII A..XIID)
        const initialCount = existingClasses.length;
        existingClasses = existingClasses.filter(
          (c) => !isLegacyDeletedClass(c.kelas_id) && !isLegacyDeletedClass(c.nama_kelas)
        );

        const existingIds = new Set(existingClasses.map((c) => c.kelas_id));
        const existingNames = new Set(existingClasses.map((c) => c.nama_kelas.trim().toLowerCase()));

        // Tambahkan kelas standar 1 s.d. 12 jika belum ada
        let updated = existingClasses.length !== initialCount;
        for (const defaultKelas of initialKelasList) {
          if (!existingIds.has(defaultKelas.kelas_id) && !existingNames.has(defaultKelas.nama_kelas.trim().toLowerCase())) {
            existingClasses.push(defaultKelas);
            updated = true;
          }
        }
        if (updated) {
          const sorted = sortKelasList(existingClasses);
          localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(sorted));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(initialKelasList));
      }
    }

    // Bersihkan referensi kelas legacy di profil guru jika ada
    try {
      const rawGuru = localStorage.getItem(STORAGE_KEYS.GURU_PROFILES);
      if (rawGuru) {
        const profiles: GuruProfile[] = JSON.parse(rawGuru);
        let changed = false;
        profiles.forEach((p) => {
          if (p.kelas_diampu && p.kelas_diampu.some((k) => isLegacyDeletedClass(k))) {
            p.kelas_diampu = p.kelas_diampu.filter((k) => !isLegacyDeletedClass(k));
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(profiles));
          const currentGuru = localStorage.getItem(STORAGE_KEYS.GURU);
          if (currentGuru) {
            const singleP: GuruProfile = JSON.parse(currentGuru);
            singleP.kelas_diampu = (singleP.kelas_diampu || []).filter((k) => !isLegacyDeletedClass(k));
            localStorage.setItem(STORAGE_KEYS.GURU, JSON.stringify(singleP));
          }
        }
      }
    } catch (e) {}

    // Bersihkan dummy guru yang dibuat oleh sistem pada versi terdahulu (hanya izinkan data yang ditambahkan admin)
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) {
        let users: UserAccount[] = JSON.parse(rawUsers);
        // Hapus akun dummy lama seperti username 'guru' dengan ID 'GURU-001' yang pernah di-seed sistem
        users = users.filter((u) => {
          if (u.user_id === 'USR-ADMIN-01' || u.role === 'admin') return true;
          if (u.username === 'guru' && u.guru_id === 'GURU-001') return false;
          return true;
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      const rawProfiles = localStorage.getItem(STORAGE_KEYS.GURU_PROFILES);
      if (rawProfiles) {
        let profiles: GuruProfile[] = JSON.parse(rawProfiles);
        const users: UserAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const validGuruIds = new Set(users.map((u) => u.guru_id).filter(Boolean));
        const validNips = new Set(users.map((u) => u.nip).filter(Boolean));

        // Hapus dummy profiles yang tidak memiliki akun valid di daftar pengguna admin
        profiles = profiles.filter((p) => p.guru_id === 'GURU-ADMIN' || validGuruIds.has(p.guru_id) || (p.nip && validNips.has(p.nip)));
        localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(profiles));
      }
    } catch (e) {}

    // 2. Inisialisasi entitas lainnya secara persisten dan aman (data manual tidak pernah dihapus otomatis)
    if (!localStorage.getItem(STORAGE_KEYS.GURU)) {
      localStorage.setItem(STORAGE_KEYS.GURU, JSON.stringify(initialGuruProfile));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GURU_PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(initialGuruProfiles));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUserAccounts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialKonfigurasiSekolah));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAPEL)) {
      localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(initialMapelList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SISWA)) {
      localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(initialSiswaList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JADWAL)) {
      localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(initialJadwalList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ABSENSI)) {
      localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(initialAbsensiList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JURNAL)) {
      localStorage.setItem(STORAGE_KEYS.JURNAL, JSON.stringify(initialJurnalList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PENILAIAN)) {
      localStorage.setItem(STORAGE_KEYS.PENILAIAN, JSON.stringify(initialPenilaianList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BIMBINGAN)) {
      localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(initialBimbinganList));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASUH)) {
      localStorage.setItem(STORAGE_KEYS.ASUH, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(initialLogList));
    }
  }

  private async callGas(action: string, payload: any = {}): Promise<ApiResponse> {
    if (!this.isOnlineGasMode()) {
      throw new Error('Google Apps Script URL belum dikonfigurasi');
    }
    const response = await fetch(this.gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
    });
    return await response.json();
  }

  // --- LOGGING ---
  public async addLog(
    action: string,
    module: string,
    details: string,
    recordId?: string,
    status: 'SUCCESS' | 'FAILED' | 'WARNING' = 'SUCCESS'
  ): Promise<void> {
    const userProfile = await this.getGuruProfile();
    const currentUser = this.getCurrentUser();
    const newLog: LogAktivitas = {
      log_id: 'LOG-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      user: currentUser?.nama_guru || userProfile?.nama_lengkap || 'Pengguna',
      action,
      module,
      record_id: recordId,
      status,
      details,
    };

    const currentLogs: LogAktivitas[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    currentLogs.unshift(newLog);
    if (currentLogs.length > 200) currentLogs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(currentLogs));
  }

  public async getLogs(): Promise<LogAktivitas[]> {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  }

  // --- AUTH & USER MANAGEMENT ---
  public async getUserList(): Promise<UserAccount[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUserAccounts));
      return initialUserAccounts;
    }
    return JSON.parse(raw);
  }

  public async saveUser(user: UserAccount): Promise<ApiResponse> {
    const users = await this.getUserList();
    const existingIndex = users.findIndex((u) => u.user_id === user.user_id || u.username.toLowerCase() === user.username.toLowerCase());
    
    if (existingIndex >= 0 && users[existingIndex].user_id !== user.user_id) {
      return { success: false, message: `Username "${user.username}" sudah digunakan oleh akun lain.` };
    }

    const assignedGuruId = user.guru_id || (existingIndex >= 0 ? users[existingIndex].guru_id : 'GURU-' + Math.random().toString(36).substring(2, 7).toUpperCase());

    const updatedUser: UserAccount = {
      ...user,
      guru_id: assignedGuruId,
      user_id: user.user_id || (existingIndex >= 0 ? users[existingIndex].user_id : 'USR-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
      created_at: user.created_at || (existingIndex >= 0 ? users[existingIndex].created_at : new Date().toISOString()),
      status_aktif: user.status_aktif !== false,
    };

    if (existingIndex >= 0) {
      users[existingIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Synchronize corresponding GuruProfile
    const profiles = await this.getGuruProfileList();
    const profileIdx = profiles.findIndex((p) => p.guru_id === assignedGuruId || (user.nip && p.nip === user.nip));
    
    const guruProfileData: GuruProfile = {
      guru_id: assignedGuruId,
      nama_lengkap: user.nama_guru,
      nip: user.nip || '',
      pangkat_golongan: (user as any).pangkat_golongan || (user.role === 'admin' ? 'Pembina Utama Muda / IV c' : 'Penata / III c'),
      jabatan: (user as any).jabatan || (user.role === 'admin' ? 'Administrator Sistem' : 'Guru Pengajar'),
      mata_pelajaran: (user as any).mata_pelajaran || (user.role === 'admin' ? 'Teknologi Informasi' : 'Matematika'),
      foto_profil_url: (user as any).foto_profil_url || '',
      email: user.email || '',
      telepon: (user as any).telepon || '',
      kelas_diampu: user.kelas_diampu || [],
    };

    if (profileIdx >= 0) {
      profiles[profileIdx] = { ...profiles[profileIdx], ...guruProfileData };
    } else {
      profiles.push(guruProfileData);
    }
    localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(profiles));

    // If current session is this user, update session
    const currentSession = this.getCurrentUser();
    if (currentSession && currentSession.user_id === updatedUser.user_id) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      localStorage.setItem(STORAGE_KEYS.GURU, JSON.stringify(guruProfileData));
    }

    this.addLog('SAVE_USER', 'AUTH', `Menyimpan akun pengguna: ${user.nama_guru} (${user.role.toUpperCase()})`, updatedUser.user_id);
    this.notifyDataChanged('USERS_CHANGED', updatedUser);
    return { success: true, message: `Akun ${user.nama_guru} (${user.role === 'admin' ? 'Administrator' : 'Guru'}) berhasil disimpan!` };
  }

  public async deleteUser(userId: string): Promise<ApiResponse> {
    const currentUser = this.getCurrentUser();
    if (currentUser?.user_id === userId) {
      return { success: false, message: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan.' };
    }

    const users = await this.getUserList();
    const target = users.find((u) => u.user_id === userId);
    const filtered = users.filter((u) => u.user_id !== userId);

    if (filtered.length === users.length) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

    // Also remove from profiles if exists
    if (target?.guru_id) {
      const profiles = (await this.getGuruProfileList()).filter((p) => p.guru_id !== target.guru_id);
      localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(profiles));
    }

    this.addLog('DELETE_USER', 'AUTH', `Menghapus akun pengguna: ${target?.nama_guru || userId}`, userId);
    this.notifyDataChanged('USERS_CHANGED', { deletedUserId: userId });
    return { success: true, message: 'Akun pengguna berhasil dihapus!' };
  }

  public async resetUserPassword(userId: string, newPass: string): Promise<ApiResponse> {
    const users = await this.getUserList();
    const user = users.find((u) => u.user_id === userId);
    if (!user) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }
    user.password = newPass;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.addLog('RESET_PASSWORD', 'AUTH', `Reset kata sandi untuk akun: ${user.nama_guru}`, userId);
    this.notifyDataChanged('USERS_CHANGED', user);
    return { success: true, message: `Kata sandi untuk ${user.nama_guru} berhasil diperbarui!` };
  }

  public async login(username: string, password: string): Promise<ApiResponse<UserAccount>> {
    await new Promise((r) => setTimeout(r, 350));
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, message: 'Silakan isi username dan kata sandi.' };
    }

    if (this.isOnlineGasMode()) {
      try {
        const res = await this.callGas('login', { username: cleanUsername, password: cleanPassword });
        if (res.success && res.data) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
          this.addLog('LOGIN', 'AUTH', `Login online berhasil via Google Apps Script sebagai ${res.data.role?.toUpperCase()}`);
          return res;
        }
      } catch (err: any) {
        console.warn('Fallback to local auth due to GAS error:', err);
      }
    }

    // Verify against saved accounts
    const users = await this.getUserList();
    const matchedUser = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanUsername.toLowerCase() || (u.nip && u.nip.replace(/\s+/g, '') === cleanUsername.replace(/\s+/g, ''))) &&
        (u.password === cleanPassword || (!u.password && cleanPassword === 'guru123'))
    );

    if (matchedUser) {
      if (matchedUser.status_aktif === false) {
        return { success: false, message: 'Akun ini sedang dinonaktifkan. Hubungi administrator.' };
      }

      // Safe user object for session
      const sessionUser: UserAccount = {
        user_id: matchedUser.user_id,
        username: matchedUser.username,
        guru_id: matchedUser.guru_id,
        role: matchedUser.role,
        nama_guru: matchedUser.nama_guru,
        nip: matchedUser.nip,
        email: matchedUser.email,
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));
      this.addLog('LOGIN', 'AUTH', `Login berhasil sebagai ${matchedUser.role.toUpperCase()} (${matchedUser.nama_guru})`);
      return {
        success: true,
        message: `Selamat datang, ${matchedUser.nama_guru}! Role aktif: ${matchedUser.role.toUpperCase()}`,
        data: sessionUser,
      };
    }

    this.addLog('LOGIN_FAILED', 'AUTH', `Percobaan login gagal untuk username: ${cleanUsername}`, undefined, 'FAILED');
    return {
      success: false,
      message: 'Username atau kata sandi tidak valid. Pastikan data yang dimasukkan benar.',
    };
  }

  public getCurrentUser(): UserAccount | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.addLog('LOGOUT', 'AUTH', 'Pengguna telah keluar dari sistem');
  }

  // --- GURU & ADMIN PROFILE ---
  public async getGuruProfileList(): Promise<GuruProfile[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.GURU_PROFILES);
    const users = await this.getUserList();
    const validGuruIds = new Set(users.map((u) => u.guru_id).filter(Boolean));
    const validNips = new Set(users.map((u) => u.nip).filter(Boolean));

    let list: GuruProfile[] = raw ? JSON.parse(raw) : [];

    // Filter out dummy/unregistered profiles (hanya data guru yang ditambahkan admin & admin sistem)
    list = list.filter((p) => p.guru_id === 'GURU-ADMIN' || validGuruIds.has(p.guru_id) || (p.nip && validNips.has(p.nip)));

    // Pastikan akun Admin selalu ada dalam list profil
    const adminUser = users.find((u) => u.role === 'admin') || {
      user_id: 'USR-ADMIN-01',
      username: 'admin',
      role: 'admin' as const,
      nama_guru: 'Administrator Sistem',
      guru_id: 'GURU-ADMIN',
      nip: '19720415 199802 1 004',
      email: 'admin@sman1tabanan.sch.id',
    };

    const adminIdx = list.findIndex((p) => p.guru_id === 'GURU-ADMIN' || p.guru_id === adminUser.guru_id);
    const adminProfData: GuruProfile = {
      guru_id: adminUser.guru_id || 'GURU-ADMIN',
      nama_lengkap: adminUser.nama_guru || 'Administrator Sistem',
      nip: adminUser.nip || '19720415 199802 1 004',
      pangkat_golongan: (adminUser as any).pangkat_golongan || 'Pembina Utama Muda / IV c',
      jabatan: (adminUser as any).jabatan || 'Administrator Sistem & TI',
      mata_pelajaran: (adminUser as any).mata_pelajaran || 'Teknologi Informasi',
      foto_profil_url: (adminUser as any).foto_profil_url || '',
      email: adminUser.email || 'admin@sman1tabanan.sch.id',
      telepon: (adminUser as any).telepon || '',
      kelas_diampu: adminUser.kelas_diampu || [],
    };

    if (adminIdx >= 0) {
      list[adminIdx] = { ...adminProfData, ...list[adminIdx] };
    } else {
      list.unshift(adminProfData);
    }

    // Pastikan semua user role guru yang dibuat admin memiliki profil di daftar
    for (const u of users) {
      if (u.role === 'guru') {
        const idx = list.findIndex((p) => p.guru_id === u.guru_id || (u.nip && p.nip === u.nip));
        const profData: GuruProfile = {
          guru_id: u.guru_id || 'GURU-' + u.user_id,
          nama_lengkap: u.nama_guru,
          nip: u.nip || '',
          pangkat_golongan: (u as any).pangkat_golongan || 'Penata / III c',
          jabatan: (u as any).jabatan || 'Guru Pengajar',
          mata_pelajaran: (u as any).mata_pelajaran || 'Matematika',
          foto_profil_url: (u as any).foto_profil_url || '',
          email: u.email || '',
          telepon: (u as any).telepon || '',
          kelas_diampu: u.kelas_diampu || [],
        };
        if (idx >= 0) {
          list[idx] = { ...profData, ...list[idx] };
        } else {
          list.push(profData);
        }
      }
    }

    localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(list));
    return list;
  }

  public async getGuruProfile(guruIdOrNip?: string): Promise<GuruProfile> {
    const profiles = await this.getGuruProfileList();
    const currentUser = this.getCurrentUser();

    if (guruIdOrNip) {
      const found = profiles.find(
        (p) => p.guru_id === guruIdOrNip || (p.nip && p.nip === guruIdOrNip) || p.nama_lengkap.toLowerCase() === guruIdOrNip.toLowerCase()
      );
      if (found) return found;
    }

    if (currentUser?.guru_id || currentUser?.nip || currentUser?.nama_guru) {
      const found = profiles.find(
        (p) =>
          (currentUser.guru_id && p.guru_id === currentUser.guru_id) ||
          (currentUser.nip && p.nip === currentUser.nip) ||
          (currentUser.nama_guru && p.nama_lengkap.toLowerCase() === currentUser.nama_guru.toLowerCase())
      );
      if (found) return found;
    }

    if (currentUser) {
      return {
        guru_id: currentUser.guru_id || 'GURU-' + currentUser.user_id,
        nama_lengkap: currentUser.nama_guru || currentUser.username,
        nip: currentUser.nip || '-',
        pangkat_golongan: currentUser.role === 'admin' ? 'Pembina Utama Muda / IV c' : 'Penata / III c',
        jabatan: currentUser.role === 'admin' ? 'Administrator Sistem & TI' : 'Guru Pengajar',
        mata_pelajaran: currentUser.role === 'admin' ? 'Teknologi Informasi' : 'Matematika',
        foto_profil_url: (currentUser as any).foto_profil_url || '',
        email: currentUser.email || '',
        telepon: (currentUser as any).telepon || '',
        kelas_diampu: currentUser.kelas_diampu || [],
      };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.GURU);
    return raw ? JSON.parse(raw) : (profiles[0] || initialGuruProfile);
  }

  public async saveGuruProfile(profile: GuruProfile): Promise<ApiResponse> {
    const profiles = await this.getGuruProfileList();
    const idx = profiles.findIndex((p) => p.guru_id === profile.guru_id || (profile.nip && p.nip === profile.nip));
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile };
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(STORAGE_KEYS.GURU_PROFILES, JSON.stringify(profiles));

    // Sinkronkan ke Akun Pengguna (Users) di local storage
    const users = await this.getUserList();
    const userIdx = users.findIndex(
      (u) =>
        (profile.guru_id && u.guru_id === profile.guru_id) ||
        (profile.nip && u.nip === profile.nip) ||
        (profile.guru_id === 'GURU-ADMIN' && u.role === 'admin')
    );

    if (userIdx >= 0) {
      const targetUser = users[userIdx];
      targetUser.nama_guru = profile.nama_lengkap;
      targetUser.nip = profile.nip;
      targetUser.email = profile.email;
      (targetUser as any).pangkat_golongan = profile.pangkat_golongan;
      (targetUser as any).jabatan = profile.jabatan;
      (targetUser as any).mata_pelajaran = profile.mata_pelajaran;
      (targetUser as any).foto_profil_url = profile.foto_profil_url;
      (targetUser as any).telepon = profile.telepon;
      targetUser.kelas_diampu = profile.kelas_diampu;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Jika user yang diedit cocok dengan user yang sedang login, update sesi aktifnya
      const currentSession = this.getCurrentUser();
      if (
        currentSession &&
        (currentSession.user_id === targetUser.user_id ||
          currentSession.guru_id === profile.guru_id ||
          (currentSession.role === 'admin' && profile.guru_id === 'GURU-ADMIN'))
      ) {
        const updatedSession: UserAccount = {
          ...currentSession,
          nama_guru: profile.nama_lengkap,
          nip: profile.nip,
          email: profile.email,
          kelas_diampu: profile.kelas_diampu,
          ...(profile as any),
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedSession));
        localStorage.setItem(STORAGE_KEYS.GURU, JSON.stringify(profile));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.GURU, JSON.stringify(profile));
    }

    if (this.isOnlineGasMode()) {
      try {
        await this.callGas('saveGuruProfile', { profile });
      } catch (err) {
        console.error('GAS save error:', err);
      }
    }
    this.addLog('SAVE_PROFILE', 'PROFIL', `Memperbarui data profil ${profile.nama_lengkap}`, profile.guru_id);
    this.notifyDataChanged('PROFILE_CHANGED', profile);
    return { success: true, message: `Profil "${profile.nama_lengkap}" berhasil diperbarui!` };
  }

  // --- MASTER DATA ---
  public async getKelasList(): Promise<Kelas[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.KELAS);
    let classes: Kelas[] = raw ? JSON.parse(raw) : initialKelasList;
    const initialLen = classes.length;
    classes = classes.filter((c) => !isLegacyDeletedClass(c.kelas_id) && !isLegacyDeletedClass(c.nama_kelas));
    if (classes.length !== initialLen) {
      localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(classes));
    }
    const sorted = sortKelasList(classes);
    const students: Siswa[] = await this.getSiswaList();
    return sorted.map((k) => ({
      ...k,
      jumlah_siswa: students.filter((s) => s.kelas_id === k.kelas_id && s.status === 'Aktif').length,
    }));
  }

  /**
   * Mengambil daftar kelas khusus yang diampu oleh akun guru yang sedang login.
   * Jika user adalah admin, akan mengembalikan semua kelas di sekolah.
   */
  public async getTeacherTaughtClasses(): Promise<{
    classes: Kelas[];
    isFiltered: boolean;
    totalAllClasses: number;
    guruName?: string;
  }> {
    const currentUser = this.getCurrentUser();
    const allClasses = await this.getKelasList();

    if (!currentUser || currentUser.role === 'admin') {
      return {
        classes: allClasses,
        isFiltered: false,
        totalAllClasses: allClasses.length,
      };
    }

    // Role Guru
    const profile = await this.getGuruProfile();
    const diampu = profile.kelas_diampu || currentUser.kelas_diampu || [];

    if (!diampu || diampu.length === 0) {
      return {
        classes: allClasses,
        isFiltered: false,
        totalAllClasses: allClasses.length,
        guruName: profile.nama_lengkap,
      };
    }

    const filtered = allClasses.filter(
      (k) => diampu.includes(k.kelas_id) || diampu.includes(k.nama_kelas)
    );

    return {
      classes: filtered.length > 0 ? filtered : allClasses,
      isFiltered: filtered.length > 0,
      totalAllClasses: allClasses.length,
      guruName: profile.nama_lengkap,
    };
  }

  public async saveKelas(kelas: Kelas): Promise<ApiResponse> {
    const list = await this.getKelasList();
    
    // Infer tingkat if empty
    let tingkat = kelas.tingkat;
    if (!tingkat) {
      const upper = (kelas.nama_kelas || '').toUpperCase().trim();
      if (upper.startsWith('XII')) tingkat = 'XII';
      else if (upper.startsWith('XI')) tingkat = 'XI';
      else if (upper.startsWith('X')) tingkat = 'X';
      else tingkat = 'X';
    }

    const payload: Kelas = {
      ...kelas,
      tingkat,
      nama_kelas: kelas.nama_kelas.trim(),
    };

    const idx = list.findIndex((k) => k.kelas_id === payload.kelas_id);
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.push(payload);
    }
    const sorted = sortKelasList(list);
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(sorted));

    // Update students cached class name if renamed
    try {
      const rawSiswa = localStorage.getItem(STORAGE_KEYS.SISWA);
      if (rawSiswa) {
        const students: Siswa[] = JSON.parse(rawSiswa);
        let updated = false;
        const mappedStudents = students.map((s) => {
          if (s.kelas_id === payload.kelas_id && s.nama_kelas !== payload.nama_kelas) {
            updated = true;
            return { ...s, nama_kelas: payload.nama_kelas };
          }
          return s;
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(mappedStudents));
        }
      }
    } catch (e) {
      console.warn('Error updating student class name cache', e);
    }

    this.addLog('SAVE_KELAS', 'MASTER_DATA', `Menyimpan data kelas ${payload.nama_kelas} (Tingkat ${payload.tingkat})`, payload.kelas_id);
    this.notifyDataChanged('KELAS_CHANGED', payload);
    return { success: true, message: `Kelas ${payload.nama_kelas} berhasil disimpan!` };
  }

  public async ensureKelasExists(namaKelas: string, tingkatInput?: string): Promise<Kelas> {
    const trimmed = namaKelas.trim();
    if (!trimmed) throw new Error('Nama kelas tidak boleh kosong');

    const list = await this.getKelasList();
    const existing = list.find((k) => k.nama_kelas.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    let tingkat = tingkatInput;
    if (!tingkat) {
      const upper = trimmed.toUpperCase();
      if (upper.startsWith('XII')) tingkat = 'XII';
      else if (upper.startsWith('XI')) tingkat = 'XI';
      else if (upper.startsWith('X')) tingkat = 'X';
      else tingkat = 'X';
    }

    const newKelas: Kelas = {
      kelas_id: `KLS-${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
      nama_kelas: trimmed,
      tingkat: tingkat || 'X',
      tahun_ajaran: '2026/2027',
      jumlah_siswa: 0,
    };

    await this.saveKelas(newKelas);

    // If current logged-in user is a teacher, auto-assign this class to their kelas_diampu
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.role === 'guru') {
      try {
        const profile = await this.getGuruProfile();
        const currentDiampu = profile.kelas_diampu || [];
        if (!currentDiampu.includes(newKelas.kelas_id) && !currentDiampu.includes(newKelas.nama_kelas)) {
          profile.kelas_diampu = [...currentDiampu, newKelas.kelas_id];
          await this.saveGuruProfile(profile);
        }
      } catch (e) {
        console.warn('Could not auto-assign class to teacher profile:', e);
      }
    }

    return newKelas;
  }

  public async deleteKelas(kelasId: string): Promise<ApiResponse> {
    const list = (await this.getKelasList()).filter((k) => k.kelas_id !== kelasId);
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(sortKelasList(list)));
    this.addLog('DELETE_KELAS', 'MASTER_DATA', `Menghapus data kelas ${kelasId}`, kelasId);
    this.notifyDataChanged('KELAS_CHANGED', { deletedKelasId: kelasId });
    return { success: true, message: 'Kelas berhasil dihapus!' };
  }

  public async getMapelList(): Promise<MataPelajaran[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.MAPEL);
    return raw ? JSON.parse(raw) : initialMapelList;
  }

  public async saveMapel(mapel: MataPelajaran): Promise<ApiResponse> {
    const list = await this.getMapelList();
    const payload: MataPelajaran = {
      ...mapel,
      kode_mapel: mapel.kode_mapel.toUpperCase().trim(),
      nama_mapel: mapel.nama_mapel.trim(),
      tingkat: mapel.tingkat || 'X, XI, XII',
      kkm_default: Number(mapel.kkm_default) || 75,
    };

    const idx = list.findIndex((m) => m.mapel_id === payload.mapel_id);
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.push(payload);
    }
    localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(list));
    this.addLog('SAVE_MAPEL', 'MASTER_DATA', `Menyimpan mata pelajaran ${payload.nama_mapel}`, payload.mapel_id);
    this.notifyDataChanged('MAPEL_CHANGED', payload);
    return { success: true, message: `Mata pelajaran ${payload.nama_mapel} berhasil disimpan!` };
  }

  public async ensureMapelExists(namaMapel: string, tingkat: string = 'X, XI, XII'): Promise<MataPelajaran> {
    const trimmed = namaMapel.trim();
    if (!trimmed) throw new Error('Nama mata pelajaran tidak boleh kosong');

    const list = await this.getMapelList();
    const existing = list.find((m) => m.nama_mapel.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    // Generate clean code from name (e.g. "Prakarya dan Kewirausahaan" -> "PKWU" or "MAT")
    const words = trimmed.split(/\s+/).filter(Boolean);
    let kode = '';
    if (words.length >= 2) {
      kode = words.map((w) => w[0]).join('').toUpperCase().substring(0, 5);
    } else {
      kode = trimmed.substring(0, 3).toUpperCase();
    }

    const newMapel: MataPelajaran = {
      mapel_id: `MP-${kode}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      kode_mapel: kode,
      nama_mapel: trimmed,
      tingkat: tingkat || 'X, XI, XII',
      kkm_default: 75,
    };

    await this.saveMapel(newMapel);
    return newMapel;
  }

  public async deleteMapel(mapelId: string): Promise<ApiResponse> {
    const list = (await this.getMapelList()).filter((m) => m.mapel_id !== mapelId);
    localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(list));
    this.addLog('DELETE_MAPEL', 'MASTER_DATA', `Menghapus mata pelajaran ${mapelId}`, mapelId);
    this.notifyDataChanged('MAPEL_CHANGED', { deletedMapelId: mapelId });
    return { success: true, message: 'Mata pelajaran berhasil dihapus!' };
  }

  public async getSiswaList(kelasId?: string): Promise<Siswa[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.SISWA);
    let students: Siswa[] = raw ? JSON.parse(raw) : initialSiswaList;
    if (kelasId && kelasId !== 'ALL') {
      students = students.filter((s) => s.kelas_id === kelasId);
    }
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.KELAS) || '[]') as Kelas[];
    const classMap = new Map(classes.map((c) => [c.kelas_id, c.nama_kelas]));
    return students.map((s) => ({
      ...s,
      nama_kelas: classMap.get(s.kelas_id) || s.nama_kelas || s.kelas_id,
    }));
  }

  public async saveSiswa(siswa: Siswa): Promise<ApiResponse> {
    const list = await this.getSiswaList();
    const idx = list.findIndex((s) => s.siswa_id === siswa.siswa_id);
    if (idx >= 0) {
      list[idx] = siswa;
    } else {
      list.push(siswa);
    }
    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(list));
    this.addLog('SAVE_SISWA', 'DATA_SISWA', `Menyimpan data siswa: ${siswa.nama_lengkap} (${siswa.nis})`, siswa.siswa_id);
    this.notifyDataChanged('SISWA_CHANGED', siswa);
    return { success: true, message: `Data siswa ${siswa.nama_lengkap} berhasil disimpan!` };
  }

  public async deleteSiswa(siswaId: string): Promise<ApiResponse> {
    const list = (await this.getSiswaList()).filter((s) => s.siswa_id !== siswaId);
    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(list));
    this.addLog('DELETE_SISWA', 'DATA_SISWA', `Menghapus siswa ID ${siswaId}`, siswaId);
    this.notifyDataChanged('SISWA_CHANGED', { deletedSiswaId: siswaId });
    return { success: true, message: 'Data siswa berhasil dihapus!' };
  }

  public async importSiswaBatch(imported: Siswa[]): Promise<ApiResponse> {
    const existing = await this.getSiswaList();
    const existingMap = new Map(existing.map((s) => [s.nis, s]));
    let countNew = 0;
    let countUpdated = 0;

    imported.forEach((item) => {
      if (existingMap.has(item.nis)) {
        const old = existingMap.get(item.nis)!;
        Object.assign(old, item);
        countUpdated++;
      } else {
        existing.push(item);
        countNew++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(existing));
    this.addLog('IMPORT_SISWA', 'DATA_SISWA', `Import data siswa: ${countNew} baru, ${countUpdated} diperbarui`);
    this.notifyDataChanged('SISWA_CHANGED', { countNew, countUpdated });
    return {
      success: true,
      message: `Berhasil mengimpor siswa! (${countNew} data baru, ${countUpdated} data diperbarui)`,
    };
  }

  // --- JADWAL MENGAJAR ---
  public async getJadwalList(): Promise<JadwalMengajar[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.JADWAL);
    const jadwal: JadwalMengajar[] = raw ? JSON.parse(raw) : initialJadwalList;
    const classes = await this.getKelasList();
    const mapels = await this.getMapelList();
    const classMap = new Map(classes.map((c) => [c.kelas_id, c.nama_kelas]));
    const mapelMap = new Map(mapels.map((m) => [m.mapel_id, m.nama_mapel]));

    return jadwal.map((j) => ({
      ...j,
      nama_kelas: classMap.get(j.kelas_id) || j.nama_kelas || j.kelas_id,
      nama_mapel: mapelMap.get(j.mapel_id) || j.nama_mapel || j.mapel_id,
    }));
  }

  public async saveJadwal(jadwal: JadwalMengajar): Promise<ApiResponse> {
    const list = await this.getJadwalList();
    const idx = list.findIndex((j) => j.jadwal_id === jadwal.jadwal_id);
    if (idx >= 0) {
      list[idx] = jadwal;
    } else {
      list.push(jadwal);
    }
    localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(list));
    this.addLog('SAVE_JADWAL', 'JADWAL', `Menyimpan jadwal hari ${jadwal.hari}, jam ${jadwal.jam_ke}`, jadwal.jadwal_id);
    this.notifyDataChanged('JADWAL_CHANGED', jadwal);
    return { success: true, message: 'Jadwal mengajar berhasil disimpan!' };
  }

  public async deleteJadwal(jadwalId: string): Promise<ApiResponse> {
    const list = (await this.getJadwalList()).filter((j) => j.jadwal_id !== jadwalId);
    localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(list));
    this.addLog('DELETE_JADWAL', 'JADWAL', `Menghapus jadwal ID: ${jadwalId}`, jadwalId);
    this.notifyDataChanged('JADWAL_CHANGED', { deletedJadwalId: jadwalId });
    return { success: true, message: 'Jadwal mengajar berhasil dihapus!' };
  }

  // --- ABSENSI SISWA (BATCH OPERATIONS) ---
  public async getAbsensiList(filter?: { kelas_id?: string; tanggal?: string }): Promise<AbsensiRecord[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ABSENSI);
    let records: AbsensiRecord[] = raw ? JSON.parse(raw) : initialAbsensiList;
    if (filter?.kelas_id && filter.kelas_id !== 'ALL') {
      records = records.filter((r) => r.kelas_id === filter.kelas_id);
    }
    if (filter?.tanggal) {
      records = records.filter((r) => r.tanggal === filter.tanggal);
    }
    return records;
  }

  public async saveBatchAttendance(records: AbsensiRecord[]): Promise<ApiResponse> {
    if (!records || records.length === 0) {
      return { success: false, message: 'Tidak ada data absensi untuk disimpan' };
    }
    const currentList = await this.getAbsensiList();
    const targetDate = records[0].tanggal;
    const targetKelas = records[0].kelas_id;

    const cleaned = currentList.filter((r) => !(r.tanggal === targetDate && r.kelas_id === targetKelas));
    const merged = [...cleaned, ...records];

    localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(merged));

    if (this.isOnlineGasMode()) {
      try {
        await this.callGas('saveBatchAttendance', { records });
      } catch (err) {
        console.warn('Sync to GAS failed:', err);
      }
    }

    this.addLog(
      'SAVE_ABSENSI',
      'ABSENSI',
      `Menyimpan batch absensi ${records.length} siswa kelas ${targetKelas} (${targetDate})`,
      `${targetKelas}-${targetDate}`
    );
    this.notifyDataChanged('ABSENSI_CHANGED', { targetKelas, targetDate, count: records.length });
    return { success: true, message: `Absensi ${records.length} siswa berhasil disimpan dengan status terkini!` };
  }

  // --- JURNAL MENGAJAR ---
  public async getJurnalList(filter?: { kelas_id?: string; mapel_id?: string; query?: string }): Promise<JurnalMengajar[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.JURNAL);
    let list: JurnalMengajar[] = raw ? JSON.parse(raw) : initialJurnalList;
    const classes = await this.getKelasList();
    const mapels = await this.getMapelList();
    const classMap = new Map(classes.map((c) => [c.kelas_id, c.nama_kelas]));
    const mapelMap = new Map(mapels.map((m) => [m.mapel_id, m.nama_mapel]));

    list = list.map((j) => ({
      ...j,
      nama_kelas: classMap.get(j.kelas_id) || j.nama_kelas || j.kelas_id,
      nama_mapel: mapelMap.get(j.mapel_id) || j.nama_mapel || j.mapel_id,
    }));

    if (filter?.kelas_id && filter.kelas_id !== 'ALL') {
      list = list.filter((j) => j.kelas_id === filter.kelas_id);
    }
    if (filter?.mapel_id && filter.mapel_id !== 'ALL') {
      list = list.filter((j) => j.mapel_id === filter.mapel_id);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter((j) => j.materi_pembelajaran.toLowerCase().includes(q) || j.catatan.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public async saveJurnal(jurnal: JurnalMengajar): Promise<ApiResponse> {
    const list = await this.getJurnalList();
    const idx = list.findIndex((j) => j.jurnal_id === jurnal.jurnal_id);
    if (idx >= 0) {
      list[idx] = jurnal;
    } else {
      list.unshift(jurnal);
    }
    localStorage.setItem(STORAGE_KEYS.JURNAL, JSON.stringify(list));

    if (this.isOnlineGasMode()) {
      try {
        await this.callGas('saveJournal', { journal: jurnal });
      } catch (err) {
        console.warn('Sync to GAS failed:', err);
      }
    }

    this.addLog('SAVE_JURNAL', 'JURNAL', `Menyimpan jurnal materi: ${jurnal.materi_pembelajaran}`, jurnal.jurnal_id);
    this.notifyDataChanged('JURNAL_CHANGED', jurnal);
    return { success: true, message: 'Jurnal Mengajar berhasil disimpan!' };
  }

  public async deleteJurnal(jurnalId: string): Promise<ApiResponse> {
    const list = (await this.getJurnalList()).filter((j) => j.jurnal_id !== jurnalId);
    localStorage.setItem(STORAGE_KEYS.JURNAL, JSON.stringify(list));
    this.addLog('DELETE_JURNAL', 'JURNAL', `Menghapus jurnal ID: ${jurnalId}`, jurnalId);
    this.notifyDataChanged('JURNAL_CHANGED', { deletedJurnalId: jurnalId });
    return { success: true, message: 'Jurnal berhasil dihapus!' };
  }

  // --- PENILAIAN SISWA (BATCH OPERATIONS) ---
  public async getPenilaianList(filter?: { kelas_id?: string; jenis?: string; nama_tugas_kd?: string }): Promise<PenilaianRecord[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.PENILAIAN);
    let list: PenilaianRecord[] = raw ? JSON.parse(raw) : initialPenilaianList;
    if (filter?.kelas_id && filter.kelas_id !== 'ALL') {
      list = list.filter((p) => p.kelas_id === filter.kelas_id);
    }
    if (filter?.jenis && filter.jenis !== 'ALL') {
      list = list.filter((p) => p.jenis_penilaian === filter.jenis);
    }
    if (filter?.nama_tugas_kd) {
      list = list.filter((p) => p.nama_tugas_kd === filter.nama_tugas_kd);
    }
    return list;
  }

  public async saveBatchPenilaian(records: PenilaianRecord[]): Promise<ApiResponse> {
    if (!records || records.length === 0) {
      return { success: false, message: 'Tidak ada data nilai yang dikirim' };
    }
    const currentList = await this.getPenilaianList();
    const taskName = records[0].nama_tugas_kd;
    const kelasId = records[0].kelas_id;

    const cleaned = currentList.filter((p) => !(p.nama_tugas_kd === taskName && p.kelas_id === kelasId));
    const merged = [...cleaned, ...records];

    localStorage.setItem(STORAGE_KEYS.PENILAIAN, JSON.stringify(merged));

    if (this.isOnlineGasMode()) {
      try {
        await this.callGas('saveBatchGrades', { records });
      } catch (err) {
        console.warn('Sync to GAS failed:', err);
      }
    }

    this.addLog('SAVE_NILAI', 'PENILAIAN', `Menyimpan penilaian ${taskName} (${records.length} siswa)`, `${kelasId}-${taskName}`);
    this.notifyDataChanged('PENILAIAN_CHANGED', { taskName, kelasId, count: records.length });
    return { success: true, message: `Nilai ${records.length} siswa berhasil disimpan!` };
  }

  // --- BIMBINGAN GURU WALI ---
  public async getBimbinganList(filter?: { kelas_id?: string; jenis?: string }): Promise<BimbinganSiswa[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.BIMBINGAN);
    let list: BimbinganSiswa[] = raw ? JSON.parse(raw) : initialBimbinganList;
    const classes = await this.getKelasList();
    const classMap = new Map(classes.map((c) => [c.kelas_id, c.nama_kelas]));
    list = list.map((b) => ({
      ...b,
      nama_kelas: classMap.get(b.kelas_id) || b.nama_kelas || b.kelas_id,
    }));

    if (filter?.kelas_id && filter.kelas_id !== 'ALL') {
      list = list.filter((b) => b.kelas_id === filter.kelas_id);
    }
    if (filter?.jenis && filter.jenis !== 'ALL') {
      list = list.filter((b) => b.jenis_bimbingan === filter.jenis);
    }
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public async saveBimbingan(bimbingan: BimbinganSiswa): Promise<ApiResponse> {
    const list = await this.getBimbinganList();
    const idx = list.findIndex((b) => b.bimbingan_id === bimbingan.bimbingan_id);
    if (idx >= 0) {
      list[idx] = bimbingan;
    } else {
      list.unshift(bimbingan);
    }
    localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(list));
    this.addLog('SAVE_BIMBINGAN', 'BIMBINGAN', `Catatan bimbingan untuk ${bimbingan.nama_siswa} (${bimbingan.jenis_bimbingan})`, bimbingan.bimbingan_id);
    this.notifyDataChanged('BIMBINGAN_CHANGED', bimbingan);
    return { success: true, message: 'Data bimbingan siswa berhasil disimpan!' };
  }

  public async deleteBimbingan(bimbinganId: string): Promise<ApiResponse> {
    const list = (await this.getBimbinganList()).filter((b) => b.bimbingan_id !== bimbinganId);
    localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(list));
    this.addLog('DELETE_BIMBINGAN', 'BIMBINGAN', `Menghapus catatan bimbingan ID: ${bimbinganId}`, bimbinganId);
    this.notifyDataChanged('BIMBINGAN_CHANGED', { deletedBimbinganId: bimbinganId });
    return { success: true, message: 'Data bimbingan berhasil dihapus!' };
  }

  // --- SISWA ASUH / BIMBINGAN WALI KHUSUS ---
  public async getSiswaAsuhList(guruId?: string): Promise<SiswaAsuhRecord[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ASUH) || '[]';
    const all: SiswaAsuhRecord[] = JSON.parse(raw);
    const currentUser = this.getCurrentUser();
    const targetGuruId = guruId || currentUser?.guru_id || 'GURU-ADMIN';
    if (currentUser?.role === 'admin' && !guruId) {
      return all;
    }
    return all.filter((a) => a.guru_id === targetGuruId);
  }

  public async getAllSiswaAsuhList(): Promise<SiswaAsuhRecord[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ASUH) || '[]';
    return JSON.parse(raw);
  }

  public async saveSiswaAsuh(data: Partial<SiswaAsuhRecord>): Promise<ApiResponse<SiswaAsuhRecord>> {
    const currentUser = this.getCurrentUser();
    const guruId = data.guru_id || currentUser?.guru_id || 'GURU-ADMIN';
    const all: SiswaAsuhRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASUH) || '[]');
    
    let record: SiswaAsuhRecord;
    const existingIdx = all.findIndex((a) => a.asuh_id === data.asuh_id);
    
    if (existingIdx >= 0) {
      record = {
        ...all[existingIdx],
        ...data,
      } as SiswaAsuhRecord;
      all[existingIdx] = record;
    } else {
      record = {
        asuh_id: data.asuh_id || `ASH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        guru_id: guruId,
        siswa_id: data.siswa_id,
        nis: data.nis?.trim() || '',
        nama_lengkap: data.nama_lengkap?.trim() || '',
        nama_kelas: data.nama_kelas?.trim() || '',
        jenis_kelamin: data.jenis_kelamin || 'L',
        catatan_khusus: data.catatan_khusus?.trim() || '',
        created_at: new Date().toISOString(),
      };
      all.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.ASUH, JSON.stringify(all));
    this.addLog('SAVE_SISWA_ASUH', 'BIMBINGAN', `Menyimpan siswa asuh: ${record.nama_lengkap} (${record.nama_kelas})`, record.asuh_id);
    this.notifyDataChanged('ASUH_CHANGED', record);
    return { success: true, message: 'Data Siswa Asuh berhasil disimpan!', data: record };
  }

  public async deleteSiswaAsuh(asuhId: string): Promise<ApiResponse> {
    const all: SiswaAsuhRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASUH) || '[]');
    const filtered = all.filter((a) => a.asuh_id !== asuhId);
    localStorage.setItem(STORAGE_KEYS.ASUH, JSON.stringify(filtered));
    this.addLog('DELETE_SISWA_ASUH', 'BIMBINGAN', `Menghapus siswa asuh ID: ${asuhId}`, asuhId);
    this.notifyDataChanged('ASUH_CHANGED', { deletedAsuhId: asuhId });
    return { success: true, message: 'Siswa asuh berhasil dihapus!' };
  }

  // --- KONFIGURASI SEKOLAH ---
  public async getConfig(): Promise<KonfigurasiSekolah> {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? JSON.parse(raw) : initialKonfigurasiSekolah;
  }

  public async saveConfig(config: KonfigurasiSekolah): Promise<ApiResponse> {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    this.addLog('SAVE_CONFIG', 'KONFIGURASI', 'Memperbarui konfigurasi sekolah dan KOP surat');
    this.notifyDataChanged('CONFIG_CHANGED', config);
    return { success: true, message: 'Konfigurasi sekolah berhasil disimpan!' };
  }

  // --- BACKUP & RESTORE ---
  public async exportBackup(): Promise<string> {
    const backupObj = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      guru: await this.getGuruProfile(),
      users: await this.getUserList(),
      config: await this.getConfig(),
      kelas: await this.getKelasList(),
      mapel: await this.getMapelList(),
      siswa: await this.getSiswaList(),
      jadwal: await this.getJadwalList(),
      absensi: await this.getAbsensiList(),
      jurnal: await this.getJurnalList(),
      penilaian: await this.getPenilaianList(),
      bimbingan: await this.getBimbinganList(),
      asuh: await this.getAllSiswaAsuhList(),
      logs: await this.getLogs(),
    };
    this.addLog('EXPORT_BACKUP', 'BACKUP', 'Melakukan backup seluruh data sistem');
    return JSON.stringify(backupObj, null, 2);
  }

  public async exportAllDataJson(): Promise<string> {
    return this.exportBackup();
  }

  public async importBackup(jsonString: string): Promise<ApiResponse> {
    try {
      const data = JSON.parse(jsonString);
      if (data.guru) localStorage.setItem(STORAGE_KEYS.GURU, JSON.stringify(data.guru));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
      if (data.kelas) localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(data.kelas));
      if (data.mapel) localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(data.mapel));
      if (data.siswa) localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(data.siswa));
      if (data.jadwal) localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(data.jadwal));
      if (data.absensi) localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(data.absensi));
      if (data.jurnal) localStorage.setItem(STORAGE_KEYS.JURNAL, JSON.stringify(data.jurnal));
      if (data.penilaian) localStorage.setItem(STORAGE_KEYS.PENILAIAN, JSON.stringify(data.penilaian));
      if (data.bimbingan) localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(data.bimbingan));
      if (data.asuh) localStorage.setItem(STORAGE_KEYS.ASUH, JSON.stringify(data.asuh));
      if (data.logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));

      this.addLog('RESTORE_BACKUP', 'BACKUP', 'Memulihkan data dari berkas cadangan JSON');
      this.notifyDataChanged('RESTORE_COMPLETED');
      return { success: true, message: 'Restore backup berhasil! Seluruh data telah diperbarui.' };
    } catch (err: any) {
      return { success: false, message: 'Format berkas backup tidak valid: ' + err.message };
    }
  }

  public async restoreDataFromJson(jsonString: string): Promise<ApiResponse> {
    return this.importBackup(jsonString);
  }

  public async resetToDemoData(): Promise<ApiResponse> {
    localStorage.clear();
    this.initLocalStorage();
    this.addLog('RESET_DATA', 'SYSTEM', 'Mengembalikan data sistem ke konfigurasi contoh awal');
    this.notifyDataChanged('RESET_COMPLETED');
    return { success: true, message: 'Data contoh berhasil dimuat ulang!' };
  }
}

export const apiService = new ApiService();
