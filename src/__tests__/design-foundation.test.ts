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

  it('should map --border to a non-default color value', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s);
    expect(rootBlock).not.toBeNull();
    const rootContent = rootBlock![1];
    expect(rootContent).toMatch(/--border\s*:/);
    // Must not be the shadcn default gray
    expect(rootContent).not.toMatch(/--border\s*:\s*oklch\(0\.922\s+0\s+0\)/);
    // Must be a valid color value (hsl, oklch, or var reference)
    expect(rootContent).toMatch(/--border\s*:\s*(hsl|oklch|var)\(/);
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
  it('should load DM Sans font in root layout with correct variable', () => {
    const layout = readFile(ROOT_LAYOUT_PATH);
    // Must import DM_Sans and instantiate it (not just a comment)
    expect(layout).toMatch(/DM_Sans\s*\(/);
    expect(layout).toMatch(/variable\s*:\s*['"]--font-entune-sans['"]/);
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
  it('preserves .entune-marketing class with rules', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    // Must be an actual CSS rule (not just a comment)
    expect(css).toMatch(/\.entune-marketing\s*\{/);
  });

  it('preserves .entune-doctor-desktop class with rules', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    expect(css).toMatch(/\.entune-doctor-desktop\s*\{/);
  });

  it('preserves .aui-md class with rules', () => {
    const css = readFile(GLOBALS_CSS_PATH);
    expect(css).toMatch(/\.aui-md\s*\{/);
  });
});
