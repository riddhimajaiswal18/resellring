import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTransition } from '../src/services/offerService.js';

const status = (fn) => { try { fn(); return 200; } catch (e) { return e.status; } };

test('seller can accept, decline or counter a pending offer', () => {
  assert.equal(resolveTransition('pending', 'accept', 'seller'), 'accepted');
  assert.equal(resolveTransition('pending', 'decline', 'seller'), 'declined');
  assert.equal(resolveTransition('pending', 'counter', 'seller'), 'countered');
});
test('buyer can withdraw a pending offer', () => {
  assert.equal(resolveTransition('pending', 'withdraw', 'buyer'), 'withdrawn');
});
test('after a counter, the buyer decides', () => {
  assert.equal(resolveTransition('countered', 'accept', 'buyer'), 'accepted');
  assert.equal(resolveTransition('countered', 'decline', 'buyer'), 'declined');
  assert.equal(resolveTransition('countered', 'withdraw', 'buyer'), 'withdrawn');
});
test('wrong actor is forbidden (403)', () => {
  assert.equal(status(() => resolveTransition('pending', 'accept', 'buyer')), 403);
  assert.equal(status(() => resolveTransition('pending', 'withdraw', 'seller')), 403);
  assert.equal(status(() => resolveTransition('countered', 'accept', 'seller')), 403);
});
test('seller cannot counter their own counter (409)', () => {
  assert.equal(status(() => resolveTransition('countered', 'counter', 'seller')), 409);
});
test('terminal states reject every action (409)', () => {
  for (const s of ['accepted', 'declined', 'withdrawn', 'expired', 'cancelled'])
    for (const a of ['accept', 'decline', 'counter', 'withdraw'])
      for (const r of ['buyer', 'seller'])
        assert.equal(status(() => resolveTransition(s, a, r)), 409, `${s} + ${a} + ${r}`);
});
test('unknown actions are rejected (409)', () => {
  assert.equal(status(() => resolveTransition('pending', 'steal', 'seller')), 409);
});
