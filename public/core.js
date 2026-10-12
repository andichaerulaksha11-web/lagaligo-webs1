/* Logika agregasi dashboard (dipakai di browser & Node untuk pengujian) */
(function (root) {
  const isGudang = k => /^(SILO|GUDANG)/i.test(k);
  const ym = s => s.slice(0, 7);
  const sum = (a, f) => a.reduce((t, x) => t + (f(x) || 0), 0);

  // Kelompokkan baris shift menjadi "kegiatan kapal" (voyage). Baris berikutnya menyambung
  // jika Volume-nya = Balance baris sebelumnya. Gudang/Silo dipecah per bulan.
  function buildVoyages(rows) {
    const groups = {};
    rows.forEach(r => { (groups[[r.lokasi, r.kapal, r.jenis, r.material].join('|')] ||= []).push(r); });
    const out = [];
    Object.values(groups).forEach(g => {
      g.sort((a, b) => a.start.localeCompare(b.start) || b.volume - a.volume);
      let cur = null;
      g.forEach(r => {
        const gud = isGudang(r.kapal);
        const brk = !cur || (gud ? ym(r.start) !== ym(cur.rows[0].start) : Math.abs(r.volume - cur.rows[cur.rows.length - 1].balance) > 1);
        if (brk) { cur = { lokasi: r.lokasi, kapal: r.kapal, jenis: r.jenis, material: r.material, gudang: gud, rows: [] }; out.push(cur); }
        cur.rows.push(r);
      });
    });
    out.forEach(v => { v.total = v.rows[0].volume; v.done = !v.gudang && v.rows[v.rows.length - 1].balance <= 1; });
    return out;
  }

  // Data per kapal untuk satu bulan & lokasi
  function shipsFor(voyages, month, lokasi) {
    const res = [];
    voyages.filter(v => !lokasi || v.lokasi === lokasi).forEach(v => {
      const rs = v.rows.filter(r => ym(r.start) === month);
      if (!rs.length) return;
      const last = rs[rs.length - 1], lastAll = v.rows[v.rows.length - 1];
      const cum = sum(v.rows.filter(r => r.start <= last.start), r => r.realisasi);
      res.push({
        lokasi: v.lokasi, kapal: v.kapal, jenis: v.jenis, material: v.material, gudang: v.gudang,
        awal: v.gudang ? rs[0].volume : v.total, real: v.gudang ? sum(rs, r => r.realisasi) : cum, bln: sum(rs, r => r.realisasi),
        akhir: last.balance, pct: v.gudang || !(v.total > 0) ? null : cum / v.total * 100, total: v.total, cum,
        sisa: v.gudang ? null : Math.max(last.balance, 0), revenue: sum(rs, r => r.revenue),
        mulai: rs[0].start, tglAkhir: last.finish,
        anomali: !v.gudang && cum > v.total * 1.05 + 5,
        status: v.gudang ? 'Gudang' : (v.done && last === lastAll ? 'Selesai' : 'Berjalan')
      });
    });
    res.sort((a, b) => a.mulai.localeCompare(b.mulai));
    const n = {}; res.forEach(s => { n[s.kapal] = (n[s.kapal] || 0) + 1; });
    const c = {}; res.forEach(s => { if (n[s.kapal] > 1) { c[s.kapal] = (c[s.kapal] || 0) + 1; s.label = s.kapal + ' (#' + c[s.kapal] + ')'; } else s.label = s.kapal; });
    return res;
  }

  const months = rows => [...new Set(rows.map(r => ym(r.start)))].sort();

  function dailyRevenue(rows, month) {
    const m = {}; rows.filter(r => ym(r.start) === month).forEach(r => { const d = +r.start.slice(8, 10); m[d] = (m[d] || 0) + r.revenue; });
    const days = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
    let acc = 0; const out = [];
    for (let d = 1; d <= days; d++) { const v = m[d] || 0; acc += v; out.push({ d, v, acc }); }
    return out;
  }

  const monthlyRevenue = rows => months(rows).map(mo => ({ m: mo, v: sum(rows.filter(r => ym(r.start) === mo), r => r.revenue) }));

  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BLN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthLabel = (m, full) => (full ? BLN_FULL : BLN)[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
  const nf = (n, d = 0) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: d });
  const rp = n => { const a = Math.abs(n); return a >= 1e9 ? 'Rp ' + nf(n / 1e9, 2) + ' M' : a >= 1e6 ? 'Rp ' + nf(n / 1e6, 1) + ' jt' : 'Rp ' + nf(n); };

  const api = { isGudang, buildVoyages, shipsFor, months, dailyRevenue, monthlyRevenue, monthLabel, nf, rp, sum };
  if (typeof module !== 'undefined') module.exports = api; else root.Core = api;
})(typeof window !== 'undefined' ? window : globalThis);
