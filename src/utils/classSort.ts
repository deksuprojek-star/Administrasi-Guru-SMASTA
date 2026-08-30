export function getTingkatOrder(tingkat?: string, namaKelas?: string): number {
  const t = (tingkat || '').trim().toUpperCase();
  const name = (namaKelas || '').trim().toUpperCase();

  if (t === 'X' || name.startsWith('X ') || name.startsWith('X-') || name.startsWith('X.') || name === 'X') return 10;
  if (t === 'XI' || name.startsWith('XI ') || name.startsWith('XI-') || name.startsWith('XI.') || name === 'XI') return 11;
  if (t === 'XII' || name.startsWith('XII ') || name.startsWith('XII-') || name.startsWith('XII.') || name === 'XII') return 12;

  if (t === '10' || name.startsWith('10 ') || name.startsWith('10-') || name.startsWith('10.')) return 10;
  if (t === '11' || name.startsWith('11 ') || name.startsWith('11-') || name.startsWith('11.')) return 11;
  if (t === '12' || name.startsWith('12 ') || name.startsWith('12-') || name.startsWith('12.')) return 12;

  if (t === 'VII' || name.startsWith('VII ') || name.startsWith('VII-')) return 7;
  if (t === 'VIII' || name.startsWith('VIII ') || name.startsWith('VIII-')) return 8;
  if (t === 'IX' || name.startsWith('IX ') || name.startsWith('IX-')) return 9;

  return 99;
}

export function compareKelas(
  a: { tingkat?: string; nama_kelas?: string },
  b: { tingkat?: string; nama_kelas?: string }
): number {
  const orderA = getTingkatOrder(a.tingkat, a.nama_kelas);
  const orderB = getTingkatOrder(b.tingkat, b.nama_kelas);

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  const nameA = a.nama_kelas || '';
  const nameB = b.nama_kelas || '';
  return nameA.localeCompare(nameB, 'id', { numeric: true, sensitivity: 'base' });
}

export function sortKelasList<T extends { tingkat?: string; nama_kelas?: string }>(list: T[]): T[] {
  return [...list].sort(compareKelas);
}
