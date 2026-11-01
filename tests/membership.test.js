import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyWindow, readUsage, reserveAssessment, settleAssessment } from '../lib/monthlyUsage.js';
import { assessmentIdentity, visitorToken, verifyVisitorToken } from '../lib/assessmentIdentity.js';

// Serializes transactions as Firestore does after resolving write conflicts.
export function database() {
  const data = new Map();
  let queue = Promise.resolve();
  const snapshot = ref => ({ exists: data.has(ref.path), data: () => structuredClone(data.get(ref.path)) });
  const ref = path => ({ path, collection: name => ({ doc: id => ref(`${path}/${name}/${id}`) }), get: async () => snapshot({path}) });
  return {
    collection: name => ({ doc: id => ref(`${name}/${id}`) }),
    runTransaction(action) {
      const run = queue.then(async () => {
        const changes = [];
        const result = await action({
          get: async reference => snapshot(reference),
          set: (reference, value, options) => changes.push(() => data.set(reference.path, options?.merge ? {...data.get(reference.path), ...value} : value)),
          update: (reference, value) => changes.push(() => data.set(reference.path, {...data.get(reference.path), ...value})),
        });
        changes.forEach(change => change());
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}
const visitor = {key: 'visitor-a', plan:'visitor', limit:1};
const member = {key:'member-a', plan:'member', limit:5};
const now = new Date('2026-12-31T23:59:59Z');

test('calendar windows use UTC and roll over at year end', () => {
  assert.deepEqual(monthlyWindow(now), {period:'2026-12', resetsAt:'2027-01-01T00:00:00.000Z'});
  assert.equal(monthlyWindow(new Date('2027-01-01T00:30:00+01:00')).period, '2026-12');
});

test('one visitor assessment; concurrent requests cannot exceed the allowance', async () => {
  const db = database();
  const results = await Promise.all(Array.from({length:12}, () => reserveAssessment(db, visitor, now)));
  assert.equal(results.filter(r => r.allowed).length, 1);
  assert.equal((await readUsage(db, visitor, now)).remaining, 0);
});

test('member gets exactly five across simultaneous requests and keeps same account quota', async () => {
  const db = database();
  const results = await Promise.all(Array.from({length:12}, () => reserveAssessment(db, member, now)));
  assert.equal(results.filter(r => r.allowed).length, 5);
  assert.equal((await reserveAssessment(db, {...member}, now)).allowed, false);
  assert.equal((await readUsage(db, {...member, key:'member-b'}, now)).remaining, 5);
});

test('monthly reset and refunds use original month, and refund only once', async () => {
  const db = database();
  const previous = await reserveAssessment(db, visitor, now);
  const january = new Date('2027-01-01T00:00:01Z');
  await reserveAssessment(db, visitor, january);
  await settleAssessment(db, previous, false);
  await settleAssessment(db, previous, false);
  assert.equal((await readUsage(db, visitor, now)).used, 0);
  assert.equal((await readUsage(db, visitor, january)).used, 1);
});

test('successful assessments are charged once and cannot later be refunded', async () => {
  const db = database();
  const reservation = await reserveAssessment(db, visitor, now);
  await settleAssessment(db, reservation, true);
  await settleAssessment(db, reservation, true);
  await settleAssessment(db, reservation, false);
  assert.equal((await readUsage(db, visitor, now)).used, 1);
});

test('storage failures fail closed', async () => {
  await assert.rejects(reserveAssessment({runTransaction: async () => {throw new Error('offline')}, collection:()=>({doc:()=>({collection:()=>({doc:()=>({})})})})}, visitor, now), /offline/);
});

process.env.BANKREGX_SESSION_SECRET = 'unit-test-secret-only';
const req = (headers = {}, body = {}) => ({headers, body});
function response() { return {headers:{}, setHeader(key, value) {this.headers[key]=value;}}; }

test('visitor cookie is opaque, HttpOnly and stable; tampered cookies do not choose an identity', async () => {
  const res = response();
  const identity = await assessmentIdentity(req(), res, () => {throw new Error('should not verify a visitor')});
  assert.equal(identity.limit, 1);
  assert.match(res.headers['Set-Cookie'], /HttpOnly; SameSite=Strict/);
  const cookie = res.headers['Set-Cookie'].split(';')[0];
  const again = await assessmentIdentity(req({cookie}, {userId:'member-forged', plan:'member'}), response(), () => {});
  assert.equal(again.key, identity.key);
  assert.equal(again.limit, 1);
  const token = visitorToken(process.env.BANKREGX_SESSION_SECRET);
  assert.equal(verifyVisitorToken(token, process.env.BANKREGX_SESSION_SECRET), true);
  assert.equal(verifyVisitorToken(token, 'another-secret'), false);
  assert.equal(verifyVisitorToken(token+'extra', process.env.BANKREGX_SESSION_SECRET), false);
});

test('only server-verified non-anonymous tokens with verified email grant membership', async () => {
  const verified = await assessmentIdentity(req({authorization:'Bearer valid'}), response(), async () => ({uid:'firebase-uid', email_verified:true}));
  assert.equal(verified.plan, 'member'); assert.equal(verified.limit, 5);
  const otherBrowser = await assessmentIdentity(req({authorization:'Bearer valid', cookie:'bankregx_visitor=changed'}), response(), async () => ({uid:'firebase-uid', email_verified:true}));
  assert.equal(verified.key, otherBrowser.key);
  const unverified = await assessmentIdentity(req({authorization:'Bearer unverified'}), response(), async () => ({uid:'firebase-uid', email_verified:false}));
  assert.equal(unverified.plan, 'visitor'); assert.equal(unverified.needsVerification, true);
  await assert.rejects(assessmentIdentity(req({authorization:'Bearer expired'}), response(), async () => {throw new Error('expired')}), error => error.status === 401);
  await assert.rejects(assessmentIdentity(req({authorization:'Bearer anonymous'}), response(), async () => ({uid:'anon', email_verified:true, firebase:{sign_in_provider:'anonymous'}})), error => error.status === 401);
});
