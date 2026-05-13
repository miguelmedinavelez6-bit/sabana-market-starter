const test = require('node:test');
const assert = require('node:assert/strict');
const { hasRoleAccess } = require('./auth');

test('hasRoleAccess allows exact role matches', () => {
  assert.equal(hasRoleAccess('admin', ['admin']), true);
  assert.equal(hasRoleAccess('buyer', ['seller']), false);
});

test('hasRoleAccess keeps seller supersets for buyer-permitted routes', () => {
  assert.equal(hasRoleAccess('seller', ['buyer']), true);
  assert.equal(hasRoleAccess('seller', ['admin']), false);
});
