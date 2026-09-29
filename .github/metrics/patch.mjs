import {readFileSync, writeFileSync} from "node:fs";

// Fail the build if upstream changes, rather than silently shipping an unpatched image.
function replace(path, before, after) {
  const source = readFileSync(path, "utf8");
  if (source.split(before).length !== 2)
    throw new Error(`Expected exactly one compatibility patch target in ${path}`);
  writeFileSync(path, source.replace(before, after));
}

// Keep the response alias used by the achievement renderer. Only request the
// count, so reading project details does not require additional token scopes.
replace(
  "/metrics/source/plugins/achievements/queries/achievements.graphql",
  "projects(first:",
  "projects: projectsV2(first:",
);

// Recent PushEvents can omit commits; older events can contain null entries.
// Day/hour charts still use the events; patch-based facts use available commits.
replace(
  "/metrics/source/plugins/habits/index.mjs",
  ".flatMap(({payload}) => payload.commits)",
  ".flatMap(({payload}) => payload?.commits ?? [])\n          .filter(commit => commit?.author)",
);

// Habits invokes the recent-language analyzer when any patches are available.
// It must also tolerate a mixture of legacy and modern events.
replace(
  "/metrics/source/plugins/languages/analyzer/recent.mjs",
  ".flatMap(({payload}) => payload.commits)",
  ".flatMap(({payload}) => payload?.commits ?? [])\n          .filter(commit => commit != null)",
);
