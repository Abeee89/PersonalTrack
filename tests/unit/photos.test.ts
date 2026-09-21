import { describe, it, expect } from "vitest";
import { isPhotoAcceptable, capPhotos, MAX_PHOTOS_PER_ENTRY } from "@/lib/photos";

const VALID_PNG = `data:image/png;base64,${"A".repeat(50)}`;
const VALID_JPEG = `data:image/jpeg;base64,${"B".repeat(50)}`;
const VALID_WEBP = `data:image/webp;base64,${"C".repeat(50)}`;
const SVGS = `data:image/svg+xml;base64,${"D".repeat(50)}`;
const SVG = "data:image/svg+xml;base64,PHN2Zy8+";

describe("isPhotoAcceptable", () => {
  it("accepts whitelisted raster types", () => {
    expect(isPhotoAcceptable(VALID_PNG)).toBe(true);
    expect(isPhotoAcceptable(VALID_JPEG)).toBe(true);
    expect(isPhotoAcceptable(VALID_WEBP)).toBe(true);
  });

  it("rejects svg (XSS via script)", () => {
    expect(isPhotoAcceptable(SVG)).toBe(false);
    expect(isPhotoAcceptable(SVGS)).toBe(false);
  });

  it("rejects data:javascript and non-image", () => {
    expect(isPhotoAcceptable("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isPhotoAcceptable("data:application/pdf;base64,AAAA")).toBe(false);
    expect(isPhotoAcceptable("javascript:alert(1)")).toBe(false);
  });

  it("rejects oversized", () => {
    const big = `data:image/png;base64,${"A".repeat(2 * 1024 * 1024 + 100)}`;
    expect(isPhotoAcceptable(big)).toBe(false);
  });

  it("rejects non-strings and empty", () => {
    expect(isPhotoAcceptable(123 as unknown)).toBe(false);
    expect(isPhotoAcceptable("")).toBe(false);
  });
});

describe("capPhotos", () => {
  it("drops unsafe entries and caps to max", () => {
    const many = Array.from({ length: MAX_PHOTOS_PER_ENTRY + 5 }, (_, i) => VALID_PNG);
    const mixed = [SVG, VALID_PNG, "data:text/html;base64,AAAA", ...many];
    const result = capPhotos(mixed);
    expect(result.length).toBe(MAX_PHOTOS_PER_ENTRY);
    expect(result.every((p) => !p.startsWith("data:image/svg"))).toBe(true);
  });

  it("returns [] for non-arrays", () => {
    expect(capPhotos("nope")).toEqual([]);
    expect(capPhotos(null)).toEqual([]);
  });
});