import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, parseAdminReportUpdate, parseCitizenReport, validateLocation, validatePassword } from '../src/lib/validation.js';

test('cleanText normalizes whitespace and enforces limits', () => {
  assert.equal(cleanText('  road   is broken  ', 50), 'road is broken');
  assert.equal(cleanText('abcdef', 3), 'abc');
});

test('password policy requires length, letters, and numbers', () => {
  assert.match(validatePassword('short'), /8 characters/);
  assert.match(validatePassword('onlyletters'), /letter and one number/);
  assert.equal(validatePassword('secure123'), null);
});

test('location validation accepts GeoJSON longitude-latitude order', () => {
  assert.deepEqual(validateLocation({ coordinates: [77.209, 28.6139], address: 'New Delhi' }), { type: 'Point', coordinates: [77.209, 28.6139], address: 'New Delhi' });
  assert.equal(validateLocation({ coordinates: [200, 28], address: 'Invalid' }), null);
});

test('citizen report parser rejects missing evidence fields', () => {
  const result = parseCitizenReport({ title: 'Bad', description: 'Too short', category: 'unknown', location: null });
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['category', 'description', 'location', 'title']);
});

test('citizen report parser only returns citizen-editable fields', () => {
  const result = parseCitizenReport({ title: 'Broken street light', description: 'The street light has been dark for several nights.', category: 'streetlight', location: { coordinates: [77, 28], address: 'Sector 1' }, status: 'resolved', submittedBy: 'attacker' });
  assert.equal(result.valid, true);
  assert.equal('status' in result.value, false);
  assert.equal('submittedBy' in result.value, false);
});

test('citizen report parser keeps only safe evidence URLs', () => {
  const parsed = parseCitizenReport({
    images: [
      'https://res.cloudinary.com/demo/image/upload/photo.jpg',
      '/uploads/550e8400-e29b-41d4-a716-446655440000.webp',
      'javascript:alert(1)',
      'http://insecure.example/photo.jpg'
    ]
  }, { partial: true });
  assert.deepEqual(parsed.value.images, [
    'https://res.cloudinary.com/demo/image/upload/photo.jpg',
    '/uploads/550e8400-e29b-41d4-a716-446655440000.webp'
  ]);
});

test('admin update parser rejects unsupported statuses', () => {
  assert.equal(parseAdminReportUpdate({ status: 'deleted' }).valid, false);
  assert.equal(parseAdminReportUpdate({ status: 'in_progress', priority: 'high' }).valid, true);
});
