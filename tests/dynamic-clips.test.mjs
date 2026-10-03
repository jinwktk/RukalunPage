import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  classifyClipDataChange,
  createVisibleDataPoller,
  loadClipData,
} from "../assets/clip-data-refresh.js";

const repoDir = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(repoDir, relativePath), "utf8");
}

function createFakeDocument() {
  const listeners = new Set();
  return {
    visibilityState: "visible",
    addEventListener(type, listener) {
      if (type === "visibilitychange") listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === "visibilitychange") listeners.delete(listener);
    },
    dispatchVisibilityChange() {
      for (const listener of listeners) listener();
    },
  };
}

function createFakeTimers() {
  let nextId = 1;
  const scheduled = new Map();
  return {
    scheduled,
    setTimeout(callback, delay) {
      const id = nextId;
      nextId += 1;
      scheduled.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      scheduled.delete(id);
    },
  };
}

test("clip payload comparison separates view-only updates from content changes", () => {
  const current = [
    {
      id: "clip-1",
      title: "同じClip",
      creator: "Alice",
      gameName: "FF14",
      views: 10,
      searchText: "old local cache",
    },
  ];

  assert.equal(
    classifyClipDataChange(current, [
      { ...current[0], searchText: "new local cache" },
    ]),
    "none"
  );
  assert.equal(
    classifyClipDataChange(current, [{ ...current[0], views: 11 }]),
    "views"
  );
  assert.equal(
    classifyClipDataChange(current, [{ ...current[0], title: "更新後のClip" }]),
    "content"
  );
  assert.equal(
    classifyClipDataChange(current, [...current, { ...current[0], id: "clip-2" }]),
    "content"
  );
  assert.equal(classifyClipDataChange(current, []), "content");
});

test("visible poller pauses while hidden, refreshes on return, and deduplicates fetches", async () => {
  const documentObject = createFakeDocument();
  const timerObject = createFakeTimers();
  const pending = [];
  let refreshCount = 0;
  const poller = createVisibleDataPoller({
    documentObject,
    timerObject,
    intervalMs: 60000,
    refresh() {
      refreshCount += 1;
      return new Promise((resolve) => pending.push(resolve));
    },
  });

  poller.start();
  assert.deepEqual(
    Array.from(timerObject.scheduled.values(), ({ delay }) => delay),
    [60000]
  );

  documentObject.visibilityState = "hidden";
  documentObject.dispatchVisibilityChange();
  assert.equal(timerObject.scheduled.size, 0);

  documentObject.visibilityState = "visible";
  documentObject.dispatchVisibilityChange();
  await Promise.resolve();
  assert.equal(refreshCount, 1);
  const firstRefresh = poller.refreshNow();
  const duplicateRefresh = poller.refreshNow();
  assert.strictEqual(firstRefresh, duplicateRefresh);
  assert.equal(refreshCount, 1);

  pending.shift()();
  await firstRefresh;
  assert.deepEqual(
    Array.from(timerObject.scheduled.values(), ({ delay }) => delay),
    [60000]
  );

  poller.stop();
  assert.equal(timerObject.scheduled.size, 0);
});

test("live clip loading revalidates and falls back only for the initial request", async () => {
  const requests = [];
  const fallbackClip = {
    id: "fallback",
    url: "https://www.twitch.tv/rukalun/clip/fallback",
    title: "Fallback Clip",
    creator: "Alice",
    gameName: null,
    thumbnailUrl: null,
    createdAt: null,
    views: null,
  };
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    if (url === "/live-clips.json") return { ok: false, status: 502 };
    return {
      ok: true,
      async json() {
        return { clips: [fallbackClip] };
      },
    };
  };

  const data = await loadClipData({
    liveUrl: "/live-clips.json",
    fallbackUrl: "clip-search-data.json",
    fetchImpl,
  });

  assert.deepEqual(data, { clips: [fallbackClip] });
  assert.deepEqual(requests, [
    { url: "/live-clips.json", options: { cache: "no-cache" } },
    { url: "clip-search-data.json", options: { cache: "no-cache" } },
  ]);

  await assert.rejects(
    loadClipData({ liveUrl: "/live-clips.json", fetchImpl }),
    /HTTP 502/
  );

  const invalidLiveData = async (url) => ({
    ok: true,
    status: 200,
    async json() {
      return url === "/live-clips.json" ? { generatedAt: "broken" } : { clips: [] };
    },
  });
  assert.deepEqual(
    await loadClipData({
      liveUrl: "/live-clips.json",
      fallbackUrl: "clip-search-data.json",
      fetchImpl: invalidLiveData,
    }),
    { clips: [] }
  );
  await assert.rejects(
    loadClipData({ liveUrl: "/live-clips.json", fetchImpl: invalidLiveData }),
    /Invalid clip data/
  );
});

test("clip loading rejects malformed clip entries while keeping nullable export fields", async () => {
  const validClip = {
    id: "clip-1",
    url: "https://www.twitch.tv/rukalun/clip/clip-1",
    title: "正常なClip",
    creator: "Alice",
    gameName: null,
    thumbnailUrl: null,
    createdAt: null,
    views: null,
  };
  const responseFor = (data) => async () => ({
    ok: true,
    status: 200,
    async json() {
      return data;
    },
  });

  assert.deepEqual(
    await loadClipData({
      liveUrl: "/live-clips.json",
      fetchImpl: responseFor({ clips: [validClip] }),
    }),
    { clips: [validClip] }
  );

  for (const invalidClip of [
    null,
    { ...validClip, gameName: {} },
    { ...validClip, thumbnailUrl: 123 },
    { ...validClip, createdAt: {} },
    { ...validClip, views: Number.POSITIVE_INFINITY },
    { ...validClip, id: null },
    { ...validClip, url: {} },
    { ...validClip, title: null },
    { ...validClip, creator: [] },
  ]) {
    await assert.rejects(
      loadClipData({
        liveUrl: "/live-clips.json",
        fetchImpl: responseFor({ clips: [invalidClip] }),
      }),
      /Invalid clip data/
    );
  }

  const fallbackData = { clips: [validClip] };
  let requestCount = 0;
  const invalidThenFallback = async () => ({
    ok: true,
    status: 200,
    async json() {
      requestCount += 1;
      return requestCount === 1 ? { clips: [null] } : fallbackData;
    },
  });
  assert.deepEqual(
    await loadClipData({
      liveUrl: "/live-clips.json",
      fallbackUrl: "clip-search-data.json",
      fetchImpl: invalidThenFallback,
    }),
    fallbackData
  );
});

test("clip search refreshes dynamic data without discarding the current UI on failure", () => {
  const html = readText("index.html");
  const refreshStart = html.indexOf("async function refreshData(isInitialLoad)");
  const refreshEnd = html.indexOf("async function loadData()", refreshStart);
  assert.notEqual(refreshStart, -1);
  assert.ok(refreshEnd > refreshStart);
  const refreshBlock = html.slice(refreshStart, refreshEnd);

  assert.match(html, /const LIVE_DATA_URL = "\/live-clips\.json";/);
  assert.match(html, /const DATA_REFRESH_INTERVAL_MS = 60000;/);
  assert.match(html, /loadClipData\(\{[\s\S]*liveUrl: LIVE_DATA_URL,[\s\S]*fallbackUrl: isInitialLoad \? DATA_URL : null/);
  assert.match(html, /classifyClipDataChange\(allClips, nextClips\)/);
  assert.match(html, /createVisibleDataPoller\(\{/);
  assert.match(html, /documentObject: document/);
  assert.match(html, /refresh: \(\) => refreshData\(false\)/);
  assert.match(html, /if \(!isInitialLoad\) return;/);
  assert.match(refreshBlock, /const shouldFlushSearchAnalytics = isInitialLoad \|\| dataLoadState !== "loaded";/);
  assert.match(refreshBlock, /updateClipSyncTime\(data\);[\s\S]*if \(changeType === "none"\) return;/);
  assert.match(html, /function updateVisibleClipViews\(\)/);
  assert.match(html, /elements\.sortSelect\.value !== "views"/);
  assert.match(html, /getPopularPeriodMs\(elements\.sortSelect\.value\) === null/);
  assert.match(html, /className = "clip-view-count";/);
  assert.match(html, /card\.dataset\.clipId = clip\.id;/);
  assert.match(html, /function captureCardControlState\(element\)/);
  assert.match(html, /function restoreCardControlState\(state, \{ focus = false \} = \{\}\)/);
  assert.match(html, /const focusedControlState = captureCardControlState\(document\.activeElement\);/);
  assert.match(html, /const modalTriggerState = captureCardControlState\(lastClipModalTrigger\);/);
  assert.match(html, /restoreCardControlState\(focusedControlState, \{ focus: true \}\);/);
  assert.match(html, /lastClipModalTrigger = restoreCardControlState\(modalTriggerState\);/);
  assert.match(html, /const selectedCreator = elements\.creatorFilter\.value;/);
  assert.match(html, /const selectedGame = elements\.gameFilter\.value;/);
  assert.match(html, /option\.textContent = `\$\{selectedCreator\} \(0\)`;/);
  assert.match(html, /option\.textContent = `\$\{selectedGame\} \(0\)`;/);
  assert.match(refreshBlock, /if \(shouldFlushSearchAnalytics\) flushPendingSearchAnalytics\(\);/);
  assert.doesNotMatch(refreshBlock, /visibleLimit\s*=/);
  assert.doesNotMatch(refreshBlock, /searchInput\.value\s*=/);
  assert.match(html, /dataPoller\.start\(\);/);
  assert.match(html, /async function loadData\(\)/);
  assert.match(html, /function scheduleDataLoad\(\)/);
});

test("RukaShorts fetches the latest dynamic JSON once without polling the playing pool", () => {
  const html = readText("shorts/index.html");

  assert.match(html, /const LIVE_DATA_PATH = "\/live-clips\.json";/);
  assert.match(html, /loadClipData\(\{ liveUrl: LIVE_DATA_PATH, fallbackUrl: DATA_PATH \}\)/);
  assert.doesNotMatch(html, /createVisibleDataPoller|setInterval|visibilitychange/);
  assert.equal((html.match(/loadShortsData\(\);/g) ?? []).length, 1);
});
