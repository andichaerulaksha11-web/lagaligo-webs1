const crypto = require('crypto');
const USER = process.env.LOGIN_USER || 'admin';
const PASS = process.env.LOGIN_PASSWORD || 'admin123';
const SECRET = process.env.AUTH_SECRET || ('lagaligo|' + PASS);
const sign = m => crypto.createHmac('sha256', SECRET).update(m).digest('hex');

exports.login = (u, p) => {
  if (u !== USER || p !== PASS) return null;
  const exp = Date.now() + 12 * 3600e3;
  return exp + '.' + sign('admin|' + exp);
};
exports.verify = t => {
  const [exp, sig] = String(t || '').split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  const ok = Buffer.from(sign('admin|' + exp));
  const got = Buffer.from(sig);
  return got.length === ok.length && crypto.timingSafeEqual(got, ok);
};
