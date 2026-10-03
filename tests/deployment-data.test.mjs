import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("clip data updates do not trigger deployments while site changes remain enabled", () => {
  const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  assert.equal(config.git?.deploymentEnabled?.["clip-data"], false);
  assert.notEqual(config.git.deploymentEnabled.main, false);
  assert.equal(config.git.deploymentEnabled["*"], undefined);
});

test("live data is proxied from the data branch without shadowing a bundled file", () => {
  const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const route = config.rewrites?.find((entry) => entry.source === "/live-clips.json");
  assert.equal(route?.destination,
    "https://raw.githubusercontent.com/jinwktk/RukalunPage/clip-data/clip-search-data.json");
  assert.equal(fs.existsSync(`.${route.source}`), false);
  assert.equal(config.ignoreCommand, undefined);
});
