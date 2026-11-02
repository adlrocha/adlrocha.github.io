#!/usr/bin/env node
/**
 * Career map build: validates `career.json` and inlines it into `template.html`.
 *
 * Outputs (in `public/career/` by default, served at /career/):
 *   - index.html     standalone page (doctype + head), ready for a website or file://
 *   - fragment.html  page body without the document wrapper (for hosts that add their own)
 *
 * Usage:
 *   node career-map/build.mjs [--out <dir>] [--no-downloads]
 *
 * --no-downloads leaves out the PNG/PDF links (for when they are not exported).
 *
 * Exits with status 1 and prints every problem when the data is invalid.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Placeholder in the template that the build replaces with the JSON data. */
export const DATA_PLACEHOLDER = "/*__CAREER_DATA__*/null";

const DATE_RE = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/;

/**
 * Parse a "YYYY" or "YYYY-MM" string into a fractional year.
 * A bare year maps to January of that year.
 * @param {string} value
 * @returns {number | null} fractional year, or null when the format is invalid
 * @example parseDate("2020-07") // 2020.5
 */
export function parseDate(value) {
  if (typeof value !== "string") return null;
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const month = match[2] ? Number(match[2]) : 1;
  return Number(match[1]) + (month - 1) / 12;
}

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

/** @param {unknown} url */
const isHttpsUrl = (url) => {
  if (typeof url !== "string") return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Validate a list of `{label, url}` links.
 * @param {unknown} links
 * @param {string} where location used in error messages
 * @returns {string[]}
 */
function validateLinks(links, where) {
  if (links === undefined) return [];
  if (!Array.isArray(links)) return [`${where}: links must be an array`];
  return links.flatMap((link, i) => [
    ...(isNonEmptyString(link?.label) ? [] : [`${where}: links[${i}] needs a label`]),
    ...(isHttpsUrl(link?.url) ? [] : [`${where}: links[${i}] url must be https`]),
  ]);
}

/**
 * Validate the phases: contiguous, ordered, only the last may be open-ended.
 * @param {unknown} phases
 * @param {number} asOf
 * @returns {string[]}
 */
function validatePhases(phases, asOf) {
  if (!Array.isArray(phases) || phases.length === 0) return ["phases must be a non-empty array"];
  return phases.flatMap((phase, i) => {
    const where = `phases[${i}] (${phase?.label ?? "?"})`;
    const start = parseDate(phase?.start);
    const isLast = i === phases.length - 1;
    const end = phase?.end === null ? null : parseDate(phase?.end);
    const errors = [];
    if (!isNonEmptyString(phase?.label)) errors.push(`${where}: label is required`);
    if (!isNonEmptyString(phase?.theme)) errors.push(`${where}: theme is required`);
    if (start === null) errors.push(`${where}: start must be YYYY or YYYY-MM`);
    if (phase?.end === null && !isLast) errors.push(`${where}: only the last phase may be open-ended`);
    if (phase?.end !== null && end === null) errors.push(`${where}: end must be YYYY, YYYY-MM or null`);
    if (start !== null && end !== null && end <= start) errors.push(`${where}: end must be after start`);
    if (start !== null && start > asOf) errors.push(`${where}: start is after asOf`);
    if (i > 0 && phases[i - 1]?.end !== phase?.start) {
      errors.push(`${where}: start must equal the previous phase's end (${phases[i - 1]?.end})`);
    }
    return errors;
  });
}

/**
 * Validate one item: either a span (`start` + `end`, end null = ongoing) or a point (`date`).
 * @param {Record<string, unknown>} item
 * @param {number} index
 * @param {Set<string>} laneIds
 * @param {number} asOf
 * @returns {string[]}
 */
function validateItem(item, index, laneIds, asOf) {
  const where = `items[${index}] (${item?.label ?? "?"})`;
  const errors = [];
  if (!laneIds.has(item?.lane)) errors.push(`${where}: unknown lane "${item?.lane}"`);
  if (!isNonEmptyString(item?.label)) errors.push(`${where}: label is required`);
  if (!isNonEmptyString(item?.title)) errors.push(`${where}: title is required`);
  if (item?.org !== undefined && !isNonEmptyString(item.org)) errors.push(`${where}: org must be a non-empty string`);
  if (item?.detail !== undefined && !isNonEmptyString(item.detail)) errors.push(`${where}: detail must be a non-empty string`);

  const isPoint = "date" in item;
  const isSpan = "start" in item;
  if (isPoint === isSpan) {
    errors.push(`${where}: needs either "date" (a moment) or "start"/"end" (a period), not both`);
  } else if (isPoint) {
    const date = parseDate(item.date);
    if (date === null) errors.push(`${where}: date must be YYYY or YYYY-MM`);
    else if (date > asOf) errors.push(`${where}: date is after asOf`);
  } else {
    const start = parseDate(item.start);
    if (start === null) errors.push(`${where}: start must be YYYY or YYYY-MM`);
    else if (start > asOf) errors.push(`${where}: start is after asOf`);
    if (!("end" in item)) errors.push(`${where}: end is required (use null for ongoing)`);
    else if (item.end !== null) {
      const end = parseDate(item.end);
      if (end === null) errors.push(`${where}: end must be YYYY, YYYY-MM or null`);
      else if (start !== null && end <= start) errors.push(`${where}: end must be after start`);
    }
  }
  return [...errors, ...validateLinks(item?.links, where)];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CROP_RE = /^-?\d+(\.\d+)?( -?\d+(\.\d+)?){3}$/;
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/**
 * True for a relative path inside the source folder (no scheme, no absolute path, no "..").
 * @param {unknown} path
 */
export const isSafeRelativePath = (path) =>
  isNonEmptyString(path) &&
  !path.startsWith("/") &&
  !path.includes("\\") &&
  !/^[a-z][a-z0-9+.-]*:/i.test(path) &&
  path.split("/").every((part) => part !== ".." && part !== "");

/**
 * Validate the logo registry: `{ "<slug>": { "domain": "example.com" } }`.
 * @param {unknown} logos
 * @returns {string[]}
 */
function validateLogos(logos) {
  if (logos === undefined) return [];
  if (logos === null || typeof logos !== "object" || Array.isArray(logos)) return ["logos must be an object"];
  return Object.entries(logos).flatMap(([key, value]) => [
    ...(SLUG_RE.test(key) ? [] : [`logos.${key}: key must be lowercase-with-dashes`]),
    ...(DOMAIN_RE.test(value?.domain ?? "") ? [] : [`logos.${key}: domain must be a hostname like example.com`]),
    ...(value?.url === undefined || isHttpsUrl(value.url) ? [] : [`logos.${key}: url must be https`]),
    ...(value?.crop === undefined || CROP_RE.test(value.crop) ? [] : [`logos.${key}: crop must be a viewBox like "0 0 32 32"`]),
  ]);
}

/**
 * Validate the whole career document.
 * @param {unknown} data parsed career.json
 * @returns {string[]} human-readable errors; empty when valid
 */
export function validateCareer(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return ["root must be an object"];
  const errors = [];

  const person = data.person;
  if (!isNonEmptyString(person?.name)) errors.push("person.name is required");
  if (!Number.isInteger(person?.born) || person.born < 1900) errors.push("person.born must be a year");
  errors.push(...validateLinks(person?.links, "person"));
  if (person?.photo !== undefined && !isSafeRelativePath(person.photo)) {
    errors.push("person.photo must be a relative path inside career-map/");
  }

  const asOf = parseDate(data.asOf);
  if (asOf === null) return [...errors, "asOf must be YYYY or YYYY-MM"];

  errors.push(...validateLogos(data.logos));
  const logoKeys = new Set(Object.keys(data.logos ?? {}));

  errors.push(...validatePhases(data.phases, asOf));

  if (!Array.isArray(data.lanes) || data.lanes.length === 0) return [...errors, "lanes must be a non-empty array"];
  const laneIds = new Set(data.lanes.map((lane) => lane?.id));
  if (laneIds.size !== data.lanes.length) errors.push("lane ids must be unique");
  data.lanes.forEach((lane, i) => {
    if (!isNonEmptyString(lane?.id)) errors.push(`lanes[${i}]: id is required`);
    if (!isNonEmptyString(lane?.label)) errors.push(`lanes[${i}]: label is required`);
  });

  if (!Array.isArray(data.items)) return [...errors, "items must be an array"];
  errors.push(...data.items.flatMap((item, i) => validateItem(item ?? {}, i, laneIds, asOf)));
  data.items.forEach((item, i) => {
    if (item?.logo !== undefined && !logoKeys.has(item.logo)) {
      errors.push(`items[${i}] (${item.label}): logo "${item.logo}" is not in the logos registry`);
    }
  });

  const firstPhase = parseDate(data.phases?.[0]?.start);
  if (firstPhase !== null) {
    data.items.forEach((item, i) => {
      const at = parseDate(item?.date ?? item?.start);
      if (at !== null && at < firstPhase) errors.push(`items[${i}] (${item.label}): starts before the first phase`);
    });
  }
  return errors;
}

/**
 * Serialise data for safe embedding inside an inline <script>.
 * @param {unknown} data
 * @returns {string}
 */
export function toInlineJson(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replaceAll(String.fromCharCode(0x2028), "\\u2028")
    .replaceAll(String.fromCharCode(0x2029), "\\u2029");
}

/**
 * Inline validated data into the template.
 * @param {string} template contents of template.html
 * @param {unknown} data validated career data
 * @returns {string} the page fragment
 * @throws {Error} when the template has no data placeholder
 */
export function renderFragment(template, data) {
  if (!template.includes(DATA_PLACEHOLDER)) {
    throw new Error(`Template is missing the data placeholder ${DATA_PLACEHOLDER}`);
  }
  const json = toInlineJson(data);
  return template.replace(DATA_PLACEHOLDER, () => json);
}

/**
 * Wrap a fragment in a full HTML document for standalone hosting.
 * @param {string} fragment
 * @returns {string}
 */
export function wrapDocument(fragment) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    "<style>body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>",
    "</head>",
    "<body>",
    fragment,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

/** Image formats the page can embed, sniffed from file contents rather than trusted from extensions. */
const LOGO_EXTENSIONS = ["svg", "png", "jpg"];

/**
 * Detect an image MIME type from its first bytes.
 * @param {Buffer} bytes
 * @returns {string | null} MIME type, or null when the content is not a supported image
 */
export function sniffImageType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const head = bytes.subarray(0, 512).toString("utf8").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return "image/svg+xml";
  return null;
}

/**
 * Read an image file and return it as a data URI.
 * @param {string} path
 * @returns {Promise<string | null>} data URI, or null when missing
 * @throws {Error} when the file exists but is not a supported image
 */
async function readImageAsDataUri(path) {
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (err) {
    if (err?.code === "ENOENT") return null;
    throw new Error(`Failed to read image ${path}`, { cause: err });
  }
  const type = sniffImageType(bytes);
  if (type === null) throw new Error(`${path} is not a PNG, JPEG or SVG image`);
  return `data:${type};base64,${bytes.toString("base64")}`;
}

/**
 * Load the photo and every registered logo as data URIs so the page stays a single file.
 * Logos are looked up as `logos/<key>.svg|png|jpg` (first match wins).
 * @param {Record<string, any>} data validated career data
 * @param {string} srcDir
 * @returns {Promise<{ assets: { photo: string | null, logos: Record<string, string> }, warnings: string[] }>}
 */
export async function resolveAssets(data, srcDir) {
  const warnings = [];
  let photo = null;
  if (data.person.photo) {
    photo = await readImageAsDataUri(join(srcDir, data.person.photo));
    if (photo === null) warnings.push(`photo ${data.person.photo} not found; the header shows no photo`);
  }
  const usedKeys = [...new Set(data.items.map((item) => item.logo).filter(Boolean))];
  const entries = await Promise.all(usedKeys.map(async (key) => {
    for (const ext of LOGO_EXTENSIONS) {
      const uri = await readImageAsDataUri(join(srcDir, "logos", `${key}.${ext}`));
      if (uri !== null) return [key, uri];
    }
    warnings.push(`logo "${key}" not found in logos/; using initials (run: npm run career-map:logos)`);
    return null;
  }));
  return { assets: { photo, logos: Object.fromEntries(entries.filter(Boolean)) }, warnings };
}

/**
 * Read, validate and write the career map.
 * @param {{ srcDir: string, outDir: string, downloads?: boolean, onWarning?: (message: string) => void }} options
 *   downloads: whether the page links to career-map.png and career-map.pdf (false when they are not exported)
 * @returns {Promise<string[]>} validation errors (nothing is written when non-empty)
 */
export async function build({ srcDir, outDir, downloads = true, onWarning = () => {} }) {
  const dataPath = join(srcDir, "career.json");
  let data;
  try {
    data = JSON.parse(await readFile(dataPath, "utf8"));
  } catch (err) {
    if (err instanceof SyntaxError) return [`${dataPath}: invalid JSON (${err.message})`];
    throw new Error(`Failed to read ${dataPath}`, { cause: err });
  }
  const errors = validateCareer(data);
  if (errors.length > 0) return errors;

  const templatePath = join(srcDir, "template.html");
  const template = await readFile(templatePath, "utf8").catch((err) => {
    throw new Error(`Failed to read ${templatePath}`, { cause: err });
  });
  const { assets, warnings } = await resolveAssets(data, srcDir);
  warnings.forEach(onWarning);
  const fragment = renderFragment(template, { ...data, assets, downloads });
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "fragment.html"), fragment);
  await writeFile(join(outDir, "index.html"), wrapDocument(fragment));
  return [];
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const srcDir = dirname(fileURLToPath(import.meta.url));
  const outFlag = process.argv.indexOf("--out");
  const outDir = outFlag > -1 && process.argv[outFlag + 1]
    ? resolve(process.argv[outFlag + 1])
    : resolve(srcDir, "..", "public", "career");
  const downloads = !process.argv.includes("--no-downloads");
  const errors = await build({ srcDir, outDir, downloads, onWarning: (message) => console.warn(`warning: ${message}`) });
  if (errors.length > 0) {
    console.error(`career.json has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`Career map written to ${outDir}`);
}
