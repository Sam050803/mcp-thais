/**
 * Tests du parser de dates
 */

import { DateParser } from '../../src/utils/date-parser.js';

const ref = new Date('2026-02-03');
const parser = new DateParser(ref);

const tests = [
  { input: '2026-02-06', expected: '2026-02-06' },
  { input: '6 février', expected: '2026-02-06' },
  { input: 'début mars', expected: '2026-03-01' },
  { input: 'mi-avril', expected: '2026-04-15' },
  { input: 'fin février', expected: '2026-02-28' },
  { input: 'demain', expected: '2026-02-04' },
  { input: 'dans 3 jours', expected: '2026-02-06' },
  { input: 'dans une semaine', expected: '2026-02-10' },
];

console.log('🧪 TESTS PARSER DE DATES\n');

let passed = 0;
tests.forEach((t, i) => {
  const result = parser.parse(t.input);
  const ok = result === t.expected;
  console.log(`${ok ? '✅' : '❌'} Test ${i + 1}: "${t.input}" → "${result}"${ok ? '' : ` (attendu: ${t.expected})`}`);
  if (ok) passed++;
});

console.log(`\n📊 ${passed}/${tests.length} tests passés`);