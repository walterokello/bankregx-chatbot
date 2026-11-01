import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function adminApp() {
  const existing = getApps().find(app => app.name === 'bankregx-admin');
  if (existing) return existing;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables.');
  }
  return initializeApp({ credential: cert({projectId, clientEmail, privateKey}) }, 'bankregx-admin');
}

// Defer credentials until a request needs them, so builds never need secrets.
export const adminDb = new Proxy({}, {
  get(_target, property) {
    const db = getFirestore(adminApp());
    const value = db[property];
    return typeof value === 'function' ? value.bind(db) : value;
  },
});
export function verifyMemberToken(token) {
  return getAuth(adminApp()).verifyIdToken(token, true);
}
