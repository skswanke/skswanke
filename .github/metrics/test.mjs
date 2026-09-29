import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import habits from "/metrics/source/plugins/habits/index.mjs";
import {RecentAnalyzer} from "/metrics/source/plugins/languages/analyzer/recent.mjs";

const event = payload => ({
  type: "PushEvent", actor: {login: "skswanke"},
  repo: {name: "skswanke/example"}, created_at: new Date().toISOString(), payload,
});
const commit = {author: {name: "skswanke"}, url: "/repos/skswanke/example/commits/abc"};

for (const [name, payloads, expectedRequests] of [
  ["modern events without commits", [{}, {commits: null}], 0],
  ["legacy commits and null entries", [{commits: [null, commit, undefined, {}]}], 1],
  ["mixed events", [{}, {commits: [commit]}, {commits: null}], 1],
  ["no recent events", [], 0],
]) {
  let requests = 0;
  const result = await habits({
    login: "skswanke", account: "user", q: {habits: true},
    data: {config: {timezone: {offset: 0}}, shared: {
      "repositories.skipped": [], "commits.authoring": ["skswanke"],
    }},
    rest: {
      activity: {listEventsForAuthenticatedUser: async () => ({data: payloads.map(event)})},
      request: async () => {
        requests++;
        return {data: {files: [{filename: "example.js", patch: "+  example()"}]}};
      },
    },
    imports: {
      metadata: {plugins: {habits: {
        enabled: () => true, extras: () => false,
        inputs: () => ({from: 100, days: 14, facts: true, charts: true,
          "charts.type": "classic", trim: true,
          "languages.limit": 8, "languages.threshold": "0%"}),
      }}},
      filters: {repo: () => true}, paths: {basename: path => path.split("/").pop()},
      format: {error: error => error},
    },
  });
  assert.equal(requests, expectedRequests, name);
  assert.equal(result.commits.fetched, payloads.length, name);
  const total = counts => Object.entries(counts)
    .filter(([key]) => key !== "max").reduce((sum, [, count]) => sum + count, 0);
  assert.equal(total(result.commits.days), payloads.length, name);
  assert.equal(total(result.commits.hours), payloads.length, name);
  if (expectedRequests) assert.equal(result.lines.average.chars, 11, name);
  console.log(`PASS: ${name}`);
}

let languageRequests = 0;
const patches = await RecentAnalyzer.prototype.patches.call({
  debug: () => {}, days: 14, load: 100, context: {mode: "user"},
  login: "skswanke", account: "user", results: {}, authoring: [],
  ignore: () => false,
  rest: {
    activity: {listEventsForAuthenticatedUser: async () => ({data: [
      event({}), event({commits: null}), event({commits: [null, commit]}),
    ]})},
    request: async () => {
      languageRequests++;
      return {data: {parents: [], sha: "abc", files: [],
        commit: {message: "Example", committer: {name: "skswanke", date: "2026-09-29"}}}};
    },
  },
});
assert.equal(languageRequests, 1);
assert.equal(patches.length, 1);
assert.equal(patches[0].sha, "abc");
console.log("PASS: recent-language analysis accepts mixed events");

const query = readFileSync("/metrics/source/plugins/achievements/queries/achievements.graphql", "utf8");
assert.match(query, /projects: projectsV2\(first:/);
assert.doesNotMatch(query, /\bprojects\(/);
console.log("PASS: achievements uses Projects V2 with the renderer's existing alias");
