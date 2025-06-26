const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('app.js should exist', () => {
  assert.ok(fs.existsSync('app.js'));
});
