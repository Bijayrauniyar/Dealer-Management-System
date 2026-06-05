import { supabase } from "@/lib/supabase";

export const TENANT_ASSETS_BUCKET = "tenant-assets";

/** One payment QR per tenant — fixed path, upload replaces previous. */
const MAX_QR_BYTES = 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
}

/** Storage object path: `{tenantId}/sales-bill-payment-qr.{ext}` */
export function salesBillQrObjectPath(tenantId: string, mime: string): string {
  return `${tenantId}/sales-bill-payment-qr.${extFromMime(mime)}`;
}

export function validateSalesBillQrFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Use a PNG, JPEG, WebP, or GIF image.";
  }
  if (file.size > MAX_QR_BYTES) {
    return "Image must be 1 MB or smaller.";
  }
  return null;
}

/** Upload (replace) payment QR in private tenant-assets bucket. Returns object path. */
export async function uploadSalesBillQrImage(tenantId: string, file: File): Promise<string> {
  const err = validateSalesBillQrFile(file);
  if (err) throw new Error(err);

  const path = salesBillQrObjectPath(tenantId, file.type);
  const { error } = await supabase.storage.from(TENANT_ASSETS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw error;
  return path;
}

/** Signed URL for bill print / Settings preview (private bucket). */
export async function createSalesBillQrSignedUrl(
  objectPath: string,
  expiresSec = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(TENANT_ASSETS_BUCKET)
    .createSignedUrl(objectPath, expiresSec);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Could not load QR image.");
  return data.signedUrl;
}

export async function removeSalesBillQrImage(objectPath: string): Promise<void> {
  const { error } = await supabase.storage.from(TENANT_ASSETS_BUCKET).remove([objectPath]);
  if (error) throw error;
}
