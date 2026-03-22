import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const GLOBALS_CSS_PATH = path.resolve(__dirname, '../app/globals.css');
const ROOT_LAYOUT_PATH = path.resolve(__dirname, '../app/layout.tsx');

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Design Foundation — Color System', () => {
  it('should define teal HSL color variables (50–900) with HSL values', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      // Each variable must be defined with an HSL triplet (hue saturation% lightness%)
      expect(css).toMatch(new RegExp(`--entune-teal-${shade}\\s*:\\s*\\d+\\s+\\d+%\\s+\\d+%`));
    }
  });

  it('should define amber HSL color variables (50–700) with HSL values', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700]) {
      expect(css).toMatch(new RegExp(`--entune-amber-${shade}\\s*:\\s*\\d+\\s+\\d+%\\s+\\d+%`));
    }
  });

  it('should define red HSL color variables (50–700) with HSL values', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700]) {
      expect(css).toMatch(new RegExp(`--entune-red-${shade}\\s*:\\s*\\d+\\s+\\d+%\\s+\\d+%`));
    }
  });

  it('should define slate HSL color variables (50–900) with HSL values', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(css).toMatch(new RegExp(`--entune-slate-${shade}\\s*:\\s*\\d+\\s+\\d+%\\s+\\d+%`));
    }
  });

  it('should have correct canonical HSL values for key shades', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    // Spot-check canonical values to verify palette integrity (not just variable existence)
    expect(css).toMatch(/--entune-teal-500\s*:\s*174\s+50%\s+42%/);
    expect(css).toMatch(/--entune-amber-500\s*:\s*32\s+90%\s+45%/);
    expect(css).toMatch(/--entune-red-500\s*:\s*0\s+72%\s+50%/);
    expect(css).toMatch(/--entune-slate-500\s*:\s*210\s+18%\s+50%/);
    expect(css).toMatch(/--entune-slate-500\s*:\s*210\s+18%\s+50%/);
  });

  it('should map --primary to teal (not default gray)', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s);
    expect(rootBlock).not.toBeNull();
    const rootContent = rootBlock![1];
    expect(rootContent).toMatch(/--primary\s*:/);
    // Must NOT be the default shadcn gray oklch(0.205 0 0)
    expect(rootContent).not.toMatch(/--primary\s*:\s*oklch\(0\.205\s+0\s+0\)/);
    // Must be a teal-ish color (oklch hue ~180 or hsl hue ~174, or var reference to teal)
    expect(rootContent).toMatch(
      /--primary\s*:\s*(oklch\([\d.]+\s+[\d.]+\s+1[78]\d\)|hsl\(var\(--entune-teal)/
    );
  });

  it('should map --border to a teal-tinted oklch value (not default gray)', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s);
    expect(rootBlock).not.toBeNull();
    const rootContent = rootBlock![1];
    // Must not be the shadcn default gray oklch(0.922 0 0)
    expect(rootContent).not.toMatch(/--border\s*:\s*oklch\(0\.922\s+0\s+0\)/);
    // Must be an oklch value with non-zero chroma and hue ~180 (teal tint)
    expect(rootContent).toMatch(/--border\s*:\s*oklch\(0\.9\d?\s+0\.00\d\s+180\)/);
  });

  it('should set --radius to 0.625rem', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    expect(css).toMatch(/--radius\s*:\s*0\.625rem/);
  });

  it('should have .dark overrides', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    expect(css).toMatch(/\.dark\s*\{[^}]*--primary:/s);
    expect(css).toMatch(/\.dark\s*\{[^}]*--background:/s);
  });
});

describe('Design Foundation — Typography', () => {
  it('should load DM Sans font in root layout with correct variable and weights', () => {
    const layout = readFile(ROOT_LAYOUT_PATH);
    // Must import DM_Sans and instantiate it (not just a comment)
    expect(layout).toMatch(/DM_Sans\s*\(/);
    expect(layout).toMatch(/variable\s*:\s*['"]--font-entune-sans['"]/);
    // Must include multiple weights for medical UI (at least 400 regular + 600 semibold)
    expect(layout).toMatch(/weight\s*:\s*\[.*['"]400['"].*\]/s);
    expect(layout).toMatch(/weight\s*:\s*\[.*['"]600['"].*\]/s);
    // Must include latin subset
    expect(layout).toMatch(/subsets\s*:\s*\[.*['"]latin['"].*\]/s);
  });

  it('should apply DM Sans variable to HTML element', () => {
    const layout = readFile(ROOT_LAYOUT_PATH);
    // Layout should apply the font variable class to <html>
    expect(layout).toMatch(/dmSans\.variable/);
  });

  it('should include Pretendard CDN stylesheet link', () => {
    const layout = readFile(ROOT_LAYOUT_PATH);
    // Must have a CDN URL for Pretendard (not just the word in a comment)
    expect(layout).toMatch(/cdn\.jsdelivr\.net.*pretendard/i);
    // Must be a stylesheet link
    expect(layout).toMatch(/rel\s*=\s*["']stylesheet["']/);
  });

  it('should set font-sans to include DM Sans in @theme', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    // The @theme block should map --font-sans to the entune font variable
    expect(css).toMatch(/--font-sans:.*font-entune-sans/);
  });
});

describe('Design Foundation — Custom CSS Classes', () => {
  it('should define .transcript-text with 22px font-size and 1.7 line-height', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const block = css.match(/\.transcript-text\s*\{([^}]+)\}/s);
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/font-size\s*:\s*22px/);
    expect(block![1]).toMatch(/line-height\s*:\s*1\.7/);
  });

  it('should define .cultural-flag with culturalCardIn animation', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    expect(css).toMatch(/\.cultural-flag\s*\{[^}]*animation:.*culturalCardIn/s);
  });

  it('should define @keyframes culturalCardIn with opacity and translateY', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const kf = css.match(/@keyframes\s+culturalCardIn\s*\{([\s\S]*?)\n\}/);
    expect(kf).not.toBeNull();
    expect(kf![1]).toMatch(/opacity/);
    expect(kf![1]).toMatch(/translateY/);
  });

  it('should define .recording-dot with recording-pulse animation', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    // Must reference the specific recording-pulse animation name
    expect(css).toMatch(/\.recording-dot\s*\{[^}]*animation:.*recording-pulse/s);
    // Must have a corresponding @keyframes
    expect(css).toMatch(/@keyframes\s+recording-pulse/);
  });

  it('should define prefers-reduced-motion that disables animations', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const mq = css.match(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\}/
    );
    expect(mq).not.toBeNull();
    expect(mq![1]).toMatch(/animation-duration\s*:\s*0\.01ms/);
  });
});

describe('Design Foundation — Preserves Existing Classes', () => {
  it('preserves .entune-marketing class with custom properties', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const block = css.match(/\.entune-marketing\s*\{([^}]+)\}/s);
    expect(block).not.toBeNull();
    // Must define scoped color custom properties
    expect(block![1]).toMatch(/--entune-teal\s*:/);
    expect(block![1]).toMatch(/--entune-bg\s*:/);
  });

  it('preserves .entune-doctor-desktop class with custom properties', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const block = css.match(/\.entune-doctor-desktop\s*\{([^}]+)\}/s);
    expect(block).not.toBeNull();
    // Must define scoped color custom properties
    expect(block![1]).toMatch(/--entune-teal\s*:/);
    expect(block![1]).toMatch(/--entune-bg\s*:/);
  });

  it('preserves .aui-md class with typography rules', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const block = css.match(/\.aui-md\s*\{([^}]+)\}/s);
    expect(block).not.toBeNull();
    // Must set line-height for markdown prose
    expect(block![1]).toMatch(/line-height\s*:\s*1\.6/);
  });
});
