#!/usr/bin/env node
/**
 * Download missing logos listed in career.json's `logos` registry into `logos/<key>.<ext>`.
 *
 * Registry entry: `{ "domain": "example.com", "url"?: "https://.../logo.svg", "crop"?: "0 0 32 32" }`
 *   - url:  a specific logo file (PNG, JPEG or SVG). Without it, the script tries the site's
 *           apple-touch-icon and then Google's favicon service.
 *   - crop: for SVGs, a viewBox to keep (e.g. just the square mark of a wide wordmark logo).
 *
 * Existing files (any extension) are never touched unless --force is given, so a hand-made
 * `logos/<key>.svg` always wins.
 *
 * Usage:
 *   node career-map/fetch-logos.mjs                 download every missing logo
 *   node career-map/fetch-logos.mjs --force a b     re-download logos a and b
 */
import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sniffImageType } from "./build.mjs";

/** Pixel size requested from the favicon service. */
export const LOGO_SIZE = 128;
/** PNGs smaller than this (in px) are too blurry to use. */
export const MIN_PNG_SIZE = 32;
/** Reject anything larger than this many bytes. */
export const MAX_LOGO_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 15_000;
const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg" };

/**
 * URL of Google's favicon service for a domain.
 * @param {string} domain
 * @param {number} [size]
 * @returns {string}
 */
export function faviconUrl(domain, size = LOGO_SIZE) {
  const url = new URL("https://www.google.com/s2/favicons");
  url.searchParams.set("domain", domain);
  url.searchParams.set("sz", String(size));
  return url.toString();
}

/**
 * Candidate URLs for a registry entry, best first.
 * @param {{ domain: string, url?: string }} entry
 * @returns {string[]}
 */
export function candidateUrls(entry) {
  if (entry.url) return [entry.url];
  return [`https://${entry.domain}/apple-touch-icon.png`, faviconUrl(entry.domain)];
}

/**
 * Registry keys to download.
 * @param {Record<string, unknown>} registry
 * @param {string[]} files file names already in logos/
 * @param {{ force?: boolean, only?: string[] }} [options] `only` limits to these keys
 * @returns {string[]}
 * @throws {Error} when `only` names a key that is not in the registry
 */
export function keysToFetch(registry, files, { force = false, only = [] } = {}) {
  const unknown = only.filter((key) => !(key in registry));
  if (unknown.length > 0) throw new Error(`Not in the logos registry: ${unknown.join(", ")}`);
  const present = new Set(files.map((f) => f.replace(/\.[^.]+$/, "")));
  const candidates = only.length > 0 ? only : Object.keys(registry);
  return candidates.filter((key) => force || !present.has(key));
}

/**
 * Pixel size of a PNG from its IHDR chunk.
 * @param {Buffer} bytes PNG bytes
 * @returns {{ width: number, height: number } | null}
 */
export function pngSize(bytes) {
  if (bytes.length < 24) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/**
 * Check a downloaded body before it is written to disk.
 * @param {Buffer} bytes
 * @returns {{ type?: string, error?: string }} the image type, or the problem
 */
export function checkLogo(bytes) {
  if (bytes.length === 0) return { error: "empty response" };
  if (bytes.length > MAX_LOGO_BYTES) return { error: `too large (${bytes.length} bytes)` };
  const type = sniffImageType(bytes);
  if (type === null) return { error: "not a PNG, JPEG or SVG image" };
  if (type === "image/png") {
    const size = pngSize(bytes);
    if (!size || Math.min(size.width, size.height) < MIN_PNG_SIZE) {
      return { error: `too small (${size ? `${size.width}x${size.height}` : "unknown size"}, need ${MIN_PNG_SIZE}px)` };
    }
  }
  return { type };
}

/**
 * Replace the root <svg> viewBox (dropping fixed width/height) to keep only part of the drawing.
 * @param {string} svg
 * @param {string} viewBox e.g. "0 0 32 32"
 * @returns {string}
 * @throws {Error} when the input has no <svg> tag or the viewBox is malformed
 */
export function cropSvg(svg, viewBox) {
  if (!/^-?\d+(\.\d+)?( -?\d+(\.\d+)?){3}$/.test(viewBox)) throw new Error(`Invalid crop viewBox "${viewBox}"`);
  const match = /<svg\b[^>]*>/i.exec(svg);
  if (!match) throw new Error("No <svg> tag to crop");
  const tag = match[0]
    .replace(/\s(width|height|viewBox)\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/^<svg/i, `<svg viewBox="${viewBox}"`);
  return svg.slice(0, match.index) + tag + svg.slice(match.index + match[0].length);
}

/**
 * Try each candidate URL until one returns a usable image.
 * @param {{ domain: string, url?: string, crop?: string }} entry
 * @returns {Promise<{ bytes?: Buffer, ext?: string, source?: string, error?: string }>}
 */
async function download(entry) {
  const errors = [];
  for (const url of candidateUrls(entry)) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) {
        errors.push(`${new URL(url).hostname}: HTTP ${response.status}`);
        continue;
      }
      let bytes = Buffer.from(await response.arrayBuffer());
      const { type, error } = checkLogo(bytes);
      if (error) {
        errors.push(`${new URL(url).hostname}: ${error}`);
        continue;
      }
      if (entry.crop && type === "image/svg+xml") bytes = Buffer.from(cropSvg(bytes.toString("utf8"), entry.crop));
      return { bytes, ext: EXTENSIONS[type], source: url };
    } catch (err) {
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "TypeError")) {
        errors.push(`${new URL(url).hostname}: network error`);
        continue;
      }
      throw err;
    }
  }
  return { error: errors.join("; ") };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const srcDir = dirname(fileURLToPath(import.meta.url));
  const logoDir = join(srcDir, "logos");
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => a !== "--force");
  const data = JSON.parse(await readFile(join(srcDir, "career.json"), "utf8"));
  const registry = data.logos ?? {};
  await mkdir(logoDir, { recursive: true });
  const files = await readdir(logoDir);
  const keys = keysToFetch(registry, files, { force, only });
  if (keys.length === 0) {
    console.log("All logos are present.");
    process.exit(0);
  }
  const results = await Promise.all(keys.map(async (key) => ({ key, ...(await download(registry[key])) })));
  for (const r of results.filter((x) => x.bytes)) {
    const stale = files.filter((f) => f.replace(/\.[^.]+$/, "") === r.key);
    await Promise.all(stale.map((f) => rm(join(logoDir, f))));
    await writeFile(join(logoDir, `${r.key}.${r.ext}`), r.bytes);
  }
  results.forEach((r) => console.log(r.bytes ? `  ok      ${r.key}.${r.ext}  <- ${r.source}` : `  failed  ${r.key}: ${r.error}`));
  const failed = results.filter((r) => r.error).length;
  console.log(`${results.length - failed} downloaded, ${failed} failed.${failed ? " Failed logos fall back to initials; add logos/<key>.svg by hand or set a url in career.json." : ""}`);
}
