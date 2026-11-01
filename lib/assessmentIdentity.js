import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE = 'bankregx_visitor';
function digest(value, secret) {
  return createHmac('sha256', secret).update(value).digest('hex');
}
function safeEqual(a, b) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}
export function visitorToken(secret) {
  const id = randomBytes(32).toString('hex');
  return `${id}.${digest(`visitor:${id}`, secret)}`;
}
export function verifyVisitorToken(token, secret) {
  if (!/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(token || '')) return false;
  const [id, signature] = token.split('.');
  return safeEqual(signature, digest(`visitor:${id}`, secret));
}

export async function assessmentIdentity(req, res, verifyToken) {
  const secret = process.env.BANKREGX_SESSION_SECRET;
  if (!secret) throw new Error('Membership session configuration is missing');
  let decoded;
  if (req.headers.authorization) {
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization);
    if (!match) throw Object.assign(new Error('Please sign in again.'), { status: 401 });
    try { decoded = await verifyToken(match[1]); }
    catch { throw Object.assign(new Error('Your session expired. Please sign in again.'), { status: 401 }); }
    if (!decoded?.uid || decoded.firebase?.sign_in_provider === 'anonymous') {
      throw Object.assign(new Error('Please sign in with an email account.'), { status: 401 });
    }
    if (decoded.email_verified) {
      return { key: digest(`member:${decoded.uid}`, secret), userId: decoded.uid, plan: 'member', limit: 5 };
    }
  }
  const cookies = (req.headers.cookie || '').split(';').map(part => part.trim());
  let token = cookies.find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!verifyVisitorToken(token, secret)) {
    token = visitorToken(secret);
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=34560000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  }
  const key = digest(`visitor-id:${token.split('.')[0]}`, secret);
  return { key, userId: `visitor_${key}`, plan: 'visitor', limit: 1, needsVerification: Boolean(decoded) };
}
