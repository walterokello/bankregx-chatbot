import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { database } from './membership.test.js';

// Exercise the real API handler and quota/identity helpers, replacing only
// external Firebase and OpenAI services. No real accounts or paid calls.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('/lib/firebaseAdmin')) return { shortCircuit:true, url:'test:firebase-admin' };
    if (specifier === 'openai') return { shortCircuit:true, url:'test:openai' };
    if (specifier.startsWith('.') && !specifier.endsWith('.js')) {
      const candidate = new URL(`${specifier}.js`, context.parentURL);
      if (existsSync(candidate)) return {shortCircuit:true, url:candidate.href};
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'test:firebase-admin') return {shortCircuit:true, format:'module', source:`
      export const adminDb = new Proxy({}, {get(_, key) {return globalThis.assessmentTest.db[key]}});
      export async function verifyMemberToken(token) {
        if(token !== 'verified-member') throw new Error('Invalid token');
        return {uid:'member-one',email_verified:true};
      }`};
    if (url === 'test:openai') return {shortCircuit:true, format:'module', source:`
      export default class OpenAI { chat = {completions:{create:async () => {
        globalThis.assessmentTest.calls++;
        if(globalThis.assessmentTest.fail) throw new Error('Upstream unavailable');
        return {choices:[{message:{content:'Test assessment'}}]};
      }}}; }`};
    return nextLoad(url, context);
  },
});
const {default: handler} = await import('../pages/api/ask.js');

function setup() {
  const db = database();
  const originalCollection = db.collection;
  db.collection = name => name === 'expert_guidance' ? {
    where:()=>({limit:()=>({get:async()=>({docs:[]})})}),
  } : name === 'chat_history' ? {add:async()=>({id:'response-id'})} : originalCollection(name);
  globalThis.assessmentTest = {db, calls:0, fail:false};
}
function response() {return {statusCode:200, headers:{}, setHeader(k,v){this.headers[k]=v}, status(n){this.statusCode=n;return this}, json(body){this.body=body;return this}};}
async function ask({cookie, token, query='Assess this control', method='POST', contentType='application/json'}={}) {
  const res=response();
  await handler({method, headers:{host:'localhost:3000','content-type':contentType, ...(cookie?{cookie}:{}), ...(token?{authorization:`Bearer ${token}`}:{})}, body:{query,userId:'forged-member',plan:'member',limit:1000}},res);
  return res;
}

test('API visitor second request is blocked before OpenAI, regardless of supplied identity', async()=>{
  setup();
  const first=await ask();assert.equal(first.statusCode,200);assert.equal(first.body.usage.limit,1);
  const cookie=first.headers['Set-Cookie'].split(';')[0];
  const second=await ask({cookie});assert.equal(second.statusCode,429);assert.equal(second.body.code,'MONTHLY_LIMIT_REACHED');
  assert.equal(globalThis.assessmentTest.calls,1);
});

test('API verified member gets five, sixth blocked, across all modes sharing /api/ask', async()=>{
  setup();
  const results=await Promise.all(Array.from({length:8},()=>ask({token:'verified-member'})));
  assert.equal(results.filter(r=>r.statusCode===200).length,5);
  assert.equal(results.filter(r=>r.statusCode===429).length,3);
  assert.equal(globalThis.assessmentTest.calls,5);
});

test('API upstream failure refunds allowance and permits a retry',async()=>{
  setup();globalThis.assessmentTest.fail=true;
  const originalError=console.error; console.error=()=>{};
  let failed;
  try { failed=await ask(); } finally { console.error=originalError; }
  assert.equal(failed.statusCode,503);
  globalThis.assessmentTest.fail=false;
  const retried=await ask({cookie:failed.headers['Set-Cookie'].split(';')[0]});
  assert.equal(retried.statusCode,200);assert.equal(retried.body.usage.used,1);
});

test('API invalid auth and invalid input never reach OpenAI or spend allowance',async()=>{
  setup();
  const originalError=console.error;console.error=()=>{};
  try {
    assert.equal((await ask({token:'forged'})).statusCode,401);
    assert.equal((await ask({query:'  '})).statusCode,400);
    assert.equal((await ask({contentType:'text/plain'})).statusCode,415);
    assert.equal((await ask({method:'GET'})).statusCode,405);
  } finally {console.error=originalError;}
  assert.equal(globalThis.assessmentTest.calls,0);
});
