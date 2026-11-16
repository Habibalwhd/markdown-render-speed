// main.ts — driver for the markdown-render-speed-02 entry.
// Reads $MAKEFUN_INPUT_DIR/cases.json (default /input), renders each case
// with parse() from parse.js, and writes $MAKEFUN_OUTPUT_DIR/html.json
// (default /output).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const inputDir = process.env.MAKEFUN_INPUT_DIR || '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const cases = JSON.parse(readFileSync(join(inputDir, 'cases.json'), 'utf8'));
const html = cases.map((c) => parse(typeof c === 'string' ? c : c.markdown ?? c.input ?? ''));

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'html.json'), JSON.stringify(html));
