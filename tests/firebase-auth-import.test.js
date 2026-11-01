import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Vercel's runtime rejected jwks-rsa 4's require('jose') with ERR_REQUIRE_ESM.
// Disabling require(esm) reproduces that condition even on newer local Node.
test('Firebase Auth cold imports without require(esm) support or credentials', () => {
  for (const [mode, source] of [
    ['commonjs', "require('firebase-admin/auth'); console.log('auth-loaded')"],
    ['module', "await import('firebase-admin/auth'); console.log('auth-loaded')"],
  ]) {
    const result = spawnSync(process.execPath, [
      '--no-experimental-require-module', `--input-type=${mode}`, '-e', source,
    ], { encoding: 'utf8', timeout: 15000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /auth-loaded/);
  }
});
