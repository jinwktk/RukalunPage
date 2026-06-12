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

test("index.html exposes the modern search-first design surface", () => {
  const html = readText("index.html");

  assert.match(html, /data-design-version="2026-search-first"/);
  assert.match(html, /id="heroClipCount"/);
  assert.match(html, /id="heroVisibleCount"/);
  assert.match(html, /id="heroClipSyncedAt"/);
  assert.doesNotMatch(html, /id="heroUpdatedAt"|id="updatedAt"|JSON生成/);
  assert.doesNotMatch(html, /class="status-row"|id="resultCount"|id="clipSyncedAt"/);
  assert.doesNotMatch(html, /\.status-row|\.pill\.mint|\.pill\s*\{/);
  assert.match(html, /id="activeFilterChip"/);
  assert.match(html, /id="gameFilter"/);
  assert.match(html, /class="search-shell"/);
  assert.match(html, /class="hero-metrics"/);
  assert.match(html, /class="thumbnail-loader"/);
  assert.match(html, /data-light-thumbnail="true"/);
  assert.match(html, /function toLightThumbnailUrl/);
  assert.match(html, /function copyClipUrl/);
  assert.match(html, /function showCopyFeedback/);
  assert.match(html, /function createFavoriteIcon/);
  assert.match(html, /function createVideoIcon/);
  assert.match(html, /className = "clip-action-link-group"/);
  assert.match(html, /linkGroup\.append\(link, copyButton\)/);
  assert.match(html, /actions\.append\(favoriteButton, linkGroup\)/);
  assert.match(html, /grid-template-columns: minmax\(0, 20fr\) minmax\(0, 80fr\);/);
  assert.match(html, /grid-template-columns: minmax\(0, 60fr\) minmax\(0, 20fr\);/);
  assert.match(html, /\.clip-actions\s*\{[\s\S]*?gap: 0;/);
  assert.match(html, /\.clip-actions\s*\{[\s\S]*?align-items: stretch;/);
  assert.match(html, /\.clip-actions\s*\{[\s\S]*?border: 1px solid #ead6e1;/);
  assert.match(html, /\.clip-actions\s*\{[\s\S]*?box-shadow: 0 8px 18px rgba\(88, 55, 88, 0\.06\);/);
  assert.match(html, /\.clip-action-link-group \.clip-link/);
  assert.match(html, /\.clip-action-link-group \.clip-link\s*\{[\s\S]*?border-left: 1px solid #ead6e1;/);
  assert.match(html, /\.clip-action-link-group \.clip-copy-button\s*\{[\s\S]*?border-left: 1px solid #ead6e1;/);
  assert.match(html, /\.clip-favorite-button\s*\{[\s\S]*?background: #fff6d9;/);
  assert.match(html, /\.clip-action-link-group \.clip-link\s*\{[\s\S]*?background: #f4efff;/);
  assert.match(html, /\.clip-action-link-group \.clip-copy-button\s*\{[\s\S]*?background: #e8f8f4;/);
  assert.match(html, /favoriteButton\.append\(createFavoriteIcon\(\)\)/);
  assert.match(html, /link\.append\(createVideoIcon\(\)\)/);
  assert.match(html, /\.button-svg-icon/);
  assert.match(html, /\.clip-favorite-button\[aria-pressed="true"\] \.favorite-heart/);
  assert.match(html, /link\.setAttribute\("aria-label", "Twitchで見る"\)/);
  assert.match(html, /className = "clip-copy-button"/);
  assert.match(html, /className = "copy-icon"/);
  assert.match(html, /\.copy-icon::before,\s*\.copy-icon::after/);
  assert.match(html, /\.copy-icon::before,\s*\.copy-icon::after\s*\{[\s\S]*?box-sizing: border-box;/);
  assert.doesNotMatch(html, /\.clip-copy-button \.copy-icon\s*\{[\s\S]*?transform: scale/);
  assert.match(html, /\.clip-meta\s*\{[\s\S]*?display: grid;/);
  assert.match(html, /\.meta-chip-creator\s*\{[\s\S]*?grid-row: 2;/);
  assert.match(html, /creator\.className = "meta-chip meta-chip-creator"/);
  assert.match(html, /game\.className = "meta-chip meta-chip-game"/);
  assert.match(html, /gameFilter: requireElement\("#gameFilter"\)/);
  assert.match(html, /function buildGameOptions\(clips\)/);
  assert.match(html, /buildGameOptions\(allClips\)/);
  assert.match(html, /const game = elements\.gameFilter\.value;/);
  assert.match(html, /if \(game && clip\.gameName !== game\) return false;/);
  assert.match(html, /elements\.gameFilter\.addEventListener\("change", resetVisibleAndRender\)/);
  assert.match(html, /elements\.gameFilter\.value = "";/);
  assert.match(html, /\.clip-copy-button\.is-copied::after/);
  assert.match(html, /content: attr\(data-copy-status\);/);
  assert.match(html, /button\.dataset\.copyStatus = "コピーしました";/);
  assert.match(html, /copyClipUrl\(clip, copyButton\)/);
  assert.match(html, /aria-label", "Twitch URLをコピー"/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /document\.execCommand\("copy"\)/);
  assert.doesNotMatch(html, /RUKALUN_ICON_PATHS|setIconText/);
  assert.match(html, /-480x272/);
  assert.match(html, /-320x180/);
});

test("modern design keeps mobile search collapsible and thumbnail loading lightweight", () => {
  const html = readText("index.html");

  assert.match(html, /<body data-design-version="2026-search-first">/);
  assert.match(html, /id="searchPanelToggle"[\s\S]*aria-controls="searchControls"/);
  assert.match(html, /<div id="searchControls" class="search-grid">/);
  assert.match(html, /id="closeSearchButton" class="button search-close-button" type="button" aria-label="検索を閉じる"/);
  assert.match(html, /<span aria-hidden="true">×<\/span>/);
  assert.match(html, /\.button\.search-close-button \{[\s\S]*margin-left: auto;/);
  assert.match(html, /searchPanelToggleLabel" class="search-toggle-label">検索を開く/);
  assert.match(html, /\.search-panel:not\(\.is-collapsed\) \.search-toggle-wrap/);
  assert.match(html, /\.search-panel\.is-collapsed \.search-primary,\s*\.search-panel\.is-collapsed \.search-grid/);
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*\.filter-chip \{[\s\S]*display: none;/);
  assert.ok(
    html.indexOf('id="searchInput"') < html.indexOf('id="searchControls"'),
    "keyword search input should appear before the detailed controls when the panel is expanded"
  );
  assert.match(html, /return String\(url\)\.replace\("-480x272\.", "-320x180\."\);/);
  assert.match(html, /const countDiff = creatorCounts\.get\(b\) - creatorCounts\.get\(a\);/);
  assert.match(html, /return countDiff \|\| a\.localeCompare\(b, "ja-JP"\);/);
  assert.match(html, /elements\.searchPanelSummary\.textContent = `\$\{resultLabel\} \/ \$\{summary\}`;/);
  assert.match(html, /image\.loading = "lazy";/);
  assert.match(html, /image\.decoding = "async";/);
  assert.match(
    html,
    /if \(dataLoadState === "loading"\) \{[\s\S]*updateSearchPanelSummary\(\);[\s\S]*return;[\s\S]*\}/
  );
  assert.match(html, /dataLoadState === "loaded" && filteredClips\.length === 0/);
  assert.doesNotMatch(html, /cache:\s*"no-store"/);
  assert.doesNotMatch(
    html,
    /font-size:\s*[^;]*(?:vw|vmin|vmax|clamp\()/,
    "font-size must not scale directly with viewport width"
  );
});
