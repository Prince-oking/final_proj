import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  isSafePhotoAttachment,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './security';

test('hashPassword and verifyPassword work securely', () => {
  const hash = hashPassword('Barangay2026!');
  assert.equal(verifyPassword('Barangay2026!', hash), true);
  assert.equal(verifyPassword('WrongPass', hash), false);
  assert.equal(verifyPassword('Barangay2026!', 'invalid'), false);
});

test('signSessionToken and verifySessionToken enforce integrity and expiry', () => {
  const secret = 'test-secret-key';
  const token = signSessionToken('user-1', 'staff', secret, 3600);
  const claims = verifySessionToken(token, secret);
  assert.equal(claims?.sub, 'user-1');
  assert.equal(claims?.role, 'staff');

  assert.equal(verifySessionToken(token, 'wrong-secret'), null);
  assert.equal(verifySessionToken(`${token}x`, secret), null);

  const expired = signSessionToken('user-1', 'resident', secret, -10);
  assert.equal(verifySessionToken(expired, secret), null);
});

test('isSafePhotoAttachment blocks SVG/HTML/JS URLs and allows safe raster images', () => {
  assert.equal(isSafePhotoAttachment(undefined), true);
  assert.equal(isSafePhotoAttachment('/src/assets/images/report_streetlight_1795332791854.jpg'), true);
  assert.equal(isSafePhotoAttachment('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
  assert.equal(isSafePhotoAttachment('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isSafePhotoAttachment('javascript:alert(1)'), false);
  assert.equal(isSafePhotoAttachment('/src/assets/images/../../etc/passwd'), false);
});
