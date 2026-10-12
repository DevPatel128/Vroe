// Real-browser design gate. Copy into the project's Playwright test folder (the `design` skill says when).
// Env: BASE_URL (default http://localhost:3000), DESIGN_PAGES (comma-separated paths, default "/").
// For each page at 375, 768 and 1280 px it fails on horizontal scroll, touch targets under 44 px, inputs under 16 px font,
// and console errors, and it saves a screenshot to test-results/design/ so the PR can show what it looks like.
// shortcut: inline links inside running text are exempt from the 44 px rule (WCAG 2.2 allows it); add a page to
// DESIGN_PAGES only when it is public or can be reached without a login (sign in inside the test for app pages).
import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const pages = (process.env.DESIGN_PAGES ?? '/').split(',').map((p) => p.trim()).filter(Boolean);
const widths = [{ name: 'phone', width: 375, height: 812 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1280, height: 800 }];

for (const path of pages) for (const vp of widths) {
  test(`design ${path} @ ${vp.width}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });   // a settled page: no mid-animation measurements
    await page.goto(base + path, { waitUntil: 'networkidle' });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal scroll of ${overflow}px at ${vp.width}px`).toBeLessThanOrEqual(0);

    const small = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('a[href],button,[role=button],input:not([type=hidden]),select,textarea,summary'))) {
        const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || s.display === 'none') continue;
        const inText = el.tagName === 'A' && !!el.closest('p,li,dd,blockquote') && s.display === 'inline';
        if (inText) continue;
        if (r.width < 44 || r.height < 44) bad.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return bad;
    });
    if (vp.width <= 768) expect(small, `touch targets under 44x44: ${small.slice(0, 6).join('; ')}`).toEqual([]);

    const tiny = await page.evaluate(() => Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea'))
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16).map((el) => el.getAttribute('name') || el.tagName.toLowerCase()));
    if (vp.width <= 768) expect(tiny, `form fields under 16px font (iOS zooms the page): ${tiny.join(', ')}`).toEqual([]);

    expect(errors, `console errors: ${errors.slice(0, 3).join(' | ')}`).toEqual([]);
    await page.screenshot({ path: `test-results/design/${path.replace(/\W+/g, '_') || 'home'}-${vp.name}.png`, fullPage: true });
    info.annotations.push({ type: 'screenshot', description: `test-results/design/${path.replace(/\W+/g, '_') || 'home'}-${vp.name}.png` });
  });
}
