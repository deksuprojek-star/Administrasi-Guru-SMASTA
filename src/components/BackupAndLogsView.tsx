/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  RefreshCw,
  FileJson,
} from 'lucide-react';
import { LogAktivitas } from '../types';
import { apiService } from '../services/apiService';

export const BackupAndLogsView: React.FC = () => {
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [searchLog, setSearchLog] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const l = await apiService.getLogs();
    setLogs(l);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDownloadBackup = async () => {
    const backupJson = await apiService.exportAllDataJson();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `SAG_BACKUP_DATABASE_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Cadangan database berhasil diunduh ke komputer Anda!');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const content = event.target?.result as string;
        const res = await apiService.restoreDataFromJson(content);
        if (res.success) {
          showToast(res.message);
          loadLogs();
        } else {
          showToast(res.message || 'Gagal memulihkan cadangan', 'error');
        }
      } catch (err: any) {
        showToast('Format berkas cadangan tidak valid: ' + err.message, 'error');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const filteredLogs = logs.filter(
    (l) =>
      !searchLog ||
      l.action.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.details.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-teal-600" />
            <span>Cadangan Data & Log Aktivitas Sistem</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen backup database berkala, pemulihan data (Restore), dan audit log transaksi guru
          </p>
        </div>
      </div>

      {/* Backup & Restore Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backup Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Ekspor Cadangan Database Penuh</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unduh seluruh tabel (Profil Guru, Master Kelas, Siswa, Jadwal, Absensi, Jurnal, Penilaian, Bimbingan) ke dalam satu berkas JSON terenkripsi lokal.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileJson className="w-4 h-4" />
            <span>Unduh Cadangan Database (.json)</span>
          </button>
        </div>

        {/* Restore Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Pulihkan Data (Restore)</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unggah berkas cadangan JSON yang pernah diekspor sebelumnya untuk mengembalikan seluruh catatan administrasi.
            </p>
          </div>

          <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isRestoring ? 'Memproses Pemulihan...' : 'Pilih Berkas Cadangan (.json)'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              disabled={isRestoring}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Activity Log (09_LOG_AKTIVITAS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <span>Log Aktivitas Sistem (Audit Trail)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Riwayat rekaman aksi perubahan data, waktu transaksi, dan status eksekusi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={loadLogs}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Segarkan Log"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-40">Waktu & Tanggal</th>
                <th className="py-3 px-4 w-48">Aksi</th>
                <th className="py-3 px-4">Rincian Aktivitas</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Tidak ada catatan aktivitas ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
