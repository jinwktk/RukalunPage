import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoDir = process.cwd();
const pageUrl = "https://jinwktk.github.io/RukalunPage/";

function readText(relativePath) {
  return fs.readFileSync(path.join(repoDir, relativePath), "utf8");
}

test("index.html is the public clip search page for RukalunPage", () => {
  const html = readText("index.html");

  assert.match(html, /clip-search-data\.json/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${pageUrl}" />`));
  assert.match(html, new RegExp(`"url": "${pageUrl}"`));
  assert.match(html, new RegExp(`${pageUrl}\\?q=\\{search_term_string\\}`));
  assert.match(
    html,
    /https:\/\/jinwktk\.github\.io\/RukalunPage\/assets\/rukalun\/clip-search-og\.png/
  );
  assert.doesNotMatch(html, /https:\/\/jinwktk\.github\.io\/twitchRaid/);
  assert.doesNotMatch(html, /docs:export-clips|SQLite|公開JSON/);
});

test("required page assets and data are present", () => {
  const requiredFiles = [
    "clip-search-data.json",
    "assets/rukalun/clip-search-hero.png",
    "assets/rukalun/clip-search-og.png",
    "assets/rukalun/clip-search-favicon.png",
    "assets/rukalun/clip-search-favicon.ico",
    "assets/rukalun/clip-search-apple-touch-icon.png",
    "assets/rukalun/Hi-112px.png",
    "assets/rukalun/プレゼント-112px.png",
    "assets/rukalun/bikkuri-112px.png",
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(fs.existsSync(path.join(repoDir, relativePath)), true, relativePath);
  }
});

test("clip-search.html keeps old new-repo paths working", () => {
  const html = readText("clip-search.html");

  assert.match(html, /content="0; url=\.\/"/);
  assert.match(html, /location\.replace\(target\.href\)/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${pageUrl}" />`));
});
