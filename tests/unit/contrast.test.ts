import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const cssPath = path.resolve(fileURLToPath(import.meta.url), "../../../src/app/globals.css");
const css = readFileSync(cssPath, "utf8");

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Grab the :root block and the dark block as flat token maps.
function blockTokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}

const rootStart = css.indexOf(":root {");
const rootEnd = css.indexOf("}", rootStart);
const light = blockTokens(css.slice(rootStart, rootEnd));

const darkStart = css.indexOf("prefers-color-scheme: dark) {");
const darkInner = css.indexOf(":root {", darkStart);
const darkEnd = css.indexOf("\n}", darkInner);
const dark = blockTokens(css.slice(darkInner, darkEnd));

describe("WCAG AA contrast guard (R-25)", () => {
  it("light theme key text tokens clear 4.5:1", () => {
    expect(contrast(light["foreground"], light["background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["muted-foreground"], light["background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["muted-foreground"], light["card"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["muted-foreground"], light["accent"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["brand"], "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["destructive-text"], "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["streak"], light["card"])).toBeGreaterThanOrEqual(4.5);
  });

  it("dark theme key text tokens clear 4.5:1", () => {
    expect(contrast(dark["foreground"], dark["background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark["muted-foreground"], dark["background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark["brand"], dark["background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark["streak"], dark["background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#fafaf9", dark["destructive"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark["success-foreground"], dark["success"])).toBeGreaterThanOrEqual(4.5);
  });

  it("button fills clear 4.5:1 against their label", () => {
    expect(contrast("#fafaf9", light["primary"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", light["success"])).toBeGreaterThanOrEqual(4.5);
  });
});