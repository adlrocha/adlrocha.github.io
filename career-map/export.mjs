#!/usr/bin/env node
/**
 * Export a built career map page to a one-page PDF and a PNG.
 *
 * Opens `<dir>/index.html#export` in headless Chromium (the page sizes its own print page in
 * export mode), prints it to `<dir>/career-map.pdf`, then rasterises that with pdftoppm to
 * `<dir>/career-map.png`.
 *
 * Usage:
 *   node career-map/export.mjs [<dir>]                 default dir: public/career; fails on any error
 *   node career-map/export.mjs --best-effort [<dir>]   for deploys: if the export fails, remove any
 *                                                      partial PNG/PDF, rebuild the page without its
 *                                                      download links, warn and exit 0
 *
 * Environment:
 *   CHROMIUM    browser binary (default: first of CHROMIUM_CANDIDATES found on PATH)
 *   CAREER_DPI  PNG resolution (default 192, about 3200px wide)
 *   CI          when set, Chromium runs without its sandbox (CI runners often lack the
 *               user namespaces it needs; the page is our own local file)
 */
import { access, constants, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { build } from "./build.mjs";

/** PNG resolution when CAREER_DPI is not set. */
export const DEFAULT_DPI = 192;
/** Browser binaries tried, in order, when CHROMIUM is not set. */
export const CHROMIUM_CANDIDATES = ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"];
/** Files the export writes next to index.html. */
export const EXPORT_FILES = ["career-map.pdf", "career-map.png"];
const BROWSER_TIMEOUT_MS = 120_000;

/**
 * Parse the DPI setting.
 * @param {string | undefined} value
 * @returns {number}
 * @throws {Error} when the value is not a whole number between 72 and 600
 */
export function parseDpi(value) {
  if (value === undefined || value === "") return DEFAULT_DPI;
  const dpi = Number(value);
  if (!Number.isInteger(dpi) || dpi < 72 || dpi > 600) {
    throw new Error(`CAREER_DPI must be a whole number between 72 and 600, got "${value}"`);
  }
  return dpi;
}

/**
 * Chromium arguments that print the page in export mode to a PDF.
 * @param {string} htmlPath absolute path of index.html
 * @param {string} pdfPath absolute path of the PDF to write
 * @param {{ sandbox?: boolean }} [options]
 * @returns {string[]}
 */
export function chromiumArgs(htmlPath, pdfPath, { sandbox = true } = {}) {
  const url = `${pathToFileURL(htmlPath).href}#export`;
  return [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=10000",
    "--window-size=1600,1200",
    "--no-pdf-header-footer",
    ...(sandbox ? [] : ["--no-sandbox"]),
    `--print-to-pdf=${pdfPath}`,
    url,
  ];
}

/**
 * pdftoppm arguments that turn the one-page PDF into `<pngBase>.png`.
 * @param {string} pdfPath
 * @param {string} pngBase output path without the .png extension
 * @param {number} dpi
 * @returns {string[]}
 */
export function pdftoppmArgs(pdfPath, pngBase, dpi) {
  return ["-png", "-r", String(dpi), "-singlefile", pdfPath, pngBase];
}

/**
 * Find the first executable among `names` on a PATH string.
 * @param {string[]} names binary names, or absolute paths
 * @param {string} pathEnv value of PATH
 * @returns {Promise<string | null>} absolute path, or null when none is executable
 */
export async function findBinary(names, pathEnv) {
  const dirs = pathEnv.split(delimiter).filter(Boolean);
  for (const name of names) {
    const candidates = name.includes("/") ? [name] : dirs.map((dir) => join(dir, name));
    for (const candidate of candidates) {
      try {
        await access(candidate, constants.X_OK);
        if ((await stat(candidate)).isFile()) return candidate;
      } catch (err) {
        if (!(err instanceof Error && "code" in err && (err.code === "ENOENT" || err.code === "EACCES" || err.code === "ENOTDIR"))) throw err;
      }
    }
  }
  return null;
}

/**
 * Run a command, turning a failure into an error that says what was being done.
 * @param {string} what description for the error message
 * @param {string} file
 * @param {string[]} args
 */
async function run(what, file, args) {
  try {
    await promisify(execFile)(file, args, { timeout: BROWSER_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    const detail = err instanceof Error ? `${err.message}${"stderr" in err && err.stderr ? `\n${err.stderr}` : ""}` : String(err);
    throw new Error(`Failed to ${what}: ${detail}`);
  }
}

/**
 * Export `<dir>/index.html` to career-map.pdf and career-map.png in the same directory.
 * @param {string} dir
 * @param {{ env?: Record<string, string | undefined> }} [options]
 * @returns {Promise<{ pdf: string, png: string }>}
 */
export async function exportMap(dir, { env = process.env } = {}) {
  const dpi = parseDpi(env.CAREER_DPI);
  const html = resolve(dir, "index.html");
  try {
    await access(html, constants.R_OK);
  } catch {
    throw new Error(`${html} not found; build the page first (npm run career-map:html)`);
  }
  const pathEnv = env.PATH ?? "";
  const chromium = await findBinary(env.CHROMIUM ? [env.CHROMIUM] : CHROMIUM_CANDIDATES, pathEnv);
  if (!chromium) throw new Error(`No Chromium found (tried ${env.CHROMIUM ?? CHROMIUM_CANDIDATES.join(", ")}); set CHROMIUM=...`);
  const pdftoppm = await findBinary(["pdftoppm"], pathEnv);
  if (!pdftoppm) throw new Error("pdftoppm not found; install poppler (poppler-utils)");

  const pdf = resolve(dir, "career-map.pdf");
  const pngBase = resolve(dir, "career-map");
  await run("print the page to PDF", chromium, chromiumArgs(html, pdf, { sandbox: !env.CI }));
  try {
    await access(pdf, constants.R_OK);
  } catch {
    throw new Error(`Chromium exited cleanly but wrote no PDF at ${pdf}`);
  }
  await run("render the PNG", pdftoppm, pdftoppmArgs(pdf, pngBase, dpi));
  return { pdf, png: `${pngBase}.png` };
}

/**
 * Export, or fall back to a page without download links so a deploy never depends on the export.
 * @param {string} dir directory holding the built index.html
 * @param {{ exporter?: (dir: string) => Promise<unknown>, rebuild: (dir: string) => Promise<string[]> }} steps
 *   exporter: produces the PNG/PDF (default exportMap); rebuild: rebuilds the page without download links
 * @returns {Promise<{ exported: boolean, reason?: string }>}
 * @throws {Error} only when the fallback rebuild itself fails
 */
export async function exportOrFallback(dir, { exporter = exportMap, rebuild }) {
  try {
    await exporter(dir);
    return { exported: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await Promise.all(EXPORT_FILES.map((file) => rm(resolve(dir, file), { force: true })));
    const errors = await rebuild(dir);
    if (errors.length > 0) throw new Error(`Rebuilding the page without downloads failed:\n  - ${errors.join("\n  - ")}`);
    return { exported: false, reason };
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const srcDir = dirname(fileURLToPath(import.meta.url));
  const args = process.argv.slice(2);
  const bestEffort = args.includes("--best-effort");
  const dir = args.find((a) => a !== "--best-effort") ?? resolve(srcDir, "..", "public", "career");
  try {
    if (bestEffort) {
      const result = await exportOrFallback(dir, { rebuild: (out) => build({ srcDir, outDir: out, downloads: false }) });
      if (result.exported) {
        console.log(`Career map PNG and PDF exported to ${dir}`);
      } else {
        // "::warning::" shows as an annotation on the GitHub Actions run; elsewhere it is plain text.
        console.warn(`${process.env.CI ? "::warning::" : "warning: "}Career map PNG/PDF skipped, page published without download links. ${result.reason.split("\n")[0]}`);
      }
    } else {
      const { pdf, png } = await exportMap(dir);
      console.log(`Career map exported:\n  ${pdf}\n  ${png}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
