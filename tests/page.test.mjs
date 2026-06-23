import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoDir = process.cwd();
const displaySiteName = "🖇るっかるんくりっぷ🖇";
const structuredSiteName = "るっかるんくりっぷ";
const pageUrl = "https://www.rukalun.mydns.jp/";
const pageTitle = `${displaySiteName} | Twitch Clip・配信切り抜き検索`;
const gaMeasurementId = "G-TTVJN1V2LJ";
const gaScriptUrl = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
const kofiUsername = "jinnymeia";
const kofiWidgetScriptUrl = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
const faviconIcoUrl = `${pageUrl}assets/rukalun/clip-search-favicon.ico`;
const faviconPngUrl = `${pageUrl}assets/rukalun/clip-search-favicon.png`;
const appleTouchIconUrl = `${pageUrl}assets/rukalun/clip-search-apple-touch-icon.png`;
const seoDescription =
  "るっかるんのTwitch（ツイッチ）配信Clip・クリップや切り抜きを、タイトル・作成者・ゲーム名で探せる公開検索ページです。FF14、LoL、VALORANT、雑談の名場面を軽く回収できます。";
const dataUrl = `${pageUrl}clip-search-data.json`;
const googleVerificationFile = "googled9f512eea3a99dc1.html";
const pageUpdatedOn = "2026-06-23";
const seoKeywordTerms = [
  "FF14",
  "FFXIV",
  "LoL",
  "League of Legends",
  "VALORANT",
  "VALO",
  "雑談",
  "絶叫",
  "言質",
  "迷子",
];
const popularSearches = [
  ["FF14", "FF14"],
  ["FFXIV", "FINAL FANTASY XIV ONLINE"],
  ["LoL", "LoL"],
  ["League of Legends", "League of Legends"],
  ["VALORANT", "VALORANT"],
  ["VALO", "VALO"],
  ["雑談", "雑談"],
  ["絶叫", "絶叫"],
  ["言質", "言質"],
  ["迷子", "迷子"],
];

function readText(relativePath) {
  return fs.readFileSync(path.join(repoDir, relativePath), "utf8");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripTags(htmlFragment) {
  return htmlFragment.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .trim()
    .replace(/\s+/g, " ");
}

function getClipSearchHitCount(query) {
  const data = JSON.parse(readText("clip-search-data.json"));
  const terms = normalizeSearchText(query).split(" ");
  return data.clips.filter((clip) => {
    const searchText = normalizeSearchText(`${clip.title} ${clip.creator} ${clip.gameName}`);
    return terms.every((term) => searchText.includes(term));
  }).length;
}

function readPngSize(relativePath) {
  const buffer = fs.readFileSync(path.join(repoDir, relativePath));
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", `${relativePath} should be a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readIcoSizes(relativePath) {
  const buffer = fs.readFileSync(path.join(repoDir, relativePath));
  assert.equal(buffer.readUInt16LE(0), 0, `${relativePath} should have an ICO reserved field`);
  assert.equal(buffer.readUInt16LE(2), 1, `${relativePath} should be an icon file`);
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    const width = buffer[offset] || 256;
    const height = buffer[offset + 1] || 256;
    return `${width}x${height}`;
  }).sort((a, b) => Number.parseInt(a) - Number.parseInt(b));
}

function getCssVariable(html, name) {
  const match = html.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6});`));
  assert.ok(match, `${name} should be defined as a hex color`);
  return match[1];
}

function relativeLuminance(hexColor) {
  const channels = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hexColor.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getStructuredData(html) {
  const match = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(match, "JSON-LD script should exist");
  return JSON.parse(match[1]);
}

function getGraphNode(graph, type) {
  const node = graph.find((entry) => entry["@type"] === type);
  assert.ok(node, `${type} node should exist`);
  return node;
}

test("index.html is the public clip search page for RukalunPage", () => {
  const html = readText("index.html");

  assert.match(html, /clip-search-data\.json/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${pageUrl}" />`));
  assert.match(html, new RegExp(`"url": "${pageUrl}"`));
  assert.match(html, new RegExp(`${pageUrl}\\?q=\\{search_term_string\\}`));
  assert.match(html, new RegExp(`${pageUrl}assets/rukalun/clip-search-og\\.jpg`));
  assert.doesNotMatch(html, /https:\/\/jinwktk\.github\.io\/RukalunPage/);
  assert.doesNotMatch(html, /https:\/\/jinwktk\.github\.io\/twitchRaid/);
  assert.doesNotMatch(html, /docs:export-clips|SQLite|公開JSON/);
});

test("required page assets and data are present", () => {
  const requiredFiles = [
    "clip-search-data.json",
    googleVerificationFile,
    "assets/rukalun/clip-search-hero.png",
    "assets/rukalun/clip-search-hero.webp",
    "assets/rukalun/clip-search-og.jpg",
    "assets/rukalun/clip-search-favicon.png",
    "assets/rukalun/clip-search-favicon.ico",
    "assets/rukalun/clip-search-apple-touch-icon.png",
    "assets/rukalun/Hi-112px.png",
    "assets/rukalun/Hi-56px.webp",
    "assets/rukalun/プレゼント-112px.png",
    "assets/rukalun/present-56px.webp",
    "assets/rukalun/bikkuri-112px.png",
    "assets/rukalun/bikkuri-56px.webp",
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(fs.existsSync(path.join(repoDir, relativePath)), true, relativePath);
  }

  assert.equal(
    readText(googleVerificationFile).trim(),
    `google-site-verification: ${googleVerificationFile}`
  );
});

test("favicon assets stay high resolution and search-result friendly", () => {
  assert.deepEqual(readPngSize("assets/rukalun/clip-search-favicon.png"), {
    width: 512,
    height: 512,
  });
  assert.deepEqual(readPngSize("assets/rukalun/clip-search-apple-touch-icon.png"), {
    width: 180,
    height: 180,
  });
  assert.deepEqual(readIcoSizes("assets/rukalun/clip-search-favicon.ico"), [
    "16x16",
    "32x32",
    "48x48",
    "64x64",
    "128x128",
    "256x256",
  ]);
});

test("clip-search.html keeps old new-repo paths working", () => {
  const html = readText("clip-search.html");

  assert.match(html, /<meta name="robots" content="noindex,follow" \/>/);
  assert.match(html, /content="0; url=\.\/"/);
  assert.match(html, /location\.replace\(target\.href\)/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${pageUrl}" />`));
});

test("index.html exposes the modern search-first design surface", () => {
  const html = readText("index.html");

  assert.match(html, /data-design-version="2026-search-first"/);
  assert.ok(html.includes(`<title>${pageTitle}</title>`));
  assert.ok(html.includes(`<meta property="og:site_name" content="${structuredSiteName}" />`));
  assert.ok(html.includes(`<meta property="og:title" content="${pageTitle}" />`));
  assert.ok(html.includes(`<link rel="icon" href="${faviconIcoUrl}" sizes="any" />`));
  assert.ok(html.includes(`<link rel="icon" href="${faviconPngUrl}" type="image/png" sizes="512x512" />`));
  assert.ok(html.includes(`<link rel="apple-touch-icon" href="${appleTouchIconUrl}" />`));
  assert.match(html, /aria-label="🖇るっかるんくりっぷ🖇"/);
  assert.match(html, /class="brand-icon" src="\.\/assets\/rukalun\/Hi-56px\.webp"/);
  assert.match(html, /class="button-icon" src="\.\/assets\/rukalun\/bikkuri-56px\.webp"/);
  assert.match(html, /class="button-icon" src="\.\/assets\/rukalun\/Hi-56px\.webp"/);
  assert.match(html, /class="button-icon" src="\.\/assets\/rukalun\/present-56px\.webp"/);
  assert.match(html, /--font-cute:[\s\S]*?UD デジタル 教科書体 NP/);
  assert.match(html, /font-family: var\(--font-cute\);/);
  assert.match(html, /class="brand-name"/);
  assert.match(html, /class="site-clip-symbol"/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|@font-face/);
  assert.doesNotMatch(html, /おはるっか Clip回収所|class="eyebrow"|class="eyebrow-icon"/);
  assert.match(html, /るっかと愉快な名場面、<span class="title-phrase">すぐ回収。<\/span>/);
  assert.match(html, /笑い声も絶叫も言質も/);
  assert.match(html, /h1\s*\{[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(html, /\.lead\s*\{[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(html, /class="lead-line">笑い声も絶叫も言質も、あとからふわっと。/);
  assert.match(html, /class="lead-line">おもちかえりできます。/);
  assert.match(html, /\.lead-line\s*\{[\s\S]*?display: inline;/);
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*\.lead-line\s*\{[\s\S]*display: block;/);
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
  assert.match(
    html,
    /<link rel="preload" as="image" href="\.\/assets\/rukalun\/clip-search-hero\.webp" type="image\/webp" fetchpriority="high" \/>/
  );
  assert.match(html, /<picture>[\s\S]*<source srcset="\.\/assets\/rukalun\/clip-search-hero\.webp" type="image\/webp" \/>[\s\S]*class="hero-image"/);
  assert.match(html, /class="hero-image"[\s\S]*src="\.\/assets\/rukalun\/clip-search-hero\.png"[\s\S]*fetchpriority="high"/);
  assert.doesNotMatch(html, /class="hero-image"[\s\S]*loading="lazy"/);
  assert.match(html, /class="thumbnail-loader"/);
  assert.match(html, /data-light-thumbnail="true"/);
  assert.match(html, /function toLightThumbnailUrl/);
  assert.match(html, /function copyClipUrl/);
  assert.match(html, /function showCopyFeedback/);
  assert.match(html, /function createFavoriteIcon/);
  assert.match(html, /function createVideoIcon/);
  assert.match(html, /function handleClipOpen\(event, clip\)/);
  assert.match(html, /function createClipAnchor\(clip, className, label\)/);
  assert.match(html, /function isSmallViewport\(\)/);
  assert.match(html, /function toTwitchEmbedUrl\(clip\)/);
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
  assert.match(html, /const thumbnail = createClipAnchor\(clip, "clip-thumbnail clip-thumbnail-link", "TwitchでClipを開く"\);/);
  assert.match(html, /const link = createClipAnchor\(clip, "clip-link", "Twitchで見る"\);/);
  assert.match(html, /link\.append\(createVideoIcon\(\)\)/);
  assert.match(html, /link\.title = "Twitchで見る";/);
  assert.match(html, /thumbnail\.setAttribute\("data-light-thumbnail", "true"\);/);
  assert.match(html, /\.clip-thumbnail-link\s*\{[\s\S]*?cursor: pointer;/);
  assert.match(html, /\.clip-thumbnail-link:focus-visible\s*\{[\s\S]*?outline:/);
  assert.match(html, /const link = document\.createElement\("a"\);[\s\S]*link\.target = "_blank";[\s\S]*link\.rel = "noopener noreferrer";[\s\S]*link\.href = getSafeClipUrl\(clip\);[\s\S]*link\.setAttribute\("aria-label", label\);[\s\S]*link\.addEventListener\("click", \(event\) => handleClipOpen\(event, clip\)\);/);
  assert.doesNotMatch(html, /const link = document\.createElement\("button"\);/);
  assert.match(html, /className = "clip-copy-button"/);
  assert.match(html, /className = "copy-icon"/);
  assert.match(html, /\.copy-icon::before,\s*\.copy-icon::after/);
  assert.match(html, /\.copy-icon::before,\s*\.copy-icon::after\s*\{[\s\S]*?box-sizing: border-box;/);
  assert.doesNotMatch(html, /\.clip-copy-button \.copy-icon\s*\{[\s\S]*?transform: scale/);
  assert.match(html, /\.clip-meta\s*\{[\s\S]*?display: grid;/);
  assert.match(html, /\.meta-chip-creator\s*\{[\s\S]*?grid-row: 2;/);
  assert.match(html, /createMetaFilterButton\("creator", clip\.creator, `作成: \$\{clip\.creator\}`\)/);
  assert.match(html, /createMetaFilterButton\("game", clip\.gameName, `ゲーム: \$\{clip\.gameName\}`\)/);
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

  assert.ok(
    contrastRatio("#ffffff", getCssVariable(html, "--pink")) >= 4.5,
    "primary pink buttons with white text should meet AA contrast"
  );

  const filterChipStyle = html.match(/\.filter-chip\s*\{([\s\S]*?)\n      \}/)?.[1] ?? "";
  assert.match(filterChipStyle, /white-space: nowrap;/);
  assert.match(filterChipStyle, /width: fit-content;/);
  assert.match(filterChipStyle, /max-width: 100%;/);
  assert.doesNotMatch(filterChipStyle, /text-overflow: ellipsis;/);
});

test("index.html exposes search-oriented SEO metadata and structured data", () => {
  const html = readText("index.html");
  const keywordGuide = html.match(/<section id="keywordGuide"[\s\S]*?<\/section>/)?.[0] ?? "";
  const keywordGuideText = stripTags(keywordGuide);
  const keywordGuideStyle = html.match(/\.keyword-guide\s*\{([\s\S]*?)\n      \}/)?.[1] ?? "";

  assert.ok(html.includes(`<meta name="description" content="${seoDescription}" />`));
  assert.ok(html.includes(`<meta property="og:description" content="${seoDescription}" />`));
  assert.ok(html.includes(`<meta name="twitter:description" content="${seoDescription}" />`));
  assert.ok(html.includes(`<meta name="twitter:title" content="${pageTitle}" />`));
  assert.doesNotMatch(html, /<meta name="keywords"/);
  assert.match(html, /class="lead-line">FF14もLoLもVALOも、/);
  assert.match(html, /class="lead-line">タイトル・作成者・ゲームでそっと探して、/);
  assert.doesNotMatch(html, /id="clipSearchOverview"/);
  assert.match(html, /id="keywordGuide"/);
  assert.match(html, /id="keywordGuideTitle"/);
  assert.match(html, /class="keyword-link-list"/);
  assert.match(html, /\.keyword-guide\s*\{[\s\S]*?border-top: 1px solid var\(--line\);/);
  assert.match(html, /\.keyword-guide\s*\{[\s\S]*?display: grid;/);
  assert.match(html, /\.keyword-guide\s*\{[\s\S]*?grid-template-columns: auto minmax\(0, 1fr\);/);
  assert.match(html, /\.keyword-guide\s*\{[\s\S]*?margin: 0 0 14px;/);
  assert.match(html, /\.keyword-guide\s*\{[\s\S]*?padding-top: 14px;/);
  assert.match(html, /\.keyword-guide h2\s*\{[\s\S]*?display: inline-flex;/);
  assert.match(html, /\.keyword-guide h2::before\s*\{[\s\S]*?content: "";/);
  assert.match(html, /\.keyword-guide h2::before\s*\{[\s\S]*?radial-gradient/);
  assert.match(html, /\.keyword-guide h2::before\s*\{[\s\S]*?linear-gradient\(45deg/);
  assert.doesNotMatch(html, /content: "#";/);
  assert.match(html, /\.keyword-link-list\s*\{[\s\S]*?grid-column: 2;/);
  assert.match(html, /\.keyword-link-list a\s*\{[\s\S]*?display: inline-flex;/);
  assert.match(html, /\.keyword-link-list a\s*\{[\s\S]*?min-height: 32px;/);
  assert.match(html, /\.keyword-link-list a\s*\{[\s\S]*?border-radius: 8px;/);
  assert.match(html, /\.keyword-link-list a\s*\{[\s\S]*?text-decoration: none;/);
  assert.match(html, /\.keyword-link-list a:nth-child\(3n \+ 1\)/);
  assert.match(html, /\.keyword-link-list a:nth-child\(3n \+ 2\)/);
  assert.match(html, /\.keyword-link-list a:hover/);
  assert.match(html, /\.keyword-link-list a:focus-visible/);
  assert.match(html, /@media \(max-width: 620px\) \{[\s\S]*?\.keyword-guide\s*\{[\s\S]*?display: block;/);
  assert.doesNotMatch(keywordGuide, /<p>/);
  assert.doesNotMatch(keywordGuide, /keyword-guide-line/);
  assert.doesNotMatch(keywordGuideText, /顔アイコン|キャラクター画像|とぅいっち/);
  assert.doesNotMatch(keywordGuideStyle, /display:\s*none/);
  assert.ok(
    html.indexOf('id="keywordGuide"') < html.indexOf('id="results"'),
    "keyword guide should be visible before clip results for mobile search discovery"
  );

  for (const term of seoKeywordTerms) {
    assert.ok(keywordGuideText.includes(term), `${term} should be visible in the keyword guide`);
  }

  for (const [label, query] of popularSearches) {
    const href = `./?q=${encodeURIComponent(query)}#searchPanel`;
    assert.match(
      keywordGuide,
      new RegExp(`<a href="${escapeRegExp(href)}">${escapeRegExp(label)}</a>`)
    );
    assert.ok(getClipSearchHitCount(query) > 0, `${label} should search at least one current clip`);
  }

  const structuredData = getStructuredData(html);
  assert.equal(structuredData["@context"], "https://schema.org");
  assert.ok(Array.isArray(structuredData["@graph"]), "JSON-LD should use @graph");

  const graph = structuredData["@graph"];
  const website = getGraphNode(graph, "WebSite");
  assert.equal(website.name, structuredSiteName);
  assert.deepEqual(website.alternateName, [
    "Rukalun Clip",
    "るっかるん Clip検索",
    "るっかるん Twitchクリップ",
    "るっかるん 配信切り抜き",
    "www.rukalun.mydns.jp",
  ]);
  assert.equal(website.url, pageUrl);
  assert.equal(website.potentialAction["@type"], "SearchAction");
  assert.equal(website.potentialAction.target, `${pageUrl}?q={search_term_string}`);

  const page = getGraphNode(graph, "CollectionPage");
  assert.equal(page.name, pageTitle);
  assert.equal(page.description, seoDescription);
  assert.equal(page.url, pageUrl);
  assert.equal(page.mainEntity["@id"], `${pageUrl}#clipDataset`);
  assert.match(page.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(page.dateModified, pageUpdatedOn);
  assert.deepEqual(page.keywords, seoKeywordTerms);
  assert.deepEqual(
    page.about.map((item) => item.name),
    ["Twitch Clip検索", "配信切り抜き", "ゲーム配信", "FF14", "LoL", "VALORANT"]
  );
  for (const keyword of page.keywords) {
    assert.ok(keywordGuideText.includes(keyword), `${keyword} should be visible if used in CollectionPage keywords`);
  }

  const dataset = getGraphNode(graph, "Dataset");
  assert.equal(dataset["@id"], `${pageUrl}#clipDataset`);
  assert.equal(dataset.name, "るっかるん Twitch Clip公開データ");
  assert.equal(dataset.url, pageUrl);
  assert.match(dataset.description, /Twitch（ツイッチ）配信Clip/);
  assert.equal(dataset.publisher.name, structuredSiteName);
  assert.equal(dataset.distribution["@type"], "DataDownload");
  assert.equal(dataset.distribution.contentUrl, dataUrl);
  assert.equal(dataset.distribution.encodingFormat, "application/json");
  assert.equal(dataset.dateModified, undefined);
  assert.equal(dataset.measurementTechnique, "twitchRaid clip export");
  assert.equal(dataset.variableMeasured, "title, creator, gameName, createdAt, views");
  assert.deepEqual(dataset.keywords, seoKeywordTerms);
});

test("index.html installs the GA4 Google tag after critical hero discovery", () => {
  const html = readText("index.html");
  const gaScriptTag = `<script async src="${gaScriptUrl}"></script>`;
  const gaScriptTags =
    html.match(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+"><\/script>/g) ?? [];
  const gaConfigCalls = html.match(/gtag\("config", "G-[A-Z0-9]+"\);/g) ?? [];
  const heroPreload =
    '<link rel="preload" as="image" href="./assets/rukalun/clip-search-hero.webp" type="image/webp" fetchpriority="high" />';
  const jsonLdScript = '<script type="application/ld+json">';

  assert.match(gaMeasurementId, /^G-[A-Z0-9]+$/);
  assert.deepEqual(gaScriptTags, [gaScriptTag]);
  assert.deepEqual(gaConfigCalls, [`gtag("config", "${gaMeasurementId}");`]);
  assert.match(html, /window\.dataLayer = window\.dataLayer \|\| \[\];/);
  assert.match(html, /function gtag\(\) \{\s*dataLayer\.push\(arguments\);\s*\}/);
  assert.match(html, /gtag\("js", new Date\(\)\);/);
  assert.ok(
    html.indexOf(heroPreload) < html.indexOf(gaScriptTag),
    "GA4 should not be inserted before the LCP hero preload"
  );
  assert.ok(
    html.indexOf(gaScriptTag) < html.indexOf(jsonLdScript),
    "GA4 should be declared before JSON-LD so head analytics stays grouped with metadata"
  );
});

test("index.html installs a small non-blocking Ko-fi support widget", () => {
  const html = readText("index.html");
  const dynamicKofiCss = html.match(/const KOFI_WIDGET_POSITION_CSS = `([\s\S]*?)`;/)?.[1] ?? "";
  const kofiScriptTags =
    html.match(/<script[^>]+src="https:\/\/storage\.ko-fi\.com\/cdn\/scripts\/overlay-widget\.js"[^>]*><\/script>/g) ??
    [];

  assert.deepEqual(kofiScriptTags, [], "Ko-fi must not be a static third-party script that can delay window load");
  assert.match(html, new RegExp(`const KOFI_WIDGET_SCRIPT_URL = "${kofiWidgetScriptUrl}";`));
  assert.match(html, /function drawKofiWidget\(\)/);
  assert.match(html, /function scheduleKofiWidget\(\)/);
  assert.match(html, /function installKofiWidgetStyles\(\)/);
  assert.match(html, /id = "kofi-widget-position-style"/);
  assert.match(html, /const script = document\.createElement\("script"\);/);
  assert.match(html, /script\.src = KOFI_WIDGET_SCRIPT_URL;/);
  assert.match(html, /script\.async = true;/);
  assert.match(html, /script\.addEventListener\("load", drawKofiWidget, \{ once: true \}\);/);
  assert.match(html, /script\.addEventListener\("error", installKofiWidgetStyles, \{ once: true \}\);/);
  assert.match(html, /document\.body\.append\(script\);/);
  assert.match(
    html,
    /window\.requestIdleCallback\(\(\) => \{[\s\S]*loadData\(\);[\s\S]*scheduleKofiWidget\(\);[\s\S]*\}, \{ timeout: 1200 \}\);/
  );
  assert.match(
    html,
    /window\.setTimeout\(\(\) => \{[\s\S]*loadData\(\);[\s\S]*scheduleKofiWidget\(\);[\s\S]*\}, 160\);/
  );
  assert.match(html, /catch \(error\) \{[\s\S]*\} finally \{[\s\S]*window\.setTimeout\(installKofiWidgetStyles, 0\);/);
  assert.match(html, /window\.setTimeout\(installKofiWidgetStyles, 0\);/);
  assert.match(html, new RegExp(`window\\.kofiWidgetOverlay\\?\\.draw\\?\\.\\("${kofiUsername}", \\{`));
  assert.match(html, /"type": "floating-chat"/);
  assert.match(html, /"floating-chat\.donateButton\.text": " "/);
  assert.match(html, /"floating-chat\.donateButton\.background-color": "#ffe8f0"/);
  assert.match(html, /"floating-chat\.donateButton\.text-color": "#2c2633"/);
  assert.match(
    html,
    /\.floatingchat-container-wrap,\s*\.floatingchat-container\s*\{[\s\S]*position: fixed !important;[\s\S]*right: 18px !important;[\s\S]*bottom: 18px !important;[\s\S]*z-index: 30 !important;[\s\S]*width: 88px !important;[\s\S]*height: 56px !important;[\s\S]*overflow: hidden !important;/
  );
  assert.match(
    dynamicKofiCss,
    /\.floatingchat-container-wrap,\s*\.floatingchat-container\s*\{[\s\S]*right: 18px !important;[\s\S]*bottom: 18px !important;[\s\S]*width: 88px !important;[\s\S]*height: 56px !important;[\s\S]*overflow: hidden !important;/
  );
  assert.match(
    html,
    /\.floating-chat-kofi-popup-iframe,\s*\.floating-chat-kofi-popup-iframe-mobi,\s*\.floatingchat-container-wrap iframe\s*\{[\s\S]*max-width: calc\(100vw - 28px\) !important;/
  );
  assert.match(
    html,
    /\.floatingchat-container-wrap-mobi\s*\{[\s\S]*left: auto !important;[\s\S]*right: 18px !important;[\s\S]*width: 88px !important;[\s\S]*overflow: hidden !important;/
  );
  assert.match(
    html,
    /\.floatingchat-container-wrap \[class\*="donateButton"\],[\s\S]*\.floatingchat-container \[class\*="donateButton"\],[\s\S]*\.floatingchat-container-wrap-mobi \[class\*="donateButton"\]\s*\{[\s\S]*border: 1px solid #f2b4ce !important;[\s\S]*border-radius: 8px !important;[\s\S]*background: linear-gradient\(135deg, #fff6fb 0%, var\(--pink-soft\) 52%, var\(--mint\) 100%\) !important;[\s\S]*color: var\(--ink\) !important;[\s\S]*box-shadow: var\(--shadow\) !important;/
  );
  assert.match(
    html,
    /\.floatingchat-container-wrap \[class\*="donateButton"\]:hover,[\s\S]*\.floatingchat-container \[class\*="donateButton"\]:hover,[\s\S]*\.floatingchat-container-wrap-mobi \[class\*="donateButton"\]:hover\s*\{[\s\S]*border-color: #e86f9f !important;[\s\S]*background: linear-gradient\(135deg, #fff 0%, #ffe7f0 48%, #d4f1ea 100%\) !important;/
  );
  assert.match(
    html,
    /\.floatingchat-container-wrap \[class\*="donateButton"\] img,[\s\S]*\.floatingchat-container \[class\*="donateButton"\] img,[\s\S]*\.floatingchat-container-wrap-mobi \[class\*="donateButton"\] img\s*\{[\s\S]*width: 22px !important;[\s\S]*height: 22px !important;[\s\S]*border-radius: 6px !important;/
  );
  assert.match(
    html,
    /@media \(max-width: 620px\) \{[\s\S]*--kofi-mobile-right: max\(10px, calc\(100vw - 390px\)\);[\s\S]*\.floatingchat-container-wrap,\s*\.floatingchat-container,\s*\.floatingchat-container-wrap-mobi\s*\{[\s\S]*right: var\(--kofi-mobile-right\) !important;[\s\S]*bottom: 10px !important;[\s\S]*transform: scale\(0\.86\);[\s\S]*\.floatingchat-container-wrap \.kofi-button-text,[\s\S]*display: none !important;/
  );
});

test("sitemap lists only the canonical public URL", () => {
  const sitemap = readText("sitemap.xml");

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, new RegExp(`<loc>${pageUrl}</loc>`));
  assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  assert.match(sitemap, new RegExp(`<lastmod>${pageUpdatedOn}</lastmod>`));
  assert.doesNotMatch(sitemap, /<changefreq>|<priority>/);
  assert.doesNotMatch(sitemap, /clip-search\.html/);
});

test("text sitemap lists only the canonical public URL", () => {
  const sitemap = readText("sitemap.txt");

  assert.equal(sitemap.trim(), pageUrl);
  assert.doesNotMatch(sitemap, /clip-search\.html/);
});

test("documentation records SEO operation constraints", () => {
  const readme = readText("README.md");
  const agents = readText("AGENTS.md");

  assert.match(readme, /sitemap\.xml/);
  assert.match(readme, /sitemap\.txt/);
  assert.match(readme, /hostname単位/);
  assert.match(readme, /Search Console/);
  assert.match(readme, new RegExp(googleVerificationFile));
  assert.match(readme, /www\.rukalun\.mydns\.jp/);
  assert.match(readme, /カスタムドメイン/);
  assert.match(readme, /robots\.txt/);
  assert.match(readme, /Google Analytics 4/);
  assert.match(readme, new RegExp(gaMeasurementId));
  assert.match(readme, /カスタムイベントは未導入/);
  assert.match(readme, /Ko-fi/);
  assert.match(readme, new RegExp(kofiUsername));
  assert.match(readme, /PC\/SPとも文字なし/);
  assert.match(readme, /カード内のゲーム名や作成者名/);
  assert.match(readme, /SEOキーワード拡張/);
  assert.match(readme, /人気検索リンク/);
  assert.match(readme, /配信切り抜き/);
  assert.match(readme, /\?q= URL/);
  assert.match(readme, /GSC\/GA4/);
  assert.match(readme, /検索結果が返る語彙/);
  assert.match(readme, /モバイル/);
  assert.match(readme, /PC版ではClipカードからモーダル/);
  assert.match(readme, /SP版ではTwitchリンク/);
  assert.match(readme, /iframeはクリック時にだけ生成/);
  assert.match(readme, /autoplay=true/);
  assert.match(readme, /タイトルバーを持たず/);
  assert.match(readme, /右上に大きな閉じるボタン/);
  assert.match(readme, /閉じるとiframeを破棄/);
  assert.match(agents, /sitemap\.xml/);
  assert.match(agents, /sitemap\.txt/);
  assert.match(agents, /hostname単位/);
  assert.match(agents, /Search Console/);
  assert.match(agents, new RegExp(googleVerificationFile));
  assert.match(agents, /www\.rukalun\.mydns\.jp/);
  assert.match(agents, /カスタムドメイン/);
  assert.match(agents, /robots\.txt/);
  assert.match(agents, /Google Analytics 4/);
  assert.match(agents, new RegExp(gaMeasurementId));
  assert.match(agents, /カスタムイベントは未導入/);
  assert.match(agents, /Ko-fi/);
  assert.match(agents, new RegExp(kofiUsername));
  assert.match(agents, /PC\/SPとも文字なし/);
  assert.match(agents, /カード内のゲーム名や作成者名/);
  assert.match(agents, /SEOキーワード拡張/);
  assert.match(agents, /人気検索リンク/);
  assert.match(agents, /配信切り抜き/);
  assert.match(agents, /\?q= URL/);
  assert.match(agents, /GSC\/GA4/);
  assert.match(agents, /検索結果が返る語彙/);
  assert.match(agents, /モバイル/);
  assert.match(agents, /PC版ではClipカードからモーダル/);
  assert.match(agents, /SP版ではTwitchリンク/);
  assert.match(agents, /iframeはクリック時にだけ生成/);
  assert.match(agents, /autoplay=true/);
  assert.match(agents, /タイトルバーを持たず/);
  assert.match(agents, /右上に大きな閉じるボタン/);
  assert.match(agents, /閉じるとiframeを破棄/);
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
  assert.match(html, /function getActiveFilterChipLabel\(\)/);
  assert.match(html, /return `\$\{visibleLabel\} \/ \$\{totalLabel\} clips \/ 条件あり`;/);
  assert.match(html, /elements\.searchPanelSummary\.textContent = `\$\{resultLabel\} \/ \$\{summary\}`;/);
  assert.match(html, /elements\.activeFilterChip\.textContent = getActiveFilterChipLabel\(\);/);
  assert.doesNotMatch(html, /elements\.activeFilterChip\.textContent = `\$\{resultLabel\} \/ \$\{summary\}`;/);
  assert.match(html, /image\.loading = "lazy";/);
  assert.match(html, /image\.decoding = "async";/);
  assert.match(
    html,
    /if \(dataLoadState === "loading"\) \{[\s\S]*updateSearchPanelSummary\(\);[\s\S]*return;[\s\S]*\}/
  );
  assert.match(html, /dataLoadState === "loaded" && filteredClips\.length === 0/);
  assert.doesNotMatch(html, /cache:\s*"no-store"/);
  assert.match(html, /const INITIAL_LIMIT = 24;/);
  assert.match(html, /const MORE_STEP = 24;/);
  assert.match(html, /function scheduleDataLoad\(\)/);
  assert.match(
    html,
    /window\.requestIdleCallback\(\(\) => \{[\s\S]*loadData\(\);[\s\S]*scheduleKofiWidget\(\);[\s\S]*\}, \{ timeout: 1200 \}\);/
  );
  assert.match(
    html,
    /window\.setTimeout\(\(\) => \{[\s\S]*loadData\(\);[\s\S]*scheduleKofiWidget\(\);[\s\S]*\}, 160\);/
  );
  assert.match(html, /window\.addEventListener\("load", runLoadData, \{ once: true \}\);/);
  assert.doesNotMatch(html, /\n\s*loadData\(\);\s*\n\s*<\/script>/);
  assert.doesNotMatch(
    html,
    /font-size:\s*[^;]*(?:vw|vmin|vmax|clamp\()/,
    "font-size must not scale directly with viewport width"
  );
});

test("random button remains usable across repeated clicks", () => {
  const html = readText("index.html");
  const pickRandomStart = html.indexOf("function pickRandomClip()");
  const pickRandomEnd = html.indexOf("async function loadData()");
  assert.notEqual(pickRandomStart, -1, "pickRandomClip should exist");
  assert.ok(pickRandomEnd > pickRandomStart, "pickRandomClip should appear before loadData");
  const pickRandomBlock = html.slice(pickRandomStart, pickRandomEnd);

  assert.match(html, /let lastRandomSearchValue = "";/);
  assert.match(html, /let lastRandomClipId = "";/);
  assert.match(
    html,
    /function clearRandomSelectionState\(\) \{[\s\S]*lastRandomSearchValue = "";[\s\S]*lastRandomClipId = "";[\s\S]*\}/
  );
  assert.match(
    html,
    /const shouldClearPreviousRandomQuery = Boolean\([\s\S]*lastRandomSearchValue[\s\S]*elements\.searchInput\.value === lastRandomSearchValue[\s\S]*\);/
  );
  assert.match(
    html,
    /if \(shouldClearPreviousRandomQuery\) \{[\s\S]*elements\.searchInput\.value = "";[\s\S]*\}/
  );
  assert.match(
    html,
    /const randomPool =[\s\S]*filteredClips\.length > 1[\s\S]*filteredClips\.filter\(\(candidate\) => candidate\.id !== lastRandomClipId\)[\s\S]*: filteredClips;/
  );
  assert.match(html, /lastRandomSearchValue = clip\.title;/);
  assert.match(html, /lastRandomClipId = clip\.id \?\? "";/);
  assert.doesNotMatch(
    pickRandomBlock,
    /scrollIntoView/,
    "random clicks must not move the viewport away from the random button"
  );
  assert.doesNotMatch(pickRandomBlock, /elements\.creatorFilter\.value = "";/);
  assert.doesNotMatch(pickRandomBlock, /elements\.gameFilter\.value = "";/);
  assert.doesNotMatch(pickRandomBlock, /elements\.sortSelect\.value = [^;]+;/);
  assert.match(html, /function handleSearchInputChange\(\) \{[\s\S]*clearRandomSelectionState\(\);[\s\S]*resetVisibleAndRender\(\);[\s\S]*\}/);
  assert.match(html, /elements\.searchInput\.addEventListener\("input", handleSearchInputChange\);/);
  assert.match(html, /elements\.creatorFilter\.addEventListener\("change", resetVisibleAndRender\);/);
  assert.match(html, /elements\.gameFilter\.addEventListener\("change", resetVisibleAndRender\);/);
  assert.match(html, /elements\.sortSelect\.addEventListener\("change", resetVisibleAndRender\);/);
  assert.match(html, /elements\.clearButton\.addEventListener\("click", \(\) => \{[\s\S]*clearRandomSelectionState\(\);/);
});

test("clip modal is desktop-only and lazy-loads Twitch embeds", () => {
  const html = readText("index.html");

  assert.match(html, /id="clipModal"/);
  assert.match(html, /class="clip-modal"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Twitch Clip"/);
  assert.match(html, /id="clipModalFrameWrap"/);
  assert.match(html, /id="clipModalClose"/);
  assert.doesNotMatch(html, /class="clip-modal-head"/);
  assert.doesNotMatch(html, /id="clipModalTitle"/);
  assert.doesNotMatch(html, /\.clip-modal-head\s*\{/);
  assert.doesNotMatch(html, /\.clip-modal-title\s*\{/);
  assert.match(
    html,
    /\.clip-modal-close\s*\{[\s\S]*position: fixed;[\s\S]*top: max\(16px, env\(safe-area-inset-top\)\);[\s\S]*right: max\(16px, env\(safe-area-inset-right\)\);[\s\S]*width: 64px;[\s\S]*height: 64px;[\s\S]*font-size: 2\.3rem;/
  );
  assert.match(html, /\.clip-modal\s*\{[\s\S]*display: none;/);
  assert.match(html, /\.clip-modal\.is-open\s*\{[\s\S]*display: grid;/);
  assert.match(html, /body\.has-clip-modal-open/);
  assert.doesNotMatch(html, /<iframe[^>]+clips\.twitch\.tv/i);

  assert.match(html, /clipModal: requireElement\("#clipModal"\)/);
  assert.doesNotMatch(html, /clipModalTitle: requireElement\("#clipModalTitle"\)/);
  assert.match(html, /clipModalFrameWrap: requireElement\("#clipModalFrameWrap"\)/);
  assert.match(html, /clipModalClose: requireElement\("#clipModalClose"\)/);
  assert.match(html, /const CLIP_MODAL_SMALL_VIEWPORT_QUERY = "\(max-width: 620px\)";/);
  assert.match(html, /const TWITCH_EMBED_PARENT_HOST = "www\.rukalun\.mydns\.jp";/);
  assert.match(html, /function isSmallViewport\(\) \{[\s\S]*window\.matchMedia\(CLIP_MODAL_SMALL_VIEWPORT_QUERY\)\.matches/);
  assert.match(html, /function getTwitchEmbedParents\(\) \{/);
  assert.match(html, /new Set\(\[TWITCH_EMBED_PARENT_HOST\]\)/);
  assert.match(html, /parents\.add\(window\.location\.hostname\);/);
  assert.match(html, /function getTwitchClipSlug\(url\) \{/);
  assert.match(html, /parsed\.hostname === "clips\.twitch\.tv"/);
  assert.match(html, /parsed\.hostname === "www\.twitch\.tv"/);
  assert.match(html, /parsed\.pathname\.split\("\/"\)\.filter\(Boolean\)/);
  assert.match(html, /const clipIndex = pathParts\.indexOf\("clip"\);/);
  assert.match(html, /return clipIndex > 0 \? pathParts\[clipIndex \+ 1\] \?\? "" : "";/);
  assert.match(html, /function toTwitchEmbedUrl\(clip\) \{/);
  assert.match(html, /const slug = getTwitchClipSlug\(clip\?\.url\);/);
  assert.match(html, /if \(!slug\) return null;/);
  assert.match(html, /new URL\("https:\/\/clips\.twitch\.tv\/embed"\)/);
  assert.match(html, /embedUrl\.searchParams\.set\("clip", slug\);/);
  assert.match(html, /embedUrl\.searchParams\.set\("autoplay", "true"\);/);
  assert.match(html, /embedUrl\.searchParams\.append\("parent", parent\);/);
  assert.match(html, /function shouldUseNativeClipLink\(event\) \{/);
  assert.match(
    html,
    /return isSmallViewport\(\) \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey \|\| event\.button !== 0;/
  );
  assert.doesNotMatch(html, /function openSafeClipLink\(clip\) \{/);
  assert.doesNotMatch(html, /window\.open\(getSafeClipUrl\(clip\), "_blank", "noopener,noreferrer"\);/);
  assert.match(html, /function openClipModal\(clip, embedUrl, trigger\) \{/);
  assert.match(html, /const iframe = document\.createElement\("iframe"\);/);
  assert.match(html, /iframe\.loading = "lazy";/);
  assert.match(html, /iframe\.allowFullscreen = true;/);
  assert.match(html, /iframe\.src = embedUrl;/);
  assert.match(html, /elements\.clipModalFrameWrap\.replaceChildren\(iframe\);/);
  assert.match(html, /elements\.clipModal\.classList\.add\("is-open"\);/);
  assert.match(html, /document\.body\.classList\.add\("has-clip-modal-open"\);/);
  assert.match(
    html,
    /lastClipModalTrigger =[\s\S]*trigger instanceof HTMLElement[\s\S]*\? trigger[\s\S]*: document\.activeElement instanceof HTMLElement[\s\S]*\? document\.activeElement[\s\S]*: null;/
  );
  assert.match(html, /function closeClipModal\(\) \{/);
  assert.match(html, /elements\.clipModalFrameWrap\.replaceChildren\(\);/);
  assert.doesNotMatch(html, /elements\.clipModalTitle/);
  assert.match(html, /document\.body\.classList\.remove\("has-clip-modal-open"\);/);
  assert.match(html, /lastClipModalTrigger\?\.focus\(\{ preventScroll: true \}\);/);
  assert.match(html, /function getClipModalFocusableElements\(\) \{/);
  assert.match(html, /elements\.clipModal\.querySelectorAll\("a\[href\], button, iframe, input, select, textarea, \[tabindex\]:not\(\[tabindex='-1'\]\)"\)/);
  assert.match(html, /function trapClipModalFocus\(event\) \{/);
  assert.match(html, /if \(event\.key !== "Tab" \|\| !elements\.clipModal\.classList\.contains\("is-open"\)\) return;/);
  assert.match(html, /const focusableElements = getClipModalFocusableElements\(\);/);
  assert.match(html, /event\.preventDefault\(\);/);
  assert.match(html, /lastElement\.focus\(\{ preventScroll: true \}\);/);
  assert.match(html, /firstElement\.focus\(\{ preventScroll: true \}\);/);
  assert.match(html, /function handleClipOpen\(event, clip\) \{[\s\S]*const embedUrl = toTwitchEmbedUrl\(clip\);[\s\S]*if \(!embedUrl \|\| shouldUseNativeClipLink\(event\)\) return;[\s\S]*event\.preventDefault\(\);[\s\S]*openClipModal\(clip, embedUrl, event\.currentTarget\);[\s\S]*\}/);
  assert.match(html, /function createClipAnchor\(clip, className, label\) \{[\s\S]*link\.addEventListener\("click", \(event\) => handleClipOpen\(event, clip\)\);[\s\S]*return link;[\s\S]*\}/);
  assert.match(html, /const thumbnail = createClipAnchor\(clip, "clip-thumbnail clip-thumbnail-link", "TwitchでClipを開く"\);/);
  assert.match(html, /const link = createClipAnchor\(clip, "clip-link", "Twitchで見る"\);/);
  assert.match(html, /elements\.clipModalClose\.addEventListener\("click", closeClipModal\);/);
  assert.match(html, /elements\.clipModal\.addEventListener\("click", \(event\) => \{[\s\S]*if \(event\.target === elements\.clipModal\) closeClipModal\(\);[\s\S]*\}\);/);
  assert.match(html, /window\.addEventListener\("keydown", \(event\) => \{[\s\S]*event\.key === "Escape"[\s\S]*closeClipModal\(\);[\s\S]*\}\);/);
  assert.match(html, /trapClipModalFocus\(event\);/);
});

test("clip card meta chips can apply creator and game filters", () => {
  const html = readText("index.html");
  const applyStart = html.indexOf("function applyMetaFilter(type, value)");
  const applyEnd = html.indexOf("function renderCard(clip)");
  assert.notEqual(applyStart, -1, "applyMetaFilter should exist");
  assert.ok(applyEnd > applyStart, "applyMetaFilter should be defined before renderCard");
  const applyBlock = html.slice(applyStart, applyEnd);
  const metaChipStyle = html.match(/\.meta-chip\s*\{([\s\S]*?)\n      \}/)?.[1] ?? "";

  assert.match(metaChipStyle, /appearance: none;/);
  assert.match(metaChipStyle, /border: 1px solid var\(--line\);/);
  assert.match(metaChipStyle, /text-align: left;/);
  assert.match(metaChipStyle, /cursor: pointer;/);
  assert.match(html, /\.meta-chip:not\(\.is-static\):hover/);
  assert.match(html, /\.meta-chip:not\(\.is-static\):focus-visible/);
  assert.match(html, /\.meta-chip\.is-static/);

  assert.match(applyBlock, /const filter = type === "creator" \? elements\.creatorFilter : elements\.gameFilter;/);
  assert.match(applyBlock, /filter\.value = value;/);
  assert.match(applyBlock, /clearRandomSelectionState\(\);/);
  assert.match(applyBlock, /setSearchPanelExpanded\(true\);/);
  assert.match(applyBlock, /resetVisibleAndRender\(\);/);
  assert.doesNotMatch(applyBlock, /elements\.searchInput\.value = "";/);
  assert.doesNotMatch(applyBlock, /elements\.sortSelect\.value = [^;]+;/);

  assert.match(html, /function createMetaFilterButton\(type, value, label\) \{/);
  assert.match(html, /const button = document\.createElement\("button"\);/);
  assert.match(html, /button\.className = `meta-chip meta-chip-\$\{type\}`;/);
  assert.match(html, /button\.type = "button";/);
  assert.match(html, /button\.textContent = label;/);
  assert.match(html, /button\.setAttribute\("aria-label", `\$\{label\}で絞り込む`\);/);
  assert.match(html, /button\.addEventListener\("click", \(\) => applyMetaFilter\(type, value\)\);/);
  assert.match(html, /function createStaticMetaChip\(type, label\) \{/);
  assert.match(html, /chip\.className = `meta-chip meta-chip-\$\{type\} is-static`;/);
  assert.match(
    html,
    /const creator = clip\.creator\s*\? createMetaFilterButton\("creator", clip\.creator, `作成: \$\{clip\.creator\}`\)\s*: createStaticMetaChip\("creator", "作成者不明"\);/
  );
  assert.match(
    html,
    /const game = clip\.gameName\s*\? createMetaFilterButton\("game", clip\.gameName, `ゲーム: \$\{clip\.gameName\}`\)\s*: createStaticMetaChip\("game", "ゲーム不明"\);/
  );
});

test("clip search data is minified to reduce network payload", () => {
  const rawData = readText("clip-search-data.json");
  const minifiedData = JSON.stringify(JSON.parse(rawData));

  assert.equal(rawData.trim(), minifiedData);
});

test("generated clip search data is hidden from noisy GitHub diffs", () => {
  const attributes = readText(".gitattributes");

  assert.match(attributes, /^clip-search-data\.json\s+linguist-generated=true\s+-diff$/m);
});
