function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableJson(value[key])])
    );
  }
  return value;
}

function comparableClips(clips, includeViews) {
  return clips.map((clip) =>
    Object.fromEntries(
      Object.entries(clip).filter(
        ([key]) => key !== "searchText" && (includeViews || key !== "views")
      )
    )
  );
}

export function classifyClipDataChange(currentClips, nextClips) {
  if (!Array.isArray(currentClips) || !Array.isArray(nextClips)) return "content";

  const currentContent = stableJson(comparableClips(currentClips, false));
  const nextContent = stableJson(comparableClips(nextClips, false));
  if (JSON.stringify(currentContent) !== JSON.stringify(nextContent)) {
    return "content";
  }

  const currentWithViews = stableJson(comparableClips(currentClips, true));
  const nextWithViews = stableJson(comparableClips(nextClips, true));
  return JSON.stringify(currentWithViews) === JSON.stringify(nextWithViews)
    ? "none"
    : "views";
}

async function fetchClipData(url, fetchImpl) {
  const response = await fetchImpl(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const isNullableString = (value) => value === null || typeof value === "string";
  const hasValidClips =
    Array.isArray(data?.clips) &&
    data.clips.every(
      (clip) =>
        clip &&
        typeof clip === "object" &&
        !Array.isArray(clip) &&
        typeof clip.id === "string" &&
        typeof clip.url === "string" &&
        typeof clip.title === "string" &&
        typeof clip.creator === "string" &&
        isNullableString(clip.gameName) &&
        isNullableString(clip.thumbnailUrl) &&
        isNullableString(clip.createdAt) &&
        (clip.views === null || Number.isFinite(clip.views))
    );
  if (!data || typeof data !== "object" || !hasValidClips) {
    throw new Error("Invalid clip data");
  }
  return data;
}

export async function loadClipData({
  liveUrl,
  fallbackUrl = null,
  fetchImpl = globalThis.fetch,
}) {
  try {
    return await fetchClipData(liveUrl, fetchImpl);
  } catch (error) {
    if (!fallbackUrl) throw error;
    return fetchClipData(fallbackUrl, fetchImpl);
  }
}

export function createVisibleDataPoller({
  refresh,
  intervalMs,
  documentObject = document,
  timerObject = window,
}) {
  let started = false;
  let timeoutId = null;
  let refreshPromise = null;

  function clearTimer() {
    if (timeoutId === null) return;
    timerObject.clearTimeout(timeoutId);
    timeoutId = null;
  }

  function schedule() {
    clearTimer();
    if (!started || documentObject.visibilityState !== "visible") return;
    timeoutId = timerObject.setTimeout(() => {
      timeoutId = null;
      refreshNow();
    }, intervalMs);
  }

  function refreshNow() {
    if (!started || documentObject.visibilityState !== "visible") {
      return refreshPromise ?? Promise.resolve();
    }
    if (refreshPromise) return refreshPromise;

    clearTimer();
    refreshPromise = Promise.resolve()
      .then(refresh)
      .finally(() => {
        refreshPromise = null;
        schedule();
      });
    return refreshPromise;
  }

  function handleVisibilityChange() {
    if (documentObject.visibilityState === "visible") {
      refreshNow();
      return;
    }
    clearTimer();
  }

  return {
    start() {
      if (started) return;
      started = true;
      documentObject.addEventListener("visibilitychange", handleVisibilityChange);
      schedule();
    },
    stop() {
      if (!started) return;
      started = false;
      clearTimer();
      documentObject.removeEventListener("visibilitychange", handleVisibilityChange);
    },
    refreshNow,
  };
}
