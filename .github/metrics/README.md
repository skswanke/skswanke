The upstream Metrics v3.34 image predates two GitHub API changes: retirement of
Projects Classic and PushEvents without embedded commits. `patch.mjs` adapts the
two affected plugins without changing their renderers or using a third-party fork.
The image digest and action commit are pinned together.

The achievements and habits jobs build this small layer as `metrics:3.34.0`.
`use_prebuilt_image: no` tells the pinned upstream action to use that local image
instead of pulling the unpatched registry tag. Keep the image tag in sync with
the version in the upstream action's `package.json` when upgrading.

Habits still computes activity charts from push events. Patch-based facts and
recent-language analysis are available only when the events include commit data.
The Projects V2 query retains the `projects` alias expected by the renderer and
requests only `totalCount`.

All jobs use `plugins_errors_fatal: yes`, so plugin failures fail the run before
an error card can replace a working SVG. The next successful run after merging
regenerates the existing card files.

Local verification (Docker required):

```sh
docker build --platform linux/amd64 -t metrics:3.34.0 .github/metrics
docker run --rm --platform linux/amd64 --entrypoint node \
  -v "$PWD/.github/metrics/test.mjs:/tmp/test.mjs:ro" \
  metrics:3.34.0 /tmp/test.mjs
```
