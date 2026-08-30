/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GuruProfile {
  guru_id: string;
  nama_lengkap: string;
  nip: string;
  pangkat_golongan: string;
  jabatan: string;
  mata_pelajaran: string;
  foto_profil_url: string;
  email: string;
  telepon: string;
  kelas_diampu?: string[]; // Array kelas yang diampu guru, contoh: ['KLS-7A', 'KLS-7B'] atau ['VII A', 'VII B']
}

export interface UserAccount {
  user_id: string;
  username: string;
  password?: string;
  guru_id: string;
  role: 'guru' | 'admin';
  nama_guru: string;
  nip?: string;
  email?: string;
  status_aktif?: boolean;
  created_at?: string;
  kelas_diampu?: string[];
}

export interface Kelas {
  kelas_id: string;
  nama_kelas: string;
  tingkat: string; // e.g. "VII", "VIII", "IX" or "X", "XI", "XII"
  tahun_ajaran: string;
  wali_kelas?: string;
  jumlah_siswa?: number;
}

export interface MataPelajaran {
  mapel_id: string;
  kode_mapel: string;
  nama_mapel: string;
  tingkat: string;
  kkm_default: number;
}

export interface Siswa {
  siswa_id: string;
  nis: string;
  nisn?: string;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  kelas_id: string;
  nama_kelas?: string;
  status: 'Aktif' | 'Non-Aktif' | 'Mutasi' | 'Lulus';
}

export interface JadwalMengajar {
  jadwal_id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  mapel_id: string;
  nama_mapel?: string;
  jam_ke: string; // e.g. "1,2,3"
  kelas_id: string;
  nama_kelas?: string;
  guru_id: string;
  ruang?: string;
}

export type StatusAbsensi = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispensasi';

export interface AbsensiRecord {
  absensi_id: string;
  tanggal: string; // YYYY-MM-DD
  kelas_id: string;
  mapel_id?: string;
  siswa_id: string;
  nis: string;
  nama_siswa: string;
  jenis_kelamin: 'L' | 'P';
  status: StatusAbsensi;
  keterangan: string;
  guru_id: string;
  created_at: string;
}

export interface JurnalMengajar {
  jurnal_id: string;
  tanggal: string; // YYYY-MM-DD
  kelas_id: string;
  nama_kelas?: string;
  mapel_id: string;
  nama_mapel?: string;
  jam_ke: string; // e.g. "1,2,3"
  materi_pembelajaran: string;
  catatan: string;
  rencana_tindak_lanjut: string;
  guru_id: string;
  created_at: string;
}

export type JenisPenilaian =
  | 'UH'
  | 'Praktik'
  | 'Projek'
  | 'Produk'
  | 'Portofolio'
  | 'SAS'
  | 'Lainnya';

export interface PenilaianRecord {
  nilai_id: string;
  tanggal: string;
  kelas_id: string;
  mapel_id: string;
  jenis_penilaian: JenisPenilaian;
  nama_tugas_kd: string;
  kkm: number;
  siswa_id: string;
  nis: string;
  nama_siswa: string;
  nilai: number;
  keterangan?: string;
  guru_id: string;
  tahun_ajaran: string;
  semester: 'Ganjil' | 'Genap';
}

export type JenisBimbingan =
  | 'Akademik'
  | 'Karakter'
  | 'Kedisiplinan'
  | 'Pribadi'
  | 'Sosial'
  | 'Karir'
  | 'Lainnya';

export interface BimbinganSiswa {
  bimbingan_id: string;
  tanggal: string;
  siswa_id: string;
  nis: string;
  nama_siswa: string;
  jenis_kelamin?: 'L' | 'P';
  kelas_id: string;
  nama_kelas?: string;
  jenis_bimbingan: JenisBimbingan;
  masalah_observasi?: string;
  masalah_bimbingan?: string;
  solusi_rekomendasi?: string;
  tindak_lanjut?: string;
  rencana_tindak_lanjut?: string;
  status_penanganan?: 'Selesai' | 'Dalam Proses' | 'Perlu Pemantauan' | 'Dirujuk ke BK';
  guru_id: string;
  created_at: string;
}

export type BimbinganRecord = BimbinganSiswa;

export interface SiswaAsuhRecord {
  asuh_id: string;
  guru_id: string;
  siswa_id?: string;
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
  jenis_kelamin?: 'L' | 'P';
  catatan_khusus?: string;
  created_at: string;
}

export interface KonfigurasiSekolah {
  nama_sekolah: string;
  npsn: string;
  alamat_sekolah: string;
  kelurahan_desa: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  telepon: string;
  email: string;
  website: string;
  nama_kepala_sekolah: string;
  nip_kepala_sekolah: string;
  tahun_ajaran: string; // e.g. "2026/2027"
  semester_aktif: 'Ganjil' | 'Genap';
  logo_url: string;
  kop_surat_url?: string; // Foto / link kop surat sekolah utuh
  kop_text_baris1?: string;
  kop_text_baris2?: string;
  kop_text_baris3?: string;
  kop_text_baris4?: string;
  kop_logo_kiri_url?: string;
  kop_logo_kanan_url?: string;
}

export interface LogAktivitas {
  log_id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  record_id?: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  details: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'profil_guru'
  | 'master_data'
  | 'jadwal'
  | 'absensi'
  | 'jurnal'
  | 'penilaian'
  | 'bimbingan'
  | 'laporan'
  | 'konfigurasi'
  | 'gas_hub'
  | 'backup_log';
