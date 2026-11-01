import { randomUUID } from 'node:crypto';

export function monthlyWindow(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    period: `${year}-${String(month + 1).padStart(2, '0')}`,
    resetsAt: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
  };
}

function usageView(identity, used, window) {
  return { plan: identity.plan, limit: identity.limit, used,
    remaining: Math.max(0, identity.limit - used), resetsAt: window.resetsAt,
    needsVerification: Boolean(identity.needsVerification) };
}

export async function readUsage(db, identity, now = new Date()) {
  const window = monthlyWindow(now);
  const snapshot = await db.collection('monthly_assessment_usage')
    .doc(`${window.period}_${identity.key}`).get();
  return usageView(identity, snapshot.exists ? snapshot.data().used || 0 : 0, window);
}

// Reserve before any paid work. Firestore retries conflicting transactions so
// multiple tabs, processes and serverless instances share the same allowance.
export async function reserveAssessment(db, identity, now = new Date()) {
  const window = monthlyWindow(now);
  const counter = db.collection('monthly_assessment_usage').doc(`${window.period}_${identity.key}`);
  const attempt = counter.collection('attempts').doc(randomUUID());
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(counter);
    const used = snapshot.exists ? snapshot.data().used || 0 : 0;
    if (used >= identity.limit) return { allowed: false, usage: usageView(identity, used, window) };
    transaction.set(counter, { used: used + 1, period: window.period, plan: identity.plan,
      updatedAt: now.toISOString() }, { merge: true });
    transaction.set(attempt, { state: 'reserved', createdAt: now.toISOString() });
    return { allowed: true, counter, attempt, usage: usageView(identity, used + 1, window) };
  });
}

// The attempt state makes refunds idempotent. Keep the original month's ref
// when a request straddles midnight on the first of the month.
export async function settleAssessment(db, reservation, succeeded) {
  if (!reservation?.allowed) return;
  await db.runTransaction(async transaction => {
    const attempt = await transaction.get(reservation.attempt);
    if (!attempt.exists || attempt.data().state !== 'reserved') return;
    if (!succeeded) {
      const snapshot = await transaction.get(reservation.counter);
      transaction.update(reservation.counter, { used: Math.max(0, (snapshot.data()?.used || 0) - 1) });
    }
    transaction.update(reservation.attempt, { state: succeeded ? 'completed' : 'refunded' });
  });
}
