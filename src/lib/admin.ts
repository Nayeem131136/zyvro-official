import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_EMAIL = "zyvro@official.com";
export const PRODUCTS_BUCKET = "products";

export type AdminState = {
  loading: boolean;
  isAdmin: boolean;
  email: string | null;
};

export function useAdminSession(): AdminState {
  const [state, setState] = useState<AdminState>({ loading: true, isAdmin: false, email: null });

  useEffect(() => {
    let mounted = true;
    const apply = (email: string | null) => {
      if (!mounted) return;
      setState({
        loading: false,
        isAdmin: !!email && email.toLowerCase() === ADMIN_EMAIL,
        email,
      });
    };
    supabase.auth.getUser().then(({ data }) => apply(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      apply(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Resize + re-encode an image in the browser before upload, so large phone/DSLR
 * photos (often 20-65MB) don't eat storage/bandwidth quota or slow page loads.
 * Caps the longest side at maxDimension and re-encodes as JPEG at the given quality.
 *
 * Hardened: never hangs forever and never blocks the upload — if anything about
 * compression fails or takes too long, it falls back to uploading the original file.
 */
async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<Blob | File> {
  // Skip compression for already-small files or non-image types (safety fallback).
  if (!file.type.startsWith("image/") || file.size < 300 * 1024) return file;

  try {
    console.log(`[upload] compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
    const result = await withTimeout(compressImageInner(file, maxDimension, quality), 25000);
    console.log(`[upload] compressed to ${(result.size / 1024).toFixed(0)}KB`);
    return result;
  } catch (e) {
    console.warn("[upload] compression failed/timed out, uploading original file instead:", e);
    return file;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

async function compressImageInner(file: File, maxDimension: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob) throw new Error("canvas.toBlob returned null");
    return blob;
  } finally {
    bitmap.close();
  }
}

/** Upload image to the private 'products' bucket and return a long-lived signed URL. */
export async function uploadProductImage(file: File): Promise<{ path: string; url: string }> {
  console.log(`[upload] starting upload for ${file.name}`);
  const compressed = await compressImage(file);
  const path = `${crypto.randomUUID()}.jpg`;
  console.log(`[upload] sending to storage as ${path} (${(compressed.size / 1024).toFixed(0)}KB)...`);
  const { error } = await withTimeout(
    supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(path, compressed, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false }),
    30000,
  );
  if (error) {
    console.error("[upload] storage upload failed:", error);
    throw error;
  }
  console.log("[upload] storage upload succeeded, creating signed URL...");
  const url = await getProductImageUrl(path);
  console.log("[upload] done:", url);
  return { path, url };
}

export async function getProductImageUrl(path: string): Promise<string> {
  // 10-year signed URL — bucket is private due to workspace policy.
  const { data, error } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (error || !data) throw error ?? new Error("signed url failed");
  return data.signedUrl;
}

/** Best-effort: extract storage path from a stored URL if it was uploaded to our bucket. */
export function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/products\/([^?]+)/);
  return m ? m[1] : null;
}

export async function deleteProductImage(url: string | null | undefined) {
  const path = extractStoragePath(url);
  if (!path) return;
  await supabase.storage.from(PRODUCTS_BUCKET).remove([path]);
}
