import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export function memberAuth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error('Account registration is not configured yet. Please contact contact@bankregx.com.');
  }
  return getAuth(getApps().length ? getApp() : initializeApp(config));
}

export async function memberHeaders() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return {};
  const auth = memberAuth();
  await auth.authStateReady();
  return auth.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` } : {};
}
