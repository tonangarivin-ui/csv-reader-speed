// Driver yang dijalankan harness: baca semua case dari /input, jawab dengan run(), tulis /output.
// solve.js juga mengekspor runJson, yang mengembalikan teks JSON jawabannya; jawaban ditulis sebagai
// potongan teks itu, tanpa membangun nilai lalu men-serialize ulang.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setFlagsFromString } from 'node:v8';

setFlagsFromString('--no-incremental-marking');

const solve = await import(new URL('./solve.js', import.meta.url).href);

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const cases = JSON.parse(readFileSync(join(INPUT_DIR, 'cases.json'), 'utf8'));
const parts = [];
for (const c of cases) {
  parts.push(typeof solve.runJson === 'function' ? solve.runJson(c.input) : JSON.stringify(solve.run(c.input)));
}
writeFileSync(join(OUTPUT_DIR, 'answers.json'), '[' + parts.join(',') + ']');
