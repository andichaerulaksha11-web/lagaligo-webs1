const { verify } = require('./_auth');

const COLS = ['nomor','kapal','material','jenis','lokasi','volume','start','finish','stop','wh','realisasi','rate','balance','revenue','remarks'];
const DEF = 'nomor text, kapal text, material text, jenis text, lokasi text, volume float8, start text, finish text, stop text, wh text, realisasi float8, rate float8, balance float8, revenue float8, remarks text';
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function insertRows(sql, rows) {
  const clean = rows.map(r => Object.fromEntries(COLS.map(c => [c, r[c] ?? null])));
  for (let i = 0; i < clean.length; i += 500) {
    const chunk = JSON.stringify(clean.slice(i, i + 500));
    await sql.query(
      `INSERT INTO records (${COLS.join(',')}) SELECT ${COLS.join(',')} FROM jsonb_to_recordset($1::jsonb) AS x(${DEF})`,
      [chunk]
    );
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const authed = () => verify(req.headers['x-auth-token']);

  if (!dbUrl) {
    if (req.method === 'GET') return res.status(200).json({ mode: 'readonly', rows: [] });
    return res.status(503).json({ error: 'Database belum terhubung. Hubungkan database Neon di Vercel (lihat README).' });
  }

  const { neon } = require('@neondatabase/serverless');
  const sql = neon(dbUrl);
  try {
    await sql`CREATE TABLE IF NOT EXISTS records (
      id serial PRIMARY KEY, nomor text, kapal text, material text, jenis text, lokasi text,
      volume float8, start text, finish text, stop text, wh text, realisasi float8, rate float8,
      balance float8, revenue float8, remarks text)`;

    if (req.method === 'GET') {
      const rows = await sql.query(`SELECT id, ${COLS.join(',')} FROM records ORDER BY start, id`);
      return res.status(200).json({ mode: 'db', rows });
    }

    if (!authed()) return res.status(401).json({ error: 'Sesi login berakhir. Silakan login ulang.' });

    if (req.method === 'POST') {
      const rows = Array.isArray(req.body && req.body.rows) ? req.body.rows : [];
      if (!rows.length) return res.status(400).json({ error: 'Tidak ada data.' });
      if (req.body.replace) await sql`TRUNCATE records RESTART IDENTITY`;
      await insertRows(sql, rows);
      return res.status(200).json({ ok: true, inserted: rows.length });
    }

    if (req.method === 'DELETE') {
      if (req.body && req.body.all) { await sql`TRUNCATE records RESTART IDENTITY`; return res.status(200).json({ ok: true }); }
      const ids = (req.body && req.body.ids || []).map(Number).filter(Boolean);
      if (!ids.length) return res.status(400).json({ error: 'ID kosong.' });
      await sql.query('DELETE FROM records WHERE id = ANY($1::int[])', [ids]);
      return res.status(200).json({ ok: true, deleted: ids.length });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
