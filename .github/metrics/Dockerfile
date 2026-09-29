# The same v3.34 image used by lowlighter/metrics@6583672, with API compatibility fixes.
FROM ghcr.io/lowlighter/metrics@sha256:257392f90340f916cb8b815026f259399f6b246d3eb7de38b58bfe7a07bd5b65
COPY patch.mjs /tmp/patch-metrics.mjs
RUN node /tmp/patch-metrics.mjs && rm /tmp/patch-metrics.mjs
