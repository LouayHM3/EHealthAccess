const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../policy');

test('patient sees full personal data', () => {
  const result = evaluate({ role: 'PA', category: 'PID', attribute: 'fullName' });
  assert.equal(result.decision, 'VISIBLE');
  assert.equal(result.value, 'Demo Patient');
});

test('researcher receives pseudonymized identity', () => {
  const result = evaluate({ role: 'RE', category: 'PID', attribute: 'fullName' });
  assert.equal(result.decision, 'PSEUDONYMIZED');
  assert.match(result.value, /^subject-/);
});

test('family requires consent and legal role requires order', () => {
  assert.equal(evaluate({ role: 'PF', category: 'MD', attribute: 'clinicalData' }).granted, false);
  assert.equal(evaluate({ role: 'PF', category: 'MD', attribute: 'clinicalData', consent: true }).granted, true);
  assert.equal(evaluate({ role: 'LS', category: 'PID', attribute: 'address' }).granted, false);
  assert.equal(evaluate({ role: 'LS', category: 'PID', attribute: 'address', legalOrder: true }).granted, true);
});
