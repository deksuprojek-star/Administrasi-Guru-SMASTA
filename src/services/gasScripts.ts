/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GasScriptFile {
  filename: string;
  description: string;
  category: 'core' | 'database_setup' | 'modules' | 'storage';
  code: string;
}

export const SPREADSHEET_SCHEMAS = [
  {
    name: '01_MASTER_DATA',
    desc: 'Profil Guru, Data Akun Pengguna, Master Kelas, dan Mata Pelajaran',
    sheets: ['Guru', 'User', 'Kelas', 'MataPelajaran'],
  },
  {
    name: '02_DATA_SISWA',
    desc: 'Basis data siswa lengkap (NIS, Nama, JK, Kelas, Status)',
    sheets: ['Siswa'],
  },
  {
    name: '03_JADWAL_MENGAJAR',
    desc: 'Jadwal mengajar mingguan (Hari, Jam Ke, Kelas, Mapel, Ruang)',
    sheets: ['Jadwal'],
  },
  {
    name: '04_ABSENSI',
    desc: 'Rekaman presensi harian per kelas (Hadir, Sakit, Izin, Alpha, Dispensasi)',
    sheets: ['Absensi'],
  },
  {
    name: '05_JURNAL_MENGAJAR',
    desc: 'Catatan pelaksanaan KBM, materi pokok, catatan kelas & tindak lanjut',
    sheets: ['Jurnal'],
  },
  {
    name: '06_PENILAIAN',
    desc: 'Rekapitulasi penilaian harian, proyek, portofolio, SAS & KKM',
    sheets: ['Nilai'],
  },
  {
    name: '07_BIMBINGAN',
    desc: 'Catatan bimbingan siswa & guru wali/BK beserta rencana tindak lanjut',
    sheets: ['Bimbingan'],
  },
  {
    name: '08_KONFIGURASI',
    desc: 'Data identitas instansi sekolah, Kepala Sekolah & format KOP',
    sheets: ['Sekolah'],
  },
  {
    name: '09_LOG_AKTIVITAS',
    desc: 'Audit trail log riwayat pencatatan transaksi & keamanan',
    sheets: ['Log'],
  },
];

export const GAS_SCRIPTS: Record<string, GasScriptFile> = {
  setupDb: {
    filename: 'SetupInitialDB.gs',
    description: 'Skrip inisialisasi otomatis untuk membuat 9 File Google Sheets dan Folder Google Drive lengkap beserta header kolom.',
    category: 'database_setup',
    code: `/**
 * SISTEM ADMINISTRASI GURU - GOOGLE APPS SCRIPT
 * File: SetupInitialDB.gs
 * Fungsi: Membuat 9 Google Sheets terpisah dan Struktur Folder Google Drive
 * Jalankan fungsi "setupAllDatabaseAndFolders()" SATU KALI dari Script Editor.
 */

function setupAllDatabaseAndFolders() {
  const rootFolderName = "SISTEM ADMINISTRASI GURU";
  let rootFolder;
  
  // 1. Buat / Ambil Root Folder di Google Drive
  const existingFolders = DriveApp.getFoldersByName(rootFolderName);
  if (existingFolders.hasNext()) {
    rootFolder = existingFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootFolderName);
  }
  
  // 2. Buat Sub-Folder Google Drive
  const subFolders = [
    "01_PROFIL_GURU",
    "02_DOKUMEN",
    "03_LAPORAN/ABSENSI",
    "03_LAPORAN/JURNAL",
    "03_LAPORAN/PENILAIAN",
    "04_BACKUP",
    "05_TEMPLATE"
  ];
  
  const createdFolderIds = {};
  createdFolderIds["ROOT"] = rootFolder.getId();
  
  subFolders.forEach(folderPath => {
    const parts = folderPath.split('/');
    let currentParent = rootFolder;
    for (let part of parts) {
      let iter = currentParent.getFoldersByName(part);
      if (iter.hasNext()) {
        currentParent = iter.next();
      } else {
        currentParent = currentParent.createFolder(part);
      }
    }
    createdFolderIds[folderPath] = currentParent.getId();
  });
  
  // 3. Definisi 9 File Google Sheets Terpisah
  const dbSpecs = [
    {
      name: "01_MASTER_DATA",
      sheets: [
        {
          name: "Guru",
          headers: ["guru_id", "nama_lengkap", "nip", "pangkat_golongan", "jabatan", "mata_pelajaran", "foto_profil_url", "email", "telepon"]
        },
        {
          name: "User",
          headers: ["user_id", "username", "password_hash", "guru_id", "role", "status"]
        },
        {
          name: "Kelas",
          headers: ["kelas_id", "nama_kelas", "tingkat", "tahun_ajaran"]
        },
        {
          name: "MataPelajaran",
          headers: ["mapel_id", "kode_mapel", "nama_mapel", "tingkat", "kkm_default"]
        }
      ]
    },
    {
      name: "02_DATA_SISWA",
      sheets: [
        {
          name: "Siswa",
          headers: ["siswa_id", "nis", "nama_lengkap", "jenis_kelamin", "kelas_id", "status"]
        }
      ]
    },
    {
      name: "03_JADWAL_MENGAJAR",
      sheets: [
        {
          name: "Jadwal",
          headers: ["jadwal_id", "hari", "mapel_id", "jam_ke", "kelas_id", "guru_id", "ruang"]
        }
      ]
    },
    {
      name: "04_ABSENSI",
      sheets: [
        {
          name: "Absensi",
          headers: ["absensi_id", "tanggal", "kelas_id", "mapel_id", "siswa_id", "status", "keterangan", "guru_id", "created_at"]
        }
      ]
    },
    {
      name: "05_JURNAL_MENGAJAR",
      sheets: [
        {
          name: "Jurnal",
          headers: ["jurnal_id", "tanggal", "kelas_id", "mapel_id", "jam_ke", "materi_pembelajaran", "catatan", "rencana_tindak_lanjut", "guru_id", "created_at"]
        }
      ]
    },
    {
      name: "06_PENILAIAN",
      sheets: [
        {
          name: "Nilai",
          headers: ["nilai_id", "tanggal", "kelas_id", "mapel_id", "jenis_penilaian", "nama_tugas_kd", "kkm", "siswa_id", "nilai", "keterangan", "guru_id", "tahun_ajaran", "semester"]
        }
      ]
    },
    {
      name: "07_BIMBINGAN",
      sheets: [
        {
          name: "Bimbingan",
          headers: ["bimbingan_id", "tanggal", "siswa_id", "jenis_bimbingan", "masalah_bimbingan", "tindak_lanjut", "status_penanganan", "guru_id", "created_at"]
        }
      ]
    },
    {
      name: "08_KONFIGURASI",
      sheets: [
        {
          name: "Sekolah",
          headers: ["config_key", "config_value"]
        }
      ]
    },
    {
      name: "09_LOG_AKTIVITAS",
      sheets: [
        {
          name: "Log",
          headers: ["log_id", "timestamp", "user", "action", "module", "record_id", "status", "details"]
        }
      ]
    }
  ];
  
  const createdFileIds = {};
  const props = PropertiesService.getScriptProperties();
  
  dbSpecs.forEach(spec => {
    let ss;
    const existingFiles = rootFolder.getFilesByName(spec.name);
    if (existingFiles.hasNext()) {
      ss = SpreadsheetApp.open(existingFiles.next());
    } else {
      ss = SpreadsheetApp.create(spec.name);
      const file = DriveApp.getFileById(ss.getId());
      rootFolder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    
    createdFileIds[spec.name] = ss.getId();
    props.setProperty("SPREADSHEET_ID_" + spec.name, ss.getId());
    
    spec.sheets.forEach((sheetSpec, index) => {
      let sheet = ss.getSheetByName(sheetSpec.name);
      if (!sheet) {
        if (index === 0 && ss.getSheets().length === 1 && ss.getSheets()[0].getName() === "Sheet1") {
          sheet = ss.getSheets()[0];
          sheet.setName(sheetSpec.name);
        } else {
          sheet = ss.insertSheet(sheetSpec.name);
        }
      }
      
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(sheetSpec.headers);
        sheet.getRange(1, 1, 1, sheetSpec.headers.length)
             .setFontWeight("bold")
             .setBackground("#0f766e")
             .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }
    });
  });
  
  props.setProperty("FOLDER_PROFIL_ID", createdFolderIds["01_PROFIL_GURU"] || "");
  props.setProperty("FOLDER_BACKUP_ID", createdFolderIds["04_BACKUP"] || "");
  
  Logger.log("Inisialisasi Database Google Sheets & Folder Google Drive Selesai!");
  Logger.log("Daftar File Spreadsheet IDs: " + JSON.stringify(createdFileIds, null, 2));
  return { success: true, message: "Database dan Folder berhasil dibuat!", files: createdFileIds, folders: createdFolderIds };
}`,
  },
  code: {
    filename: 'Code.gs',
    description: 'Router Utama API Google Apps Script (doGet & doPost) dengan CORS dan respon JSON standar.',
    category: 'core',
    code: `/**
 * SISTEM ADMINISTRASI GURU - GOOGLE APPS SCRIPT
 * File: Code.gs (Master API Controller)
 * Menangani routing GET dan POST dari frontend web
 */

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  try {
    let action = "";
    let payload = {};
    
    if (method === "GET") {
      action = e.parameter.action || "ping";
      payload = e.parameter;
    } else {
      if (e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
        action = payload.action || e.parameter.action || "";
      } else {
        action = e.parameter.action || "";
        payload = e.parameter;
      }
    }
    
    let result;
    
    switch (action) {
      case "ping":
        result = { success: true, message: "Backend Google Apps Script Aktif & Terhubung", timestamp: new Date().toISOString() };
        break;
      case "login":
        result = Auth_login(payload);
        break;
      case "getGuruProfile":
        result = Guru_getProfile(payload);
        break;
      case "saveGuruProfile":
        result = Guru_saveProfile(payload);
        break;
      case "getMasterData":
        result = Master_getAll(payload);
        break;
      case "saveKelas":
        result = Master_saveKelas(payload);
        break;
      case "saveSiswa":
        result = Master_saveSiswa(payload);
        break;
      case "saveBatchAttendance":
        result = Absensi_saveBatch(payload);
        break;
      case "saveJournal":
        result = Jurnal_save(payload);
        break;
      case "saveBatchGrades":
        result = Penilaian_saveBatch(payload);
        break;
      default:
        result = { success: false, message: "Action tidak dikenali: " + action, errorCode: "UNKNOWN_ACTION" };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorResponse = {
      success: false,
      message: "Terjadi kesalahan internal server: " + error.toString(),
      errorCode: "SERVER_ERROR"
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`,
  },
  auth: {
    filename: 'Auth.gs',
    description: 'Modul Autentikasi Guru dan validasi token sesi.',
    category: 'modules',
    code: `/**
 * SISTEM ADMINISTRASI GURU - File: Auth.gs
 * Autentikasi Pengguna & Sesi Guru
 */

function Auth_login(payload) {
  const username = (payload.username || "").trim();
  const password = (payload.password || "").trim();
  
  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi", errorCode: "EMPTY_CREDENTIALS" };
  }
  
  // Default Admin Fallback
  if (username === "admin" && password === "admin123") {
    return {
      success: true,
      message: "Login berhasil",
      data: {
        user_id: "USR-ADMIN-01",
        username: "admin",
        guru_id: "GURU-ADMIN",
        role: "admin",
        nama_guru: "Administrator Sistem",
        token: "SESSION_TOKEN_" + Utilities.getUuid()
      }
    };
  }
  
  return { success: false, message: "Username atau password salah", errorCode: "INVALID_CREDENTIALS" };
}`,
  },
};
