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
  BimbinganRecord,
  KonfigurasiSekolah,
  LogAktivitas,
} from '../types';

export const initialGuruProfile: GuruProfile = {
  guru_id: 'GURU-ADMIN',
  nama_lengkap: 'Administrator Sistem',
  nip: '19720415 199802 1 004',
  pangkat_golongan: 'Pembina Utama Muda / IV c',
  jabatan: 'Administrator Sistem & TI',
  mata_pelajaran: 'Teknologi Informasi',
  foto_profil_url: '',
  email: 'admin@sman1tabanan.sch.id',
  telepon: '(0361) 811234',
  kelas_diampu: [],
};

export const initialGuruProfiles: GuruProfile[] = [initialGuruProfile];

export const initialUserAccounts: UserAccount[] = [
  {
    user_id: 'USR-ADMIN-01',
    username: 'admin',
    password: 'admin123',
    guru_id: 'GURU-ADMIN',
    role: 'admin',
    nama_guru: 'Administrator Sistem',
    nip: '19720415 199802 1 004',
    email: 'admin@sman1tabanan.sch.id',
    status_aktif: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
];

export const initialUserAccount: UserAccount = initialUserAccounts[0];

export const initialKonfigurasiSekolah: KonfigurasiSekolah = {
  nama_sekolah: 'SMA NEGERI 1 TABANAN',
  npsn: '50101123',
  alamat_sekolah: 'Jl. Gunung Agung No. 122, Tabanan',
  kelurahan_desa: 'Dajan Peken',
  kecamatan: 'Tabanan',
  kabupaten_kota: 'Kabupaten Tabanan',
  provinsi: 'Bali',
  telepon: '(0361) 811234',
  email: 'info@sman1tabanan.sch.id',
  website: 'https://sman1tabanan.sch.id',
  nama_kepala_sekolah: 'I Wayan Sudarta, S.Pd., M.Pd.',
  nip_kepala_sekolah: '19720415 199802 1 004',
  tahun_ajaran: '2026/2027',
  semester_aktif: 'Ganjil',
  logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
  kop_surat_url: '',
  kop_text_baris1: 'PEMERINTAH PROVINSI BALI',
  kop_text_baris2: 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
  kop_text_baris3: 'SMA NEGERI 1 TABANAN (TERAKREDITASI A)',
  kop_text_baris4: 'Jl. Gunung Agung No. 122, Tabanan, Bali | Telp: (0361) 811234 | Email: info@sman1tabanan.sch.id | NPSN: 50101123',
  kop_logo_kiri_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
};

export const initialKelasList: Kelas[] = [
  // Tingkat X (X-1 s.d. X-12)
  { kelas_id: 'KLS-X-1', nama_kelas: 'X-1', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-2', nama_kelas: 'X-2', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-3', nama_kelas: 'X-3', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-4', nama_kelas: 'X-4', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-5', nama_kelas: 'X-5', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-6', nama_kelas: 'X-6', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-7', nama_kelas: 'X-7', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-8', nama_kelas: 'X-8', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-9', nama_kelas: 'X-9', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-10', nama_kelas: 'X-10', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-11', nama_kelas: 'X-11', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-X-12', nama_kelas: 'X-12', tingkat: 'X', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },

  // Tingkat XI (XI-1 s.d. XI-12)
  { kelas_id: 'KLS-XI-1', nama_kelas: 'XI-1', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-2', nama_kelas: 'XI-2', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-3', nama_kelas: 'XI-3', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-4', nama_kelas: 'XI-4', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-5', nama_kelas: 'XI-5', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-6', nama_kelas: 'XI-6', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-7', nama_kelas: 'XI-7', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-8', nama_kelas: 'XI-8', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-9', nama_kelas: 'XI-9', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-10', nama_kelas: 'XI-10', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-11', nama_kelas: 'XI-11', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XI-12', nama_kelas: 'XI-12', tingkat: 'XI', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },

  // Tingkat XII (XII-1 s.d. XII-12)
  { kelas_id: 'KLS-XII-1', nama_kelas: 'XII-1', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-2', nama_kelas: 'XII-2', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-3', nama_kelas: 'XII-3', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-4', nama_kelas: 'XII-4', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-5', nama_kelas: 'XII-5', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-6', nama_kelas: 'XII-6', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-7', nama_kelas: 'XII-7', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-8', nama_kelas: 'XII-8', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-9', nama_kelas: 'XII-9', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-10', nama_kelas: 'XII-10', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-11', nama_kelas: 'XII-11', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
  { kelas_id: 'KLS-XII-12', nama_kelas: 'XII-12', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 0 },
];

export const initialMapelList: MataPelajaran[] = [
  { mapel_id: 'MP-01', kode_mapel: 'MAT', nama_mapel: 'Matematika', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-02', kode_mapel: 'BIN', nama_mapel: 'Bahasa Indonesia', tingkat: 'X, XI, XII', kkm_default: 78 },
  { mapel_id: 'MP-03', kode_mapel: 'ING', nama_mapel: 'Bahasa Inggris', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-04', kode_mapel: 'FIS', nama_mapel: 'Fisika', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-05', kode_mapel: 'KIM', nama_mapel: 'Kimia', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-06', kode_mapel: 'BIO', nama_mapel: 'Biologi', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-07', kode_mapel: 'INF', nama_mapel: 'Informatika', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-08', kode_mapel: 'SEJ', nama_mapel: 'Sejarah', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-09', kode_mapel: 'EKO', nama_mapel: 'Ekonomi', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-10', kode_mapel: 'GEO', nama_mapel: 'Geografi', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-11', kode_mapel: 'SOS', nama_mapel: 'Sosiologi', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-12', kode_mapel: 'PPKN', nama_mapel: 'Pendidikan Pancasila', tingkat: 'X, XI, XII', kkm_default: 78 },
  { mapel_id: 'MP-13', kode_mapel: 'PAI', nama_mapel: 'Pendidikan Agama & Budi Pekerti', tingkat: 'X, XI, XII', kkm_default: 78 },
  { mapel_id: 'MP-14', kode_mapel: 'PJOK', nama_mapel: 'PJOK', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-15', kode_mapel: 'SBD', nama_mapel: 'Seni Budaya', tingkat: 'X, XI, XII', kkm_default: 75 },
  { mapel_id: 'MP-16', kode_mapel: 'BK', nama_mapel: 'Bimbingan Konseling (BK)', tingkat: 'X, XI, XII', kkm_default: 75 },
];

export const initialSiswaList: Siswa[] = [];

export const initialJadwalList: JadwalMengajar[] = [];

export const initialAbsensiList: AbsensiRecord[] = [];

export const initialJurnalList: JurnalMengajar[] = [];

export const initialPenilaianList: PenilaianRecord[] = [];

export const initialBimbinganList: BimbinganRecord[] = [];

export const initialLogList: LogAktivitas[] = [];

