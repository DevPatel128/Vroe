// Design gate: checks a built site against DESIGN.md. Usage: node scripts/design-check.mjs <build-dir> [DESIGN.md]
// Fails on: unfilled DESIGN.md, bad dials, a font family not listed, AI-default patterns (purple gradient, placeholder copy),
// a page without a viewport meta, animation without prefers-reduced-motion. Warns on colours not in the palette
// (set DESIGN_STRICT=1 to fail). Reads built HTML and CSS only: touch targets and overflow are checked in a real browser
// by design.spec.ts. shortcut: hue test covers hex colours in gradients only; add hsl()/oklch() when a product needs it.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const [dir, designPath = 'DESIGN.md'] = process.argv.slice(2);
if (!dir || !existsSync(dir)) { console.error(`design-check: no build dir ${dir ?? ''}`); process.exit(1); }
if (!existsSync(designPath)) { console.error(`design-check: ${designPath} missing (copy it from the WOLF kit and fill it)`); process.exit(1); }

const fails = [], warns = [];
const design = readFileSync(designPath, 'utf8');
const section = (name) => { const m = design.match(new RegExp(`^## ${name}[^\\n]*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };

// DESIGN.md must be real: no placeholders in the checked sections, three dials in range.
const dials = design.match(/^Dials:\s*variance=(\S+)\s+motion=(\S+)\s+density=(\S+)/m);
if (!dials || dials.slice(1).some((v) => !/^(10|[1-9])$/.test(v))) fails.push('DESIGN.md: set "Dials: variance=N motion=N density=N" with whole numbers 1-10');
const palette = section('Palette'), type = section('Type');
if (/<[^>\n]+>/.test(palette) || /<[^>\n]+>/.test(type)) fails.push('DESIGN.md: Palette or Type still has <placeholders>; fill them from the real design');

const hex6 = (h) => { h = h.replace('#', '').toLowerCase(); if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join(''); return h.slice(0, 6); };
const hue = (h) => { const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return { h: 0, s: 0, l: (mx + mn) / 2 };
  const l = (mx + mn) / 2, s = d / (1 - Math.abs(2 * l - 1)); const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (hh * 60 + 360) % 360, s, l }; };
const isPurple = (h) => { const { h: hh, s, l } = hue(h); return hh >= 250 && hh <= 300 && s >= 0.35 && l >= 0.2 && l <= 0.8; };
const allowedColors = new Set((palette.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map(hex6));
const brandPurple = [...allowedColors].some(isPurple);

const typeFamilies = new Set();
for (const row of type.split('\n').filter((l) => l.startsWith('|') && !/^\|[-: |]+\|$/.test(l)).slice(1))
  for (const f of (row.split('|')[2] ?? '').split(',')) { const n = f.replace(/["']/g, '').trim().toLowerCase(); if (n && !n.startsWith('<')) typeFamilies.add(n); }
const generic = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', 'inherit', 'initial', 'unset', 'revert', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto', 'helvetica', 'helvetica neue', 'arial', 'noto sans', 'apple color emoji', 'segoe ui emoji', 'segoe ui symbol', 'noto color emoji', 'liberation mono', 'menlo', 'monaco', 'consolas', 'courier new', 'sfmono-regular', 'sf mono', 'courier', 'georgia', 'times new roman', 'times']);

const files = []; (function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== 'node_modules') walk(p); } else files.push(p); } })(dir);
const read = (p) => readFileSync(p, 'utf8');
const css = files.filter((f) => extname(f) === '.css').map(read);
const html = files.filter((f) => extname(f) === '.html').map((f) => [f, read(f)]);
const inlineCss = html.flatMap(([, h]) => [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]));
const allCss = [...css, ...inlineCss].join('\n');

// Fonts: every family named in font-family must be a designed choice.
const usedFonts = new Set();
for (const m of allCss.matchAll(/font-family\s*:\s*([^;}]+)/gi)) for (let f of m[1].split(',')) {
  f = f.replace(/!important/i, '').replace(/["']/g, '').trim().toLowerCase(); if (!f || f.includes('var(') || f.startsWith('--')) continue;
  f = f.replace(/^__/, '').replace(/_[0-9a-f]{6,}$/, '').replace(/_fallback$/, '').replace(/_/g, ' ');
  if (!generic.has(f)) usedFonts.add(f);
}
const unknownFonts = [...usedFonts].filter((f) => ![...typeFamilies].some((t) => f === t || f.startsWith(t) || t.startsWith(f)));
if (unknownFonts.length) fails.push(`fonts not in DESIGN.md Type: ${unknownFonts.slice(0, 8).join(', ')}`);

// Colours: warn on anything outside the palette.
const usedColors = new Map();
for (const m of allCss.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) { const c = hex6(m[0]); if (c.length === 6 && !/^(ffffff|000000)$/.test(c) && !allowedColors.has(c)) usedColors.set(c, (usedColors.get(c) ?? 0) + 1); }
if (usedColors.size) (process.env.DESIGN_STRICT ? fails : warns).push(`${usedColors.size} colours outside the DESIGN.md palette, for example ${[...usedColors.keys()].slice(0, 6).map((c) => '#' + c).join(' ')}`);

// AI-default look: a purple/indigo gradient nobody designed.
if (!brandPurple) for (const m of allCss.matchAll(/(?:linear|radial|conic)-gradient\(([^;{}]*)\)/gi)) {
  const cs = (m[1].match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map(hex6).filter((c) => c.length === 6);
  if (cs.filter(isPurple).length >= 1 && cs.length >= 2 && cs.some((c) => hue(c).h < 250 || hue(c).h > 300 || isPurple(c))) { fails.push('purple/indigo gradient not in the palette (the generic AI default); use a palette colour or add it to DESIGN.md'); break; }
}

// Pages: placeholder copy, viewport meta, emoji used as icons.
const visible = (h) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
const slopCopy = /lorem ipsum|dolor sit amet|your (company|name|text|logo|brand) here|john doe|jane doe|acme (inc|corp)|feature (one|two|three)\b|sample text|placeholder text/i;
for (const [f, h] of html) {
  if (!/<html[\s>]/i.test(h)) continue;
  const rel = f.replace(dir, '').replace(/^\//, '');
  if (!/<meta[^>]+name=["']viewport["']/i.test(h)) fails.push(`${rel}: no viewport meta tag (phones render it as a desktop page)`);
  const hit = visible(h).match(slopCopy); if (hit) fails.push(`${rel}: placeholder copy "${hit[0]}"`);
  if (/<(h[1-3]|button|li)[^>]*>\s*(?:✨|🚀|⚡|🔥|💡|🎯|📈|🔒|🌟|💎)/u.test(h)) warns.push(`${rel}: emoji used as an icon in a heading, button or list; use the icon set`);
}

// Motion: animation needs a reduced-motion fallback.
if (/@keyframes|animation\s*:|animation-name/i.test(allCss) && !/prefers-reduced-motion/i.test(allCss)) fails.push('animation in CSS but no prefers-reduced-motion rule anywhere');

for (const w of warns) console.log(`design-check: warn: ${w}`);
for (const f of fails) console.log(`design-check: FAIL: ${f}`);
console.log(fails.length ? `design-check: ${fails.length} failure(s)` : `design-check: ok (${html.length} pages, ${css.length + inlineCss.length} style blocks${warns.length ? `, ${warns.length} warning(s)` : ''})`);
process.exit(fails.length ? 1 : 0);
