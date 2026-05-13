const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getAggregateOrderStatus,
  getNextOrderStatus,
  isSequentialOrderTransition,
  normalizeOrderStatus,
} = require('./orderStatus');

test('normalizeOrderStatus falls back to pending for invalid values', () => {
  assert.equal(normalizeOrderStatus('unexpected'), 'pending');
  assert.equal(normalizeOrderStatus('processing'), 'processing');
});

test('getNextOrderStatus advances sequentially and stops at delivered', () => {
  assert.equal(getNextOrderStatus('pending'), 'confirmed');
  assert.equal(getNextOrderStatus('confirmed'), 'processing');
  assert.equal(getNextOrderStatus('processing'), 'delivered');
  assert.equal(getNextOrderStatus('delivered'), null);
});

test('getAggregateOrderStatus returns the least advanced item status', () => {
  const items = [
    { status: 'delivered' },
    { status: 'processing' },
    { status: 'confirmed' },
  ];

  assert.equal(getAggregateOrderStatus(items, 'pending'), 'confirmed');
});

test('isSequentialOrderTransition only allows single-step progress', () => {
  assert.equal(isSequentialOrderTransition('pending', 'confirmed'), true);
  assert.equal(isSequentialOrderTransition('pending', 'processing'), false);
  assert.equal(isSequentialOrderTransition('processing', 'delivered'), true);
});
