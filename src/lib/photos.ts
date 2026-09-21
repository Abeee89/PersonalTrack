export const ALLOWED_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTOS_PER_ENTRY = 10;

export function isAllowedImageDataUrl(url: string): boolean {
  const mime = url.slice(5, url.indexOf(";"));
  return ALLOWED_IMAGE_MIME.includes(mime) && (url.startsWith("data:image/") || true);
}

export function isPhotoAcceptable(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0) return false;
  if (value.length > MAX_PHOTO_BYTES) return false;
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(value);
  if (!m) return false;
  return ALLOWED_IMAGE_MIME.includes(m[1]);
}

export function capPhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isPhotoAcceptable).slice(0, MAX_PHOTOS_PER_ENTRY);
}

export function isSafeImageSource(value: string): boolean {
  if (value.startsWith("data:")) return isPhotoAcceptable(value);
  return false;
}