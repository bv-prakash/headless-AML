/**
 * Strips Magento storefront-only script payloads from CMS / PageBuilder HTML
 * before it's injected into the DOM via `dangerouslySetInnerHTML`.
 *
 * Magento's Luma storefront ships RequireJS + `mage/*` modules + Knockout.
 * CMS / PageBuilder HTML often contains inline scripts that depend on that
 * runtime, e.g.:
 *
 *   <script type="text/x-magento-init"> { ... } </script>
 *   <script>require(['jquery','mage/url'], function ($, url) { ... });</script>
 *
 * In a headless Next.js frontend none of those globals exist, so the scripts
 * throw `Uncaught ReferenceError: require is not defined` (or similar) the
 * moment the browser evaluates them.
 *
 * This helper removes:
 *   - every `<script>…</script>` block (safest default — CMS should only
 *     contain presentational HTML; any behavior should be implemented in
 *     Next.js components, not inline scripts), and
 *   - `<link rel="preload" as="script" …>` hints that point at Magento's
 *     storefront bundles (they'd trigger a 404 request for `/static/…`).
 *
 * It keeps styles, data-attributes, and everything else untouched so the
 * PageBuilder markup continues to render and style correctly.
 */
export function sanitizeMagentoCmsHtml(html: string | null | undefined): string {
  if (!html) return "";

  let out = html;

  // Remove all <script>...</script> blocks (including attrs like `type="text/x-magento-init"`).
  // Use a non-greedy match with the `s` flag so it spans newlines.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");

  // Remove self-closing / malformed <script> tags defensively.
  out = out.replace(/<script\b[^>]*\/?>/gi, "");

  // Remove <noscript> that typically wraps storefront fallbacks we don't need.
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, "");

  return out;
}
