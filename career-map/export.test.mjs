import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { chromiumArgs, DEFAULT_DPI, EXPORT_FILES, exportMap, exportOrFallback, findBinary, parseDpi, pdftoppmArgs } from "./export.mjs";

describe("parseDpi", () => {
  test("defaults when unset or empty", () => {
    assert.equal(parseDpi(undefined), DEFAULT_DPI);
    assert.equal(parseDpi(""), DEFAULT_DPI);
  });
  test("accepts whole numbers in range", () => {
    assert.equal(parseDpi("72"), 72);
    assert.equal(parseDpi("300"), 300);
    assert.equal(parseDpi("600"), 600);
  });
  for (const bad of ["71", "601", "1.5", "abc", "-200"]) {
    test(`rejects ${bad}`, () => assert.throws(() => parseDpi(bad), /CAREER_DPI/));
  }
});

describe("chromiumArgs", () => {
  test("prints the export view of the page to the PDF", () => {
    const args = chromiumArgs("/site/public/career/index.html", "/site/public/career/career-map.pdf");
    assert.equal(args.at(-1), "file:///site/public/career/index.html#export");
    assert.ok(args.includes("--print-to-pdf=/site/public/career/career-map.pdf"));
    assert.ok(args.includes("--headless"));
    assert.ok(!args.includes("--no-sandbox"));
  });
  test("drops the sandbox only when asked", () => {
    assert.ok(chromiumArgs("/a/index.html", "/a/x.pdf", { sandbox: false }).includes("--no-sandbox"));
  });
  test("encodes paths with spaces as a file URL", () => {
    assert.equal(chromiumArgs("/my site/index.html", "/x.pdf").at(-1), "file:///my%20site/index.html#export");
  });
});

test("pdftoppmArgs renders a single PNG page at the given DPI", () => {
  assert.deepEqual(pdftoppmArgs("/a/m.pdf", "/a/m", 150), ["-png", "-r", "150", "-singlefile", "/a/m.pdf", "/a/m"]);
});

describe("findBinary", () => {
  /** Make a temp dir with an executable `tool`, a non-executable `plain` and a directory `dir`. */
  async function fixture() {
    const root = await mkdtemp(join(tmpdir(), "career-bin-"));
    await writeFile(join(root, "tool"), "#!/bin/sh\n");
    await chmod(join(root, "tool"), 0o755);
    await writeFile(join(root, "plain"), "");
    await chmod(join(root, "plain"), 0o644);
    await mkdir(join(root, "dir"));
    return root;
  }

  test("finds the first executable name on PATH", async () => {
    const root = await fixture();
    try {
      assert.equal(await findBinary(["missing", "tool"], ["/nonexistent", root].join(delimiter)), join(root, "tool"));
    } finally {
      await rm(root, { recursive: true });
    }
  });
  test("skips non-executable files and directories", async () => {
    const root = await fixture();
    try {
      assert.equal(await findBinary(["plain", "dir"], root), null);
    } finally {
      await rm(root, { recursive: true });
    }
  });
  test("accepts an absolute path regardless of PATH", async () => {
    const root = await fixture();
    try {
      assert.equal(await findBinary([join(root, "tool")], ""), join(root, "tool"));
      assert.equal(await findBinary([join(root, "nope")], root), null);
    } finally {
      await rm(root, { recursive: true });
    }
  });
});

describe("exportMap", () => {
  test("fails clearly when the page has not been built", async () => {
    const root = await mkdtemp(join(tmpdir(), "career-out-"));
    try {
      await assert.rejects(exportMap(root, { env: { PATH: "" } }), /index\.html not found/);
    } finally {
      await rm(root, { recursive: true });
    }
  });
  test("fails clearly when no browser is available", async () => {
    const root = await mkdtemp(join(tmpdir(), "career-out-"));
    try {
      await writeFile(join(root, "index.html"), "<p>map</p>");
      await assert.rejects(exportMap(root, { env: { PATH: "" } }), /No Chromium found/);
    } finally {
      await rm(root, { recursive: true });
    }
  });
  test("rejects a bad DPI before doing any work", async () => {
    await assert.rejects(exportMap("/nonexistent", { env: { CAREER_DPI: "9000" } }), /CAREER_DPI/);
  });
});

describe("exportOrFallback", () => {
  /** A dir with an index.html and stale export files, as left by a half-finished export. */
  async function outDir() {
    const root = await mkdtemp(join(tmpdir(), "career-out-"));
    await writeFile(join(root, "index.html"), "<p>map</p>");
    await Promise.all(EXPORT_FILES.map((file) => writeFile(join(root, file), "partial")));
    return root;
  }

  test("keeps the exported files and does not rebuild when the export works", async () => {
    const root = await outDir();
    let rebuilt = false;
    try {
      const result = await exportOrFallback(root, {
        exporter: async () => {},
        rebuild: async () => { rebuilt = true; return []; },
      });
      assert.deepEqual(result, { exported: true });
      assert.equal(rebuilt, false);
      assert.deepEqual((await readdir(root)).sort(), ["career-map.pdf", "career-map.png", "index.html"]);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  test("removes partial files and rebuilds without downloads when the export fails", async () => {
    const root = await outDir();
    const rebuilt = [];
    try {
      const result = await exportOrFallback(root, {
        exporter: async () => { throw new Error("No Chromium found"); },
        rebuild: async (dir) => { rebuilt.push(dir); return []; },
      });
      assert.deepEqual(result, { exported: false, reason: "No Chromium found" });
      assert.deepEqual(rebuilt, [root]);
      assert.deepEqual(await readdir(root), ["index.html"]);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  test("still fails when the fallback rebuild fails", async () => {
    const root = await outDir();
    try {
      await assert.rejects(
        exportOrFallback(root, {
          exporter: async () => { throw new Error("boom"); },
          rebuild: async () => ["career.json: bad date"],
        }),
        /without downloads failed:\n {2}- career\.json: bad date/,
      );
    } finally {
      await rm(root, { recursive: true });
    }
  });
});
