import test from 'node:test';
import assert from 'node:assert/strict';
import { readMembershipResponse } from '../lib/membershipResponse.js';

const usage = {plan:'visitor',limit:1,used:0,remaining:1,resetsAt:'2026-12-01T00:00:00.000Z'};

test('valid allowance responses pass through unchanged', async () => {
  assert.deepEqual(await readMembershipResponse(Response.json(usage)), usage);
});

test('HTML access, not-found and server-error pages give a useful message, never a parser error', async () => {
  for (const status of [200,401,403,404,500,502,503]) {
    await assert.rejects(readMembershipResponse(new Response('<!DOCTYPE html><title>Platform page</title>', {status, headers:{'content-type':'text/html'}})), error =>
      error.code === 'MEMBERSHIP_RESPONSE_UNAVAILABLE' && error.status === status
      && error.message.includes('monthly allowance') && !error.message.includes('Unexpected token'));
  }
});

test('invalid JSON and unexpected payloads never become a valid allowance', async () => {
  await assert.rejects(readMembershipResponse(new Response('<!DOCTYPE html>', {headers:{'content-type':'application/json'}})), /monthly allowance/);
  for (const payload of [{},null,{...usage,remaining:99},{...usage,plan:'admin'},{...usage,resetsAt:'invalid'}]) {
    await assert.rejects(readMembershipResponse(Response.json(payload)), /monthly allowance/);
  }
});

test('JSON authentication and configuration messages remain actionable', async () => {
  await assert.rejects(readMembershipResponse(Response.json({message:'Please sign in again.'},{status:401})), /Please sign in again/);
});
