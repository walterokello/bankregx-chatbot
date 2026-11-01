import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onIdTokenChanged, sendEmailVerification, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { memberAuth, memberHeaders } from '../lib/firebaseClientAuth';
import { readMembershipResponse } from '../lib/membershipResponse';

export function useMembership() {
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const headers = await memberHeaders();
      const response = await fetch('/api/membership/status', { headers, cache: 'no-store' });
      const data = await readMembershipResponse(response);
      if (current === generation.current) { setUsage(data); setError(''); }
    } catch (failure) {
      if (failure.code === 'MEMBERSHIP_RESPONSE_UNAVAILABLE') {
        console.warn('Membership endpoint returned an unexpected response', { status: failure.status, contentType: failure.contentType });
      }
      if (current === generation.current) { setUsage(null); setError(failure.message); }
    } finally { if (current === generation.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let unsubscribe;
    const requests = generation;
    try { unsubscribe = onIdTokenChanged(memberAuth(), account => { setUser(account); refresh(); }); }
    catch { refresh(); }
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { unsubscribe?.(); requests.current++; window.removeEventListener('focus', onFocus); };
  }, [refresh]);
  return { user, usage, loading, error, refresh, headers: memberHeaders };
}

function friendlyError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already uses that email. Sign in or reset your password.',
    'auth/invalid-credential': 'Check your email and password and try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Please choose a stronger password.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/operation-not-allowed': 'Registration is not enabled yet. Please contact contact@bankregx.com.',
    'auth/network-request-failed': 'Unable to connect. Check your connection and try again.',
  };
  return messages[error.code] || (error.code ? 'Unable to complete that action. Please try again.' : error.message);
}

export default function MembershipPanel({ membership, expanded = false }) {
  const { user, usage, loading, error, refresh } = membership;
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function act(action) {
    setBusy(true); setMessage('');
    try { await action(); }
    catch (failure) { setMessage(friendlyError(failure)); }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault();
    await act(async () => {
      const auth = memberAuth();
      if (mode === 'signup') {
        const account = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(account.user);
        setMessage('Account created. Check your email, verify your address, then select “I have verified my email”.');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setPassword('');
      await refresh();
    });
  }
  const exhausted = usage?.remaining === 0;
  return <aside id="membership" className="membership" aria-label="Membership and monthly allowance">
    <div className="summary">
      <div>
        <strong>{usage?.plan === 'member' ? 'Free membership' : 'Try BankRegX for free'}</strong>
        <p aria-live="polite">{loading ? 'Checking your allowance…' : usage
          ? `${usage.remaining} of ${usage.limit} assessments remaining this month.` : error}</p>
        {usage && <small>Resets {new Date(usage.resetsAt).toLocaleDateString('en-GB', {day:'numeric', month:'long', timeZone:'UTC'})} (UTC). All four assessment modes share this allowance.</small>}
      </div>
      {user && <button disabled={busy} onClick={() => act(async () => { await signOut(memberAuth()); await refresh(); })}>Sign out</button>}
    </div>
    {!usage && !loading && <button onClick={refresh}>Retry allowance check</button>}
    {exhausted && <p role="status">{usage.plan === 'member'
      ? 'You have used your five assessments. Come back after your monthly allowance resets.'
      : 'You have used your visitor assessment. Join for free to get five assessments per month.'}</p>}
    {user ? <div>
      <p>Signed in as {user.email}</p>
      {usage?.plan !== 'member' && <>
        <p>Verify your email to unlock five assessments per month.</p>
        <button disabled={busy} onClick={() => act(async () => {
          await user.reload(); await user.getIdToken(true); await refresh();
          setMessage(user.emailVerified ? 'Email verified.' : 'Your email is not verified yet. Check your inbox.');
        })}>I have verified my email</button>
        <button disabled={busy} onClick={() => act(async () => { await sendEmailVerification(user); setMessage('Verification email sent. Check your inbox.'); })}>Resend verification email</button>
      </>}
    </div> : <details open={expanded || exhausted || undefined}>
      <summary>Join free or sign in · 5 assessments per month</summary>
      <p>Visitors get one assessment per browser per month. Verified free members get five per account per month. No payment required.</p>
      <form onSubmit={submit}>
        <label htmlFor="member-email">Email address</label>
        <input id="member-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="member-password">Password</label>
        <input id="member-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 12 : undefined} required value={password} onChange={e => setPassword(e.target.value)} />
        {mode === 'signup' && <small>Use at least 12 characters. Verify your email to activate membership.</small>}
        <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create free account' : 'Sign in'}</button>
      </form>
      <button disabled={busy} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Already a member? Sign in' : 'Create a free account'}</button>
      <button disabled={busy || !email.trim()} onClick={() => act(async () => { await sendPasswordResetEmail(memberAuth(), email.trim()); setMessage('If an account exists for that email, you will receive a password reset link.'); })}>Reset password</button>
      <p><Link href="/security-governance">Security &amp; Governance</Link></p>
    </details>}
    {message && <p role="status">{message}</p>}
    <style jsx>{`
      .membership { padding: 22px; margin: 24px auto; max-width: 1120px; border: 1px solid #395453; border-radius: 18px; background: #10292b; color: #e6f6f3; line-height: 1.6; }
      .summary { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
      p { margin: 8px 0; } small { display: block; color: #b5cfcb; }
      summary { cursor: pointer; font-weight: 700; padding: 12px 0; }
      form { display: grid; gap: 10px; max-width: 430px; }
      input { font: inherit; padding: 12px; border-radius: 8px; border: 1px solid #83a6a0; color: #10292b; background: white; width: 100%; box-sizing: border-box; }
      button { font: inherit; cursor: pointer; padding: 10px 16px; margin: 8px 8px 0 0; border: 1px solid #60968d; border-radius: 9px; color: #dffff8; background: #18423c; }
      button:disabled { opacity: .5; cursor: default; }
      button:focus-visible, input:focus-visible, summary:focus-visible { outline: 3px solid #67e8d2; outline-offset: 3px; }
      @media (max-width: 700px) { .membership { margin: 16px; padding: 18px; } .summary { flex-wrap: wrap; } }
    `}</style>
  </aside>;
}
