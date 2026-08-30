/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  School,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  FileText,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { KonfigurasiSekolah } from '../types';
import { apiService } from '../services/apiService';

interface KonfigurasiSekolahViewProps {
  config: KonfigurasiSekolah;
  onConfigUpdated: (config: KonfigurasiSekolah) => void;
  defaultSection?: 'identitas' | 'kop' | 'logo' | 'pimpinan';
}

export const KonfigurasiSekolahView: React.FC<KonfigurasiSekolahViewProps> = ({
  config,
  onConfigUpdated,
  defaultSection = 'identitas',
}) => {
  const [formData, setFormData] = useState<KonfigurasiSekolah>({ ...config });
  const [activeSection, setActiveSection] = useState<'all' | 'identitas' | 'kop' | 'logo' | 'pimpinan'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kopFotoInputRef = useRef<HTMLInputElement>(null);

  const kopSectionRef = useRef<HTMLDivElement>(null);
  const logoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData({ ...config });
  }, [config]);

  const handleChange = (field: keyof KonfigurasiSekolah, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'Ukuran file logo maksimal 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormData((prev) => ({
            ...prev,
            logo_url: result,
            kop_logo_kiri_url: prev.kop_logo_kiri_url || result,
          }));
          setStatus({ type: 'success', message: 'Logo sekolah berhasil dimuat dari perangkat!' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'Ukuran berkas foto KOP maksimal 3MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormData((prev) => ({
            ...prev,
            kop_surat_url: result,
          }));
          setStatus({ type: 'success', message: 'Foto KOP surat resmi berhasil diunggah!' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyDefaultKop = () => {
    setFormData((prev) => ({
      ...prev,
      kop_text_baris1: 'PEMERINTAH PROVINSI BALI',
      kop_text_baris2: 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
      kop_text_baris3: 'SMA NEGERI 1 TABANAN (TERAKREDITASI A)',
      kop_text_baris4: `Jl. Gunung Agung No. 122, Tabanan | Telp: ${prev.telepon || '(0361) 811234'} | Email: ${prev.email || 'info@sman1tabanan.sch.id'} | NPSN: ${prev.npsn || '50101123'}`,
    }));
    setStatus({ type: 'success', message: 'Format KOP surat resmi SMA Negeri 1 Tabanan diterapkan!' });
  };

  const scrollToKop = () => {
    setActiveSection('kop');
    kopSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLogo = () => {
    setActiveSection('logo');
    logoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await apiService.saveConfig(formData);
      if (res.success) {
        onConfigUpdated(formData);
        setStatus({ type: 'success', message: 'Konfigurasi sekolah, logo, dan KOP surat berhasil disimpan!' });
      } else {
        setStatus({ type: 'error', message: res.message || 'Gagal menyimpan konfigurasi.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Status Alert */}
      {status && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 shadow-xs ${
            status.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-5 h-5 text-teal-600" />
            <span>Konfigurasi Satuan Pendidikan & Sekolah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan identitas sekolah, Logo instansi, KOP surat resmi dokumen, dan pimpinan satuan pendidikan
          </p>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={scrollToKop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Atur KOP Surat</span>
          </button>
          <button
            type="button"
            onClick={scrollToLogo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Ubah Logo Sekolah</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Navigation Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
          {[
            { id: 'all', label: 'Semua Pengaturan' },
            { id: 'identitas', label: 'Identitas Sekolah' },
            { id: 'kop', label: 'KOP Surat Resmi' },
            { id: 'logo', label: 'Logo Sekolah' },
            { id: 'pimpinan', label: 'Kepala Sekolah & Periode' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-t-lg font-semibold transition-colors shrink-0 border-b-2 ${
                activeSection === tab.id
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: Identitas Satuan Pendidikan */}
        {(activeSection === 'all' || activeSection === 'identitas') && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Identitas Satuan Pendidikan</h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Data Pokok Pendidikan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Nama Resmi Sekolah / Satuan Pendidikan</label>
                <input
                  type="text"
                  value={formData.nama_sekolah}
                  onChange={(e) => handleChange('nama_sekolah', e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  placeholder="Contoh: SMA NEGERI 1 TABANAN"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Nomor Pokok Sekolah Nasional (NPSN)</label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => handleChange('npsn', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono"
                  placeholder="50101123"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Nomor Telepon Instansi</label>
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => handleChange('telepon', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="(0361) 811234"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Alamat Lengkap Sekolah</label>
                <input
                  type="text"
                  value={formData.alamat_sekolah}
                  onChange={(e) => handleChange('alamat_sekolah', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="Jl. Gunung Agung No. 122, Tabanan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Kelurahan / Desa</label>
                <input
                  type="text"
                  value={formData.kelurahan_desa || ''}
                  onChange={(e) => handleChange('kelurahan_desa', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="Dajan Peken"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Kecamatan</label>
                <input
                  type="text"
                  value={formData.kecamatan || ''}
                  onChange={(e) => handleChange('kecamatan', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="Tabanan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Kabupaten / Kota</label>
                <input
                  type="text"
                  value={formData.kabupaten_kota || ''}
                  onChange={(e) => handleChange('kabupaten_kota', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="Kabupaten Tabanan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Provinsi</label>
                <input
                  type="text"
                  value={formData.provinsi || ''}
                  onChange={(e) => handleChange('provinsi', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="Bali"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email Resmi</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="info@sman1tabanan.sch.id"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Website / Portal Resmi</label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  placeholder="https://sman1tabanan.sch.id"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Pengaturan KOP Surat Sekolah (Foto Link & Teks Format) */}
        {(activeSection === 'all' || activeSection === 'kop') && (
          <div ref={kopSectionRef} id="kop-sekolah" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Pengaturan KOP Surat Resmi Dokumen & Laporan</h2>
              </div>
              <button
                type="button"
                onClick={handleApplyDefaultKop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Format Standar SMAN 1 Tabanan</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              KOP Surat ini akan dicetak otomatis pada bagian atas setiap dokumen resmi seperti Jurnal PBM, Rekap Presensi Siswa, Lembar Penilaian, dan Rekap Bimbingan Konseling. Anda dapat menggunakan <strong>Foto / Link Gambar KOP Surat Utuh</strong> atau <strong>Format Teks Kedinasan</strong>.
            </p>

            {/* OPSI 1: FOTO / LINK GAMBAR KOP SURAT */}
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-700" />
                  <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                    Opsi Utama: Foto / Link Gambar KOP Surat Utuh (Scan / Format Gambar Resmi)
                  </h3>
                </div>
                {formData.kop_surat_url && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white">
                    Mode Gambar KOP Aktif
                  </span>
                )}
              </div>

              <p className="text-[11px] text-teal-800 leading-relaxed">
                Jika sekolah memiliki gambar/scan KOP surat resmi yang sudah jadi, masukkan link fotonya atau unggah dari perangkat. Gambar ini akan langsung tampil di atas dokumen saat dicetak.
              </p>

              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>URL / Link Foto KOP Surat Sekolah:</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.kop_surat_url || ''}
                      onChange={(e) => handleChange('kop_surat_url', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      placeholder="https://.../kop-surat-sekolah.png atau kosongkan untuk mode teks"
                    />
                    {formData.kop_surat_url && (
                      <button
                        type="button"
                        onClick={() => handleChange('kop_surat_url', '')}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                      >
                        Hapus Foto KOP
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Atau Unggah Foto KOP dari Komputer / HP</span>
                    <span className="text-[11px] text-slate-500">Mendukung format PNG, JPG, WEBP (Maksimal 3 MB)</span>
                  </div>
                  <input
                    type="file"
                    ref={kopFotoInputRef}
                    onChange={handleKopFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => kopFotoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto KOP Sekolah</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW KOP SURAT */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-700">
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {formData.kop_surat_url
                    ? 'Pratinjau Foto Gambar KOP Surat Sekolah (Akan Dicetak Pada Dokumen):'
                    : 'Pratinjau KOP Surat Kedinasan (Format Teks):'}
                </span>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs">
                {formData.kop_surat_url ? (
                  <div className="w-full flex flex-col items-center justify-center p-2 bg-slate-50/50 rounded-lg">
                    <img
                      src={formData.kop_surat_url}
                      alt="Pratinjau KOP Surat Sekolah"
                      className="w-full max-h-36 object-contain rounded-md border border-slate-200 shadow-xs bg-white"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <p className="text-[11px] text-teal-700 font-medium mt-2">
                      ✓ Foto KOP Surat Resmi aktif dan siap dicetak otomatis ke seluruh laporan
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      {/* Logo Kiri */}
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                        {formData.logo_url || formData.kop_logo_kiri_url ? (
                          <img
                            src={formData.kop_logo_kiri_url || formData.logo_url}
                            alt="Logo Sekolah"
                            className="w-14 h-14 object-contain"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            <School className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* KOP Text Center */}
                      <div className="flex-1 text-center space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 tracking-wider uppercase leading-tight">
                          {formData.kop_text_baris1 || 'PEMERINTAH PROVINSI BALI'}
                        </p>
                        <p className="text-xs font-semibold text-slate-800 tracking-wider uppercase leading-tight">
                          {formData.kop_text_baris2 || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'}
                        </p>
                        <p className="text-sm font-black text-slate-950 tracking-wide uppercase leading-snug">
                          {formData.kop_text_baris3 || formData.nama_sekolah || 'SMA NEGERI 1 TABANAN'}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium leading-tight">
                          {formData.kop_text_baris4 || `${formData.alamat_sekolah || 'Jl. Gunung Agung No. 122, Tabanan'} | Telp: ${formData.telepon || '(0361) 811234'} | NPSN: ${formData.npsn || '50101123'}`}
                        </p>
                      </div>
                    </div>

                    {/* Double Border Line Khas KOP Surat Resmi */}
                    <div className="mt-3 border-t-2 border-b border-slate-900 pt-0.5" />
                  </div>
                )}
              </div>
            </div>

            {/* OPSI 2: FORMAT TEKS STRUKTURAL KOP SURAT */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Opsi Format Teks Terstruktur KOP Surat (Digunakan jika Foto KOP tidak diisi)
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Header KOP Baris 1 (Instansi / Pemerintah Provinsi)
                  </label>
                  <input
                    type="text"
                    value={formData.kop_text_baris1 || ''}
                    onChange={(e) => handleChange('kop_text_baris1', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                    placeholder="PEMERINTAH PROVINSI BALI"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Header KOP Baris 2 (Dinas Pendidikan / Badan Pengawas)
                  </label>
                  <input
                    type="text"
                    value={formData.kop_text_baris2 || ''}
                    onChange={(e) => handleChange('kop_text_baris2', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                    placeholder="DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Header KOP Baris 3 (Nama Satuan Pendidikan & Status Akreditasi)
                  </label>
                  <input
                    type="text"
                    value={formData.kop_text_baris3 || ''}
                    onChange={(e) => handleChange('kop_text_baris3', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-bold text-slate-900"
                    placeholder="SMA NEGERI 1 TABANAN (TERAKREDITASI A)"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Header KOP Baris 4 (Alamat, Kontak, Kode Pos, Website & NPSN)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.kop_text_baris4 || ''}
                    onChange={(e) => handleChange('kop_text_baris4', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    placeholder="Jl. Gunung Agung No. 122, Tabanan, Bali | Telp: (0361) 811234 | Email: info@sman1tabanan.sch.id | NPSN: 50101123"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Logo & Lambang Sekolah (Permintaan Khusus User) */}
        {(activeSection === 'all' || activeSection === 'logo') && (
          <div ref={logoSectionRef} id="logo-sekolah" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Logo & Lambang Resmi Sekolah</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs items-start">
              {/* Preview Logo Aktif */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs flex items-center justify-center overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo Sekolah"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <School className="w-12 h-12 text-teal-600" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Logo Sekolah Aktif</span>
                  <span className="text-[11px] text-slate-500">Tampil di Sidebar, Navbar & Dokumen</span>
                </div>
              </div>

              {/* Upload & URL Input */}
              <div className="md:col-span-2 space-y-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">URL Gambar Logo Sekolah</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => handleChange('logo_url', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      placeholder="https://.../logo-sman1tabanan.png"
                    />
                  </div>
                </div>

                {/* Upload File Button */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Unggah Logo dari Komputer/HP</span>
                    <span className="text-[11px] text-slate-500">Mendukung format PNG, JPG, WEBP (Maksimal 2 MB)</span>
                  </div>
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas Logo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Kepala Sekolah & Periode Akademik */}
        {(activeSection === 'all' || activeSection === 'pimpinan') && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Kepala Sekolah & Periode Akademik</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Nama Kepala Sekolah (Lengkap Gelar)</label>
                <input
                  type="text"
                  value={formData.nama_kepala_sekolah}
                  onChange={(e) => handleChange('nama_kepala_sekolah', e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  placeholder="I Wayan Sudarta, S.Pd., M.Pd."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.nip_kepala_sekolah}
                  onChange={(e) => handleChange('nip_kepala_sekolah', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono"
                  placeholder="19720415 199802 1 004"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Tahun Ajaran Aktif</label>
                <input
                  type="text"
                  value={formData.tahun_ajaran}
                  onChange={(e) => handleChange('tahun_ajaran', e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-semibold"
                  placeholder="2026/2027"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Semester Berjalan</label>
                <select
                  value={formData.semester_aktif}
                  onChange={(e) => handleChange('semester_aktif', e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-semibold"
                >
                  <option value="Ganjil">Semester Ganjil (Gasal)</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tombol Simpan */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan Semua Konfigurasi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
