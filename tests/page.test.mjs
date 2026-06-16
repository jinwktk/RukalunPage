import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoDir = process.cwd();
const displaySiteName = "🖇るっかるんくりっぷ🖇";
const structuredSiteName = "るっかるんくりっぷ";
const pageUrl = "https://www.rukalun.mydns.jp/";
const pageTitle = `${displaySiteName} | Twitch Clip検索`;
const gaMeasurementId = "G-TTVJN1V2LJ";
const gaScriptUrl = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
const kofiUsername = "jinnymeia";
const kofiWidgetScriptUrl = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
const faviconIcoUrl = `${pageUrl}assets/rukalun/clip-search-favicon.ico`;
const faviconPngUrl = `${pageUrl}assets/rukalun/clip-search-favicon.png`;
const appleTouchIconUrl = `${pageUrl}assets/rukalun/clip-search-apple-touch-icon.png`;
const seoDescription =
  "るっかるんのTwitch配信Clipを、タイトル・作成者・ゲーム名で探せる公開検索ページです。FF14、LoL、VALORANT、雑談の名場面を軽く回収できます。";
const dataUrl = `${pageUrl}clip-search-data.json`;
const googleVerificationFile = "googled9f512eea3a99dc1.html";

function readText(relativePath) {
  return fs.readFileSync(path.join(repoDir, relativePath), "utf8");
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

  assert.ok(html.includes(`<meta name="description" content="${seoDescription}" />`));
  assert.ok(html.includes(`<meta property="og:description" content="${seoDescription}" />`));
  assert.ok(html.includes(`<meta name="twitter:description" content="${seoDescription}" />`));
  assert.ok(html.includes(`<meta name="twitter:title" content="${pageTitle}" />`));
  assert.doesNotMatch(html, /<meta name="keywords"/);
  assert.match(html, /class="lead-line">FF14もLoLもVALOも、/);
  assert.match(html, /class="lead-line">タイトル・作成者・ゲームでそっと探して、/);
  assert.doesNotMatch(html, /id="clipSearchOverview"/);

  const structuredData = getStructuredData(html);
  assert.equal(structuredData["@context"], "https://schema.org");
  assert.ok(Array.isArray(structuredData["@graph"]), "JSON-LD should use @graph");

  const graph = structuredData["@graph"];
  const website = getGraphNode(graph, "WebSite");
  assert.equal(website.name, structuredSiteName);
  assert.deepEqual(website.alternateName, ["Rukalun Clip", "るっかるん Clip検索", "www.rukalun.mydns.jp"]);
  assert.equal(website.url, pageUrl);
  assert.equal(website.potentialAction["@type"], "SearchAction");
  assert.equal(website.potentialAction.target, `${pageUrl}?q={search_term_string}`);

  const page = getGraphNode(graph, "CollectionPage");
  assert.equal(page.name, pageTitle);
  assert.equal(page.description, seoDescription);
  assert.equal(page.url, pageUrl);
  assert.equal(page.mainEntity["@id"], `${pageUrl}#clipDataset`);
  assert.match(page.dateModified, /^\d{4}-\d{2}-\d{2}$/);

  const dataset = getGraphNode(graph, "Dataset");
  assert.equal(dataset["@id"], `${pageUrl}#clipDataset`);
  assert.equal(dataset.name, "るっかるん Twitch Clip公開データ");
  assert.equal(dataset.url, pageUrl);
  assert.match(dataset.description, /Twitch配信Clip/);
  assert.equal(dataset.publisher.name, structuredSiteName);
  assert.equal(dataset.distribution["@type"], "DataDownload");
  assert.equal(dataset.distribution.contentUrl, dataUrl);
  assert.equal(dataset.distribution.encodingFormat, "application/json");
  assert.equal(dataset.dateModified, undefined);
  assert.equal(dataset.measurementTechnique, "twitchRaid clip export");
  assert.equal(dataset.variableMeasured, "title, creator, gameName, createdAt, views");
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
  assert.match(html, /"floating-chat\.donateButton\.text": "応援"/);
  assert.match(html, /"floating-chat\.donateButton\.background-color": "#ffe8f0"/);
  assert.match(html, /"floating-chat\.donateButton\.text-color": "#2c2633"/);
  assert.match(
    html,
    /\.floatingchat-container-wrap,\s*\.floatingchat-container\s*\{[\s\S]*position: fixed !important;[\s\S]*right: 18px !important;[\s\S]*bottom: 18px !important;[\s\S]*z-index: 30 !important;/
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
  assert.match(readme, /SPでは文字なし/);
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
  assert.match(agents, /SPでは文字なし/);
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

test("clip search data is minified to reduce network payload", () => {
  const rawData = readText("clip-search-data.json");
  const minifiedData = JSON.stringify(JSON.parse(rawData));

  assert.equal(rawData.trim(), minifiedData);
});

test("generated clip search data is hidden from noisy GitHub diffs", () => {
  const attributes = readText(".gitattributes");

  assert.match(attributes, /^clip-search-data\.json\s+linguist-generated=true\s+-diff$/m);
});
