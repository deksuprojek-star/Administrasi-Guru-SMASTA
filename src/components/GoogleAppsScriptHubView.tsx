/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  School,
  FileSpreadsheet,
  HardDrive,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { GAS_SCRIPTS, SPREADSHEET_SCHEMAS } from '../services/gasScripts';
import { apiService } from '../services/apiService';

export const GoogleAppsScriptHubView: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<keyof typeof GAS_SCRIPTS>('setupDb');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLiveOnline, setIsLiveOnline] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('SAG_GAS_WEBAPP_URL') || '';
    setWebAppUrl(stored);
    setIsLiveOnline(apiService.isOnlineMode());
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveAndTestUrl = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = webAppUrl.trim();
      apiService.setGasWebAppUrl(cleanUrl);
      setIsLiveOnline(Boolean(cleanUrl));

      if (!cleanUrl) {
        setTestResult({
          success: true,
          message: 'Mode Offline Aktif. Sistem menggunakan penyimpanan lokal browser (Local Database).',
        });
        setIsTesting(false);
        return;
      }

      // Test ping to GAS Web App
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const data = await res.json();
      if (data.status === 'ok' || data.success) {
        setTestResult({
          success: true,
          message: 'Koneksi Berhasil! Terhubung secara realtime dengan Google Apps Script & 9 Google Sheets.',
        });
      } else {
        setTestResult({
          success: true,
          message: 'URL tersimpan! Endpoint merespons dengan status: ' + JSON.stringify(data),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Tidak dapat menjangkau Web App: ' + (err.message || 'Pastikan Web App disetel "Anyone" pada Deploy'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-5 h-5 text-teal-600" />
            <span>Google Apps Script & Sheets Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat konfigurasi backend Google Apps Script, arsitektur 9 file Google Sheets, dan Google Drive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isLiveOnline
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isLiveOnline ? 'Online Google Sheets' : 'Offline Local Storage'}</span>
          </span>
        </div>
      </div>

      {/* Web App Connection Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-600" />
          <span>Konfigurasi Endpoint Google Apps Script Web App</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Tempelkan URL Web App hasil deploy dari Google Apps Script (Deploy &gt; New deployment &gt; Web app &gt; Execute as: Me, Who has access: Anyone).
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
          <button
            onClick={handleSaveAndTestUrl}
            disabled={isTesting}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Simpan & Tes Koneksi</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border border-rose-300 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}
      </div>

      {/* 9 Sheets Architecture Visualization */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Arsitektur 9 Database Google Sheets Terpisah</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuai instruksi arsitektur resmi: Membagi database menjadi 9 file terpisah di Google Drive untuk performa maksimal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SPREADSHEET_SCHEMAS.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-teal-300 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-teal-800">{item.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  {item.sheets.length} Sheets
                </span>
              </div>
              <p className="text-xs text-slate-600">{item.desc}</p>
              <div className="pt-1 text-[10px] text-slate-400 font-mono truncate">
                Tab: {item.sheets.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GAS Code Viewer & Copy Center */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-teal-600" />
              <span>Kode Sumber Google Apps Script Siap Salin</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Salin script berikut ke proyek Google Apps Script Anda (<a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-teal-600 underline">script.google.com</a>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(GAS_SCRIPTS[selectedScript].code, selectedScript)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedKey === selectedScript ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode ({GAS_SCRIPTS[selectedScript].filename})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Script Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs">
          {Object.entries(GAS_SCRIPTS).map(([key, script]) => (
            <button
              key={key}
              onClick={() => setSelectedScript(key as any)}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium whitespace-nowrap transition-colors ${
                selectedScript === key
                  ? 'bg-white text-teal-800 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {script.filename}
            </button>
          ))}
        </div>

        {/* Script Content */}
        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96">
          <pre>{GAS_SCRIPTS[selectedScript].code}</pre>
        </div>
      </div>
    </div>
  );
};
