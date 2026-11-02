import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DATA_PLACEHOLDER,
  build,
  isSafeRelativePath,
  parseDate,
  resolveAssets,
  sniffImageType,
  renderFragment,
  toInlineJson,
  validateCareer,
  wrapDocument,
} from "./build.mjs";
import { candidateUrls, checkLogo, cropSvg, faviconUrl, keysToFetch, MAX_LOGO_BYTES, pngSize } from "./fetch-logos.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** Smallest valid document; tests clone and break it. */
const base = () => ({
  person: { name: "Ada", born: 1990, links: [{ label: "Site", url: "https://example.com" }] },
  asOf: "2026-11",
  phases: [
    { label: "One", theme: "First", start: "2010-01", end: "2015-06" },
    { label: "Two", theme: "Second", start: "2015-06", end: null },
  ],
  lanes: [{ id: "work", label: "Work" }],
  items: [
    { lane: "work", label: "Job", title: "Engineer", start: "2012-01", end: "2014-02" },
    { lane: "work", label: "Now", title: "Lead", start: "2020", end: null },
    { lane: "work", label: "Award", title: "Prize", date: "2019-03" },
  ],
});

const errorsFor = (mutate) => {
  const data = base();
  mutate(data);
  return validateCareer(data);
};
const assertError = (errors, fragment) =>
  assert.ok(errors.some((e) => e.includes(fragment)), `expected an error containing "${fragment}", got:\n${errors.join("\n")}`);

describe("parseDate", () => {
  test("parses year-month into a fractional year", () => assert.equal(parseDate("2020-07"), 2020.5));
  test("parses a bare year as January", () => assert.equal(parseDate("2020"), 2020));
  test("rejects malformed values", () => {
    for (const bad of ["2020-13", "2020-1", "20-01", "", "2020-01-01", null, 2020]) assert.equal(parseDate(bad), null, String(bad));
  });
});

describe("validateCareer", () => {
  test("accepts a valid document", () => assert.deepEqual(validateCareer(base()), []));
  test("accepts the real career.json", async () => {
    const data = JSON.parse(await readFile(join(here, "career.json"), "utf8"));
    assert.deepEqual(validateCareer(data), []);
  });

  test("rejects non-objects", () => {
    for (const bad of [null, [], "x", 3]) assert.deepEqual(validateCareer(bad), ["root must be an object"]);
  });
  test("requires person name and birth year", () => {
    const errors = errorsFor((d) => { d.person = { born: "1990" }; });
    assertError(errors, "person.name");
    assertError(errors, "person.born");
  });
  test("rejects non-https links", () => assertError(errorsFor((d) => { d.person.links[0].url = "javascript:alert(1)"; }), "url must be https"));
  test("rejects unparseable link urls", () => assertError(errorsFor((d) => { d.person.links[0].url = "not a url"; }), "url must be https"));
  test("rejects links that are not an array", () => assertError(errorsFor((d) => { d.person.links = {}; }), "links must be an array"));
  test("requires link labels", () => assertError(errorsFor((d) => { d.person.links[0].label = ""; }), "needs a label"));
  test("requires a valid asOf", () => assertError(errorsFor((d) => { d.asOf = "soon"; }), "asOf"));

  describe("phases", () => {
    test("must be non-empty", () => assertError(errorsFor((d) => { d.phases = []; }), "phases must be"));
    test("must be contiguous", () => assertError(errorsFor((d) => { d.phases[1].start = "2016-01"; }), "previous phase's end"));
    test("only the last may be open-ended", () => assertError(errorsFor((d) => { d.phases[0].end = null; }), "only the last phase"));
    test("end must follow start", () => assertError(errorsFor((d) => { d.phases[0].end = "2009-01"; d.phases[1].start = "2009-01"; }), "end must be after start"));
    test("need label, theme and valid dates", () => {
      const errors = errorsFor((d) => { d.phases[0] = { start: "x", end: "y" }; });
      assertError(errors, "label is required");
      assertError(errors, "theme is required");
      assertError(errors, "start must be");
      assertError(errors, "end must be YYYY");
    });
    test("cannot start after asOf", () => assertError(errorsFor((d) => { d.phases[1].start = "2030"; d.phases[0].end = "2030"; }), "start is after asOf"));
  });

  describe("lanes", () => {
    test("must be non-empty", () => assertError(errorsFor((d) => { d.lanes = []; }), "lanes must be"));
    test("ids must be unique", () => assertError(errorsFor((d) => { d.lanes.push({ id: "work", label: "Again" }); }), "unique"));
    test("need id and label", () => {
      const errors = errorsFor((d) => { d.lanes.push({}); });
      assertError(errors, "id is required");
      assertError(errors, "label is required");
    });
  });

  describe("items", () => {
    test("must be an array", () => assertError(errorsFor((d) => { d.items = {}; }), "items must be an array"));
    test("must reference a known lane", () => assertError(errorsFor((d) => { d.items[0].lane = "nope"; }), "unknown lane"));
    test("need label and title", () => {
      const errors = errorsFor((d) => { delete d.items[0].label; delete d.items[0].title; });
      assertError(errors, "label is required");
      assertError(errors, "title is required");
    });
    test("optional text fields cannot be empty", () => {
      const errors = errorsFor((d) => { d.items[0].org = " "; d.items[0].detail = ""; });
      assertError(errors, "org must be");
      assertError(errors, "detail must be");
    });
    test("cannot be both a point and a span", () => assertError(errorsFor((d) => { d.items[0].date = "2013"; }), "not both"));
    test("must be a point or a span", () => assertError(errorsFor((d) => { delete d.items[0].start; delete d.items[0].end; }), "not both"));
    test("points need a valid date", () => assertError(errorsFor((d) => { d.items[2].date = "March"; }), "date must be"));
    test("points cannot be in the future", () => assertError(errorsFor((d) => { d.items[2].date = "2027"; }), "date is after asOf"));
    test("spans need a valid start", () => assertError(errorsFor((d) => { d.items[0].start = "x"; }), "start must be"));
    test("spans cannot start in the future", () => assertError(errorsFor((d) => { d.items[1].start = "2027"; }), "start is after asOf"));
    test("spans need an explicit end", () => assertError(errorsFor((d) => { delete d.items[0].end; }), "end is required"));
    test("span end must be valid", () => assertError(errorsFor((d) => { d.items[0].end = "later"; }), "end must be YYYY"));
    test("span end must follow start", () => assertError(errorsFor((d) => { d.items[0].end = "2011"; }), "end must be after start"));
    test("cannot predate the first phase", () => assertError(errorsFor((d) => { d.items[0].start = "2005"; }), "before the first phase"));
    test("item links are validated", () => assertError(errorsFor((d) => { d.items[0].links = [{ label: "x", url: "http://insecure" }]; }), "url must be https"));
    test("null entries are reported, not thrown", () => assertError(errorsFor((d) => { d.items.push(null); }), "unknown lane"));
  });
});

describe("rendering", () => {
  test("toInlineJson cannot close the script tag", () => {
    const json = toInlineJson({ s: "</script><script>alert(1)</script>\u2028" });
    assert.ok(!json.includes("</script>"));
    assert.ok(!json.includes("\u2028"));
    assert.deepEqual(JSON.parse(json), { s: "</script><script>alert(1)</script>\u2028" });
  });
  test("renderFragment inlines the data", () => {
    const out = renderFragment(`const D = ${DATA_PLACEHOLDER};`, { a: "$&" });
    assert.equal(out, 'const D = {"a":"$&"};');
  });
  test("renderFragment fails without a placeholder", () => assert.throws(() => renderFragment("nothing", {}), /placeholder/));
  test("wrapDocument produces a standards-mode document", () => {
    const doc = wrapDocument("<p>hi</p>");
    assert.match(doc, /^<!doctype html>/);
    assert.match(doc, /<body>\n<p>hi<\/p>\n<\/body>/);
  });
  test("the real template contains the placeholder", async () => {
    const template = await readFile(join(here, "template.html"), "utf8");
    assert.ok(template.includes(DATA_PLACEHOLDER));
  });
});

describe("build", () => {
  const withTempDir = async (fn) => {
    const dir = await mkdtemp(join(tmpdir(), "career-map-"));
    try {
      await fn(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };

  test("writes index.html and fragment.html for valid data", () =>
    withTempDir(async (dir) => {
      await writeFile(join(dir, "career.json"), JSON.stringify(base()));
      await writeFile(join(dir, "template.html"), `<script>const D = ${DATA_PLACEHOLDER};</script>`);
      const out = join(dir, "out");
      assert.deepEqual(await build({ srcDir: dir, outDir: out }), []);
      const fragment = await readFile(join(out, "fragment.html"), "utf8");
      assert.ok(fragment.includes('"name":"Ada"'));
      assert.match(await readFile(join(out, "index.html"), "utf8"), /^<!doctype html>/);
    }));

  test("returns validation errors and writes nothing", () =>
    withTempDir(async (dir) => {
      const bad = base();
      bad.items[0].lane = "nope";
      await writeFile(join(dir, "career.json"), JSON.stringify(bad));
      const out = join(dir, "out");
      const errors = await build({ srcDir: dir, outDir: out });
      assertError(errors, "unknown lane");
      await assert.rejects(readFile(join(out, "index.html")));
    }));

  test("reports invalid JSON", () =>
    withTempDir(async (dir) => {
      await writeFile(join(dir, "career.json"), "{ nope");
      assertError(await build({ srcDir: dir, outDir: join(dir, "out") }), "invalid JSON");
    }));

  test("wraps missing-file errors with context", () =>
    withTempDir(async (dir) => {
      await assert.rejects(build({ srcDir: dir, outDir: join(dir, "out") }), /Failed to read .*career\.json/);
    }));

  test("wraps a missing template with context", () =>
    withTempDir(async (dir) => {
      await writeFile(join(dir, "career.json"), JSON.stringify(base()));
      await assert.rejects(build({ srcDir: dir, outDir: join(dir, "out") }), /Failed to read .*template\.html/);
    }));
});

const PNG_BYTES = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const SVG_TEXT = '<?xml version="1.0"?>\n<!-- logo -->\n<svg xmlns="http://www.w3.org/2000/svg"></svg>';

describe("logos and photo validation", () => {
  test("accepts a registry with valid slugs and domains", () =>
    assert.deepEqual(errorsFor((d) => { d.logos = { "acme-co": { domain: "acme.co.uk" } }; d.items[0].logo = "acme-co"; }), []));
  test("logos must be an object", () => assertError(errorsFor((d) => { d.logos = []; }), "logos must be an object"));
  test("logo keys must be slugs", () => assertError(errorsFor((d) => { d.logos = { "Bad Key": { domain: "a.com" } }; }), "lowercase-with-dashes"));
  test("logo domains must be hostnames", () => {
    for (const domain of ["https://a.com", "a", "", "a.com/path", undefined]) {
      assertError(errorsFor((d) => { d.logos = { a: { domain } }; }), "domain must be a hostname");
    }
  });
  test("items must reference a registered logo", () => assertError(errorsFor((d) => { d.items[0].logo = "ghost"; }), "not in the logos registry"));
  test("photo must stay inside the source folder", () => {
    for (const photo of ["../secret.jpg", "/etc/passwd", "https://x.com/a.jpg", "a//b.jpg", "a\\b.jpg", ""]) {
      assertError(errorsFor((d) => { d.person.photo = photo; }), "person.photo");
    }
    assert.deepEqual(errorsFor((d) => { d.person.photo = "assets/photo.jpg"; }), []);
  });
  test("isSafeRelativePath accepts nested relative paths", () => assert.ok(isSafeRelativePath("a/b/c.png")));
});

describe("sniffImageType", () => {
  test("detects PNG", () => assert.equal(sniffImageType(PNG_BYTES), "image/png"));
  test("detects JPEG", () => assert.equal(sniffImageType(JPEG_BYTES), "image/jpeg"));
  test("detects SVG with an XML prolog and comment", () => assert.equal(sniffImageType(Buffer.from(SVG_TEXT)), "image/svg+xml"));
  test("detects bare SVG", () => assert.equal(sniffImageType(Buffer.from("<svg viewBox='0 0 1 1'/>")), "image/svg+xml"));
  test("rejects HTML and empty input", () => {
    assert.equal(sniffImageType(Buffer.from("<html><body>404</body></html>")), null);
    assert.equal(sniffImageType(Buffer.alloc(0)), null);
  });
});

describe("resolveAssets", () => {
  const withSrc = async (files, fn) => {
    const dir = await mkdtemp(join(tmpdir(), "career-assets-"));
    try {
      await Promise.all(Object.entries(files).map(async ([name, body]) => {
        await mkdir(dirname(join(dir, name)), { recursive: true });
        await writeFile(join(dir, name), body);
      }));
      await fn(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };
  const withLogos = (logos, photo) => {
    const d = base();
    d.person.photo = photo;
    d.logos = Object.fromEntries(logos.map((k) => [k, { domain: `${k}.com` }]));
    logos.forEach((k, i) => { if (d.items[i]) d.items[i].logo = k; });
    return d;
  };

  test("embeds photo and logos, preferring SVG over PNG", () =>
    withSrc({ "assets/me.jpg": JPEG_BYTES, "logos/a.png": PNG_BYTES, "logos/a.svg": SVG_TEXT, "logos/b.png": PNG_BYTES }, async (dir) => {
      const { assets, warnings } = await resolveAssets(withLogos(["a", "b"], "assets/me.jpg"), dir);
      assert.deepEqual(warnings, []);
      assert.match(assets.photo, /^data:image\/jpeg;base64,/);
      assert.match(assets.logos.a, /^data:image\/svg\+xml;base64,/);
      assert.match(assets.logos.b, /^data:image\/png;base64,/);
    }));

  test("warns and falls back when files are missing", () =>
    withSrc({}, async (dir) => {
      const { assets, warnings } = await resolveAssets(withLogos(["a"], "assets/none.jpg"), dir);
      assert.equal(assets.photo, null);
      assert.deepEqual(assets.logos, {});
      assert.equal(warnings.length, 2);
      assertError(warnings, "photo assets/none.jpg not found");
      assertError(warnings, 'logo "a" not found');
    }));

  test("only embeds logos that items use", () =>
    withSrc({ "logos/a.png": PNG_BYTES, "logos/unused.png": PNG_BYTES }, async (dir) => {
      const data = withLogos(["a"]);
      data.logos.unused = { domain: "unused.com" };
      const { assets } = await resolveAssets(data, dir);
      assert.deepEqual(Object.keys(assets.logos), ["a"]);
    }));

  test("rejects files that are not images", () =>
    withSrc({ "logos/a.png": "<html>not found</html>" }, async (dir) => {
      await assert.rejects(resolveAssets(withLogos(["a"]), dir), /not a PNG, JPEG or SVG/);
    }));

  test("build inlines assets and reports warnings", () =>
    withSrc({ "logos/a.png": PNG_BYTES, "template.html": `<script>const D = ${DATA_PLACEHOLDER};</script>` }, async (dir) => {
      const data = withLogos(["a", "b"]);
      await writeFile(join(dir, "career.json"), JSON.stringify(data));
      const warnings = [];
      assert.deepEqual(await build({ srcDir: dir, outDir: join(dir, "out"), onWarning: (w) => warnings.push(w) }), []);
      const fragment = await readFile(join(dir, "out", "fragment.html"), "utf8");
      assert.ok(fragment.includes('"assets":{"photo":null,"logos":{"a":"data:image/png;base64,'));
      assertError(warnings, 'logo "b" not found');
    }));

  test("build links the downloads unless told they are missing", () =>
    withSrc({ "template.html": `<script>const D = ${DATA_PLACEHOLDER};</script>` }, async (dir) => {
      await writeFile(join(dir, "career.json"), JSON.stringify(withLogos([])));
      const fragmentFor = async (options) => {
        assert.deepEqual(await build({ srcDir: dir, outDir: join(dir, "out"), ...options }), []);
        return readFile(join(dir, "out", "fragment.html"), "utf8");
      };
      assert.ok((await fragmentFor({})).includes('"downloads":true'));
      assert.ok((await fragmentFor({ downloads: false })).includes('"downloads":false'));
    }));
});

describe("fetch-logos helpers", () => {
  /** PNG header with an IHDR chunk of the given size. */
  const png = (w, h) => {
    const ihdr = Buffer.alloc(16);
    ihdr.writeUInt32BE(13, 0);
    ihdr.write("IHDR", 4);
    ihdr.writeUInt32BE(w, 8);
    ihdr.writeUInt32BE(h, 12);
    return Buffer.concat([PNG_BYTES.subarray(0, 8), ihdr]);
  };

  test("faviconUrl encodes the domain and size", () =>
    assert.equal(faviconUrl("a.com&x=1", 64), "https://www.google.com/s2/favicons?domain=a.com%26x%3D1&sz=64"));
  test("candidateUrls prefers an explicit url", () =>
    assert.deepEqual(candidateUrls({ domain: "a.com", url: "https://cdn.a.com/logo.svg" }), ["https://cdn.a.com/logo.svg"]));
  test("candidateUrls tries the site's touch icon before the favicon service", () =>
    assert.deepEqual(candidateUrls({ domain: "a.com" }), ["https://a.com/apple-touch-icon.png", faviconUrl("a.com")]));

  test("keysToFetch skips logos that exist in any format", () =>
    assert.deepEqual(keysToFetch({ a: {}, b: {}, c: {}, d: {} }, ["a.png", "b.svg", "c.jpg", "readme.txt"]), ["d"]));
  test("keysToFetch with only + force refetches just those keys", () =>
    assert.deepEqual(keysToFetch({ a: {}, b: {} }, ["a.png", "b.png"], { force: true, only: ["b"] }), ["b"]));
  test("keysToFetch with only skips present keys unless forced", () =>
    assert.deepEqual(keysToFetch({ a: {}, b: {} }, ["a.png"], { only: ["a", "b"] }), ["b"]));
  test("keysToFetch rejects unknown keys", () =>
    assert.throws(() => keysToFetch({ a: {} }, [], { only: ["zzz"] }), /Not in the logos registry: zzz/));

  test("pngSize reads the IHDR dimensions", () => {
    assert.deepEqual(pngSize(png(128, 64)), { width: 128, height: 64 });
    assert.equal(pngSize(PNG_BYTES), null);
  });
  test("checkLogo accepts large PNGs, JPEGs and SVGs", () => {
    assert.deepEqual(checkLogo(png(128, 128)), { type: "image/png" });
    assert.deepEqual(checkLogo(JPEG_BYTES), { type: "image/jpeg" });
    assert.deepEqual(checkLogo(Buffer.from(SVG_TEXT)), { type: "image/svg+xml" });
  });
  test("checkLogo rejects bad input", () => {
    assert.equal(checkLogo(Buffer.alloc(0)).error, "empty response");
    assert.match(checkLogo(png(16, 16)).error, /too small \(16x16/);
    assert.match(checkLogo(PNG_BYTES).error, /too small \(unknown size/);
    assert.match(checkLogo(Buffer.from("<html>")).error, /not a PNG, JPEG or SVG/);
    assert.match(checkLogo(Buffer.concat([png(64, 64), Buffer.alloc(MAX_LOGO_BYTES)])).error, /too large/);
  });

  test("cropSvg replaces the root viewBox and drops fixed sizes", () => {
    const out = cropSvg('<?xml version="1.0"?><svg width="130" height="32" viewBox="0 0 130 32" xmlns="x"><rect width="5"/></svg>', "0 0 32 32");
    assert.equal(out, '<?xml version="1.0"?><svg viewBox="0 0 32 32" xmlns="x"><rect width="5"/></svg>');
  });
  test("cropSvg rejects bad input", () => {
    assert.throws(() => cropSvg("<svg></svg>", "0 0 32"), /Invalid crop/);
    assert.throws(() => cropSvg("<html></html>", "0 0 1 1"), /No <svg> tag/);
  });
  test("validateCareer checks logo url and crop", () => {
    assertError(errorsFor((d) => { d.logos = { a: { domain: "a.com", url: "http://a.com/x.png" } }; }), "url must be https");
    assertError(errorsFor((d) => { d.logos = { a: { domain: "a.com", crop: "big" } }; }), "crop must be a viewBox");
    assert.deepEqual(errorsFor((d) => { d.logos = { a: { domain: "a.com", url: "https://a.com/x.svg", crop: "0 0 32 32" } }; }), []);
  });
});
