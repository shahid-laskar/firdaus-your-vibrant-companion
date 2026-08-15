import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isStandalone } from "./pwa";

describe("PWA Foundation", () => {
  test("isStandalone returns false in Node/SSR environment", () => {
    assert.equal(isStandalone(), false);
  });

  test("manifest.webmanifest exists and is valid JSON with required PWA properties", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.webmanifest");
    assert.equal(fs.existsSync(manifestPath), true, "manifest.webmanifest must exist in public/");

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assert.equal(content.name, "Sunnah Home");
    assert.equal(content.short_name, "Sunnah Home");
    assert.equal(content.start_url, "/");
    assert.equal(content.display, "standalone");
    assert.ok(Array.isArray(content.icons) && content.icons.length >= 2, "must have icons");

    const sizes = content.icons.map((i: { sizes: string }) => i.sizes);
    assert.ok(sizes.includes("192x192"), "must include 192x192 icon");
    assert.ok(sizes.includes("512x512"), "must include 512x512 icon");
  });

  test("Service Worker public/sw.js exists and handles core events", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    assert.equal(fs.existsSync(swPath), true, "sw.js must exist in public/");

    const swContent = fs.readFileSync(swPath, "utf-8");
    assert.ok(swContent.includes("install"), "SW must handle install event");
    assert.ok(swContent.includes("activate"), "SW must handle activate event");
    assert.ok(swContent.includes("fetch"), "SW must handle fetch event");
    assert.ok(swContent.includes("caches.open"), "SW must open CacheStorage");
    assert.ok(swContent.includes("skipWaiting"), "SW must support skipWaiting");
  });

  test("Required icon assets exist in public/", () => {
    const requiredFiles = [
      "icon-192.png",
      "icon-512.png",
      "icon-maskable-192.png",
      "icon-maskable-512.png",
      "apple-touch-icon.png",
      "favicon.ico",
    ];

    for (const file of requiredFiles) {
      const filePath = path.resolve(process.cwd(), "public", file);
      assert.equal(fs.existsSync(filePath), true, `${file} must exist in public/`);
    }
  });
});
