# Ochil Hills Management — Website Audit

**Auditor:** Senior website design review (read-only — no changes made to the live site)
**Date:** June 9, 2026
**Scope:** All 31 pages (homepage, 9 subpages, 20 blog articles, sitemap, robots, CSS, JS, 18 images)
**Breakpoints inspected:** ≤480px (small mobile), 481–768px (tablet), 769–1024px (small desktop), >1024px (desktop)

---

## Executive Summary

This is a well-built static site with a coherent design system, disciplined content strategy, and unusually strong schema/GEO foundations for a firm this size. The single H1-per-page discipline, FAQPage/Article schema coverage, answer capsules, and 20-article content cluster are genuinely above average.

The biggest problems are concentrated in four areas:

1. **Image weight** — several multi-hundred-KB to 1.4 MB images are served for tiny display sizes. This is the dominant performance problem on every page.
2. **Social sharing is broken sitewide** — every `og:image` uses a relative path, which social platforms cannot resolve. Every share of every page renders without an image.
3. **A privacy leak** — `kylie-kaiser-real.jpg` ships with full iPhone EXIF metadata **including GPS coordinates** of where the photo was taken.
4. **Local SEO is absent** — no address, city, phone, or service-area anywhere on the site or in schema. For a Washington-state firm targeting SMBs, this forfeits the entire local/maps channel.

There is also one functional bug (duplicate contact-form submit handlers), a header overflow risk at the 769–1024px breakpoint, and a set of accessibility and consistency fixes detailed below.

**Overall grades**

| Category | Grade | Notes |
|---|---|---|
| Technical | B− | Valid structure mostly; unclosed tags, charset placement, duplicate handlers |
| Performance | C | Image weight is severe; everything else is reasonably lean |
| Responsive design | B | 480/768 handled well; 769–1024px header is the weak point |
| Accessibility | B− | Good bones; ARIA states never updated, contrast failures on accent text |
| SEO (on-page) | A− | Strong fundamentals; og:image broken, www/non-www inconsistency |
| Local SEO ("geo") | D | No NAP, no address in schema, no service area, no GBP signals |
| GEO (AI/answer engines) | B+ | Answer capsules + FAQ schema are excellent; missing sameAs/entity reinforcement |
| Aesthetics / UX | B+ | Cohesive, distinctive brand; palette sprawl and inline-style drift |

---

## 1. Critical Issues (fix first)

### 1.1 EXIF GPS data in team photo (privacy) — `images/kylie-kaiser-real.jpg`
The file contains full Apple EXIF metadata: device (`iPhone 13 Pro`), capture date (`2024-05-04`), software version, and **GPS coordinates**. If this photo was taken at or near the founders' home, the home location is publicly downloadable from the website. It is also 968 KB at 1492×2157 px while displayed at ~280px wide.

**Recommendation:** Re-export the image with metadata stripped (`exiftool -all= kylie-kaiser-real.jpg` or re-save through an editor), resize to ~600px wide, and serve as WebP (~40–60 KB). Verify no other uploaded photos carry EXIF (matt-kaiser-real.jpg is clean).

### 1.2 `og:image` is relative on every page (social sharing broken sitewide)
Open Graph and Twitter Card images **must be absolute URLs**. Currently:

```html
<meta property="og:image" content="images/hero-home.webp">          <!-- index -->
<meta property="og:image" content="../images/hero-about.webp">      <!-- subpages/blog -->
```

Facebook, LinkedIn, X, Slack, iMessage, etc. will not resolve these — every share of every one of the 31 pages renders with no preview image. For a firm whose founders actively use LinkedIn, this is a meaningful lost channel.

**Recommendation:** Use absolute URLs (`https://ochilmanagement.com/images/hero-home.webp`) on all pages, add `og:image:width`/`og:image:height` (1200×630 recommended — consider a purpose-made branded share card rather than the hero landscape, which crops unpredictably).

### 1.3 Oversized images (performance, every page)

| File | Size | Dimensions | Displayed at | Verdict |
|---|---|---|---|---|
| `civichire-logo.png` | **1.4 MB** | 1024×1024 | 40px tall | ~99.9% wasted — resize to ~160px, ~10 KB |
| `heather.jpg` (homepage parallax) | **1.2 MB** | 3879×2573 | full-width band, 300px tall | Resize/compress to ≤200 KB WebP |
| `kylie-kaiser-real.jpg` | 968 KB | 1492×2157 | ~280px wide | See 1.1 |
| `waterfall.jpg` (services/about parallax) | 576 KB | 1280×853 | 300px band | Compress to ~120 KB WebP |
| `hero-*.webp` (4 files) | 304–428 KB | 2752×1536 | full viewport | Acceptable size for desktop but needs responsive variants for mobile |
| `logo.png` (header+footer, **all 31 pages**) | 240 KB | 570×427 | 48px tall | Highest-leverage fix on the site: resize to 96–144px PNG (~8 KB) or convert to SVG |
| `mckinley-logo.png` | 92 KB | 456×458 | 40px tall | Resize, ~8 KB |

A first-time homepage visit on mobile downloads roughly **2 MB of images** (hero 304 KB + heather 1.2 MB + logo 240 KB ×1 + team photos ~1 MB lazy). On a 4G connection this directly hurts LCP and the bounce rate of exactly the time-poor founder audience the site targets.

**Recommendations:**
- Resize every image to ≤2× its largest rendered size; convert JPEG/PNG photography to WebP (or AVIF with WebP fallback).
- Add `srcset`/`sizes` to hero images (e.g., 768w / 1280w / 1920w / 2752w variants).
- Add `fetchpriority="high"` to the hero `<img>` and `<link rel="preload" as="image">` for it (it is the LCP element on every page).
- `heather.jpg` is a CSS `background-image`, so it can't lazy-load natively — either swap to an `<img>` inside the band (like `.visual-break img` already supports) with `loading="lazy"`, or serve a small mobile variant via a media-queried background.
- Delete unused files from the deploy: `boardwalk.jpg` (332 KB), `divider-hills.webp` (304 KB), `hero-original.jpg` (408 KB), `kylie-kaiser.webp` (208 KB), `matt-kaiser.webp` (204 KB) — ~1.4 MB of dead weight in the repo, and a stale-asset trap.

### 1.4 Duplicate contact-form submit handlers (functional bug)
The contact form (`pages/contact.html`) has **two** competing submit listeners:

1. `js/main.js:121-142` targets `.contact-form`, prevents default, and shows a **fake success state** ("Message Received — We'll Be in Touch!") then resets the form after 3 seconds — regardless of whether anything was sent.
2. The inline script at the bottom of contact.html targets `#contact-form` and performs the real Web3Forms AJAX submission.

Both fire on every submit. The user sees the button text fight between "Message Received…" and "Sending…", and `form.reset()` from handler #1 fires 3 seconds in even if the real submission failed — wiping the user's message and masking the error state. 

**Recommendation:** Delete the legacy handler in `main.js` (the AJAX handler supersedes it). While there: the "Protected by reCAPTCHA" badge is misleading — no reCAPTCHA script is loaded (spam protection is Web3Forms' honeypot `botcheck`). Either enable Web3Forms' actual captcha or remove the badge; displaying Google's badge without the service arguably violates Google's branding terms and erodes trust if noticed.

### 1.5 No favicon (every page, every browser tab)
There is no favicon, `apple-touch-icon`, or web manifest anywhere on the site. Browsers show a generic globe in tabs/bookmarks; Google now displays favicons in mobile SERPs, where the site will show a blank placeholder.

**Recommendation:** Generate a favicon set from the logo (at minimum `favicon.ico` in root + `<link rel="icon" type="image/svg+xml">` + 180px `apple-touch-icon`).

---

## 2. Technical Audit

### 2.1 HTML validity & document structure
- **Unclosed `<picture>` tags** in `index.html` (hero) and `pages/services.html` (hero) — the `<source>`+`<img>` are followed by `</div>` with no `</picture>`. Browsers recover, but it's invalid HTML and fragile.
- **`<picture>` elements are pointless as written** — the `<source>` and the fallback `<img>` reference the *same* `.webp` file. There is no fallback format. Either remove the `<picture>` wrapper entirely or make the `<img>` point at a JPEG fallback.
- **`<meta charset>` appears ~4.5 KB into `<head>`.** The HTML spec requires the charset declaration within the first 1024 bytes. Two large inline scripts (GA4 + custom tracking) precede it on every page. Move `<meta charset>`, `<meta viewport>`, and `<title>` to the top of `<head>`.
- **~4.6 KB of analytics JS is duplicated inline across 24 pages** (and 7 newer blog posts are missing it — see §8). Extract to `/js/analytics.js`, include everywhere, fix once.
- No `<noscript>` fallbacks anywhere; acceptable for this site since content renders without JS (animations use JS-set inline opacity, so no-JS users still see content — good defensive pattern).
- Headings are well-structured: exactly one `<h1>` per page across all 31 pages, logical h2→h3 nesting. Excellent.

### 2.2 URL & canonicalization consistency
- Canonical tags consistently use **non-www, extensionless** URLs (`https://ochilmanagement.com/pages/services`) — good, and the sitemap matches.
- But the **Organization schema, `og:url` on the homepage, blog publisher URLs, and `mainEntityOfPage` all use `https://www.ochilmanagement.com`** — and two blog posts' `mainEntityOfPage` even append `.html`. Search engines treat www and non-www as different entities; this dilutes the knowledge-graph reconciliation the schema is otherwise doing well.
- **Recommendation:** Pick non-www (matches canonicals/sitemap) and use it in *every* schema URL, og:url, and mainEntityOfPage. Confirm the host 301-redirects www→non-www and `.html`→extensionless.
- Extensionless internal links (`pages/services`) require the host to resolve them to `.html` files. This works on GitHub Pages/Cloudflare Pages/Netlify, but verify there's exactly one canonical response (the `.html` variant should 301 to extensionless, not serve duplicate 200s).

### 2.3 Repo/deploy hygiene
- No custom 404 page. Add `404.html` with the site header/nav — broken inbound links currently get the host's default error.
- No `_headers`/`netlify.toml`/`.htaccess` in repo — caching, HSTS, `X-Content-Type-Options`, CSP, and redirect rules are presumably host-defaults. Worth defining explicitly (especially long-lived cache headers for `/images`, `/css`, `/js`).
- `js/main.js` registers `scroll` listeners without `{passive: true}`; scroll-depth listener never unbinds after 100%. Minor, cheap fix.
- Scroll-depth calculation divides by `(scrollHeight - innerHeight)`, which is 0/negative on short pages → `Infinity` fires all four events instantly on pages like Contact. Guard it.

---

## 3. Performance Audit

Beyond images (§1.3):

- **Fonts:** Two render-blocking stylesheets (Fontshare Zodiak + Google Work Sans). `preconnect` exists for Google but **not for `api.fontshare.com` or `cdn.fontshare.com`** — add both. Both load 8 font weights total; the CSS only uses 300–700 of Work Sans sparingly. Trimming to Work Sans 400/500/600 + Zodiak 400/500 would cut font payload ~35%. Consider self-hosting both families with `font-display: swap` for full control.
- **No `width`/`height` attributes on any `<img>` sitewide** (23 imgs on index alone). Hero images are absolutely positioned (no CLS), but team photos, bios, portfolio logos, and the footer badge all cause layout shift as they load. Add intrinsic dimensions everywhere.
- **CSS** (51 KB unminified, single file) is fine for this scale; minification would save ~15 KB. No unused-framework bloat — genuinely hand-rolled and lean. Good.
- **LCP risk:** hero image is `loading="eager"` (correct) but discovered late (after two font stylesheets and 4.5 KB of inline JS). Preload + fetchpriority (§1.3) plus moving charset/meta up will measurably improve LCP.
- **GA4 inline tracking runs `querySelectorAll` over the whole DOM seven times on DOMContentLoaded** on every page — negligible on this DOM size, but consolidating into the shared file (§2.1) keeps it maintainable.

---

## 4. Responsive / Breakpoint Review

**≤480px (small mobile)** — Well handled. Dedicated query stacks all grids to one column, full-width CTAs, hero heights relaxed (`hero--full: auto`), form rows collapse, journey arrows rotate 90°. Parallax correctly downgraded to `scroll` attachment. Mobile nav overlay uses `100dvh` with `100vh` fallback — correct modern approach. Body scroll locked while menu open — good.

**481–768px (tablet)** — Solid. Grids collapse appropriately; `.split` stacks; portfolio stats stay 2-up. One nit: service cards go single-column at 768px even though two columns fit comfortably at ~700px — a `repeat(2, 1fr)` between 600–768px would reduce scroll length on the busiest pages.

**769–1024px (small desktop) — the weak breakpoint:**
- The header keeps the full 6-item nav **plus** "Client Login" **plus** "Schedule Call" buttons (mobile toggle only activates ≤768px). At 769–900px viewports the inner header (logo + text + 6 links + 2 buttons, `white-space: nowrap` on buttons) will overflow or wrap awkwardly. **Recommendation:** either move the hamburger breakpoint up to ~900px, or hide "Client Login" below 1024px (it already exists inside the mobile menu).
- `background-attachment: fixed` (parallax bands) is only disabled ≤768px, but iPads and Android tablets report 769–1024px widths and Safari/iOS renders fixed backgrounds broken or janky. Switch the override to a hover/pointer media query: `@media (hover: none) { .visual-break--parallax { background-attachment: scroll; } }`.

**General:**
- `body { overflow-x: hidden }` at ≤768px is a band-aid that can mask real overflow bugs and breaks `position: sticky` in some browsers — the article sidebar is already static at that width, so no current breakage, but prefer fixing the overflow source.
- The blog article sidebar behaves well: sticky at desktop, 2-col grid ≤1024, single column ≤768. Good.
- `.article__table` gets horizontal scroll wrap (`article__table-wrap`) — exactly right for the comparison tables on mobile.

---

## 5. Accessibility Audit

**Working well:** semantic landmarks (`header`/`nav`/`footer`/`article`), labeled nav, `aria-label`s on icon links, real `<label for>` on every form field, `:focus-visible` styling, `prefers-reduced-motion` support, `.sr-only` utility, alt text on every image (descriptive, not stuffed).

**Issues:**

1. **ARIA states are declared but never updated.** `index.html` gives the FAQ buttons and mobile toggle `aria-expanded="false"`, but `main.js` never toggles the attribute — screen-reader users hear "collapsed" forever. Worse, the 9 subpages/20 blog pages omit `aria-expanded` from the mobile toggle entirely. Fix in JS (one line each in the menu and accordion handlers) and normalize the markup.
2. **No skip-to-content link.** Keyboard users tab through 8 header links on all 31 pages. Add `<a class="sr-only" href="#main">Skip to content</a>` + `id="main"`.
3. **Mobile menu focus management:** the full-screen overlay doesn't trap focus and Escape doesn't close it; focus can land on content visually hidden behind the overlay.
4. **Color contrast failures (WCAG AA):**
   - Gold section labels `#c88932` on cream `#faf5ed` ≈ **2.7:1** (needs 4.5:1 at that size). Used on every section label, portfolio tags, insight tags sitewide. Darken to ~`#9a6a22` for text-on-cream uses (keep the brighter gold for large/decorative elements).
   - Footer/fine-print `#8a8a8a` on `#f6edd8` ≈ **3.0:1** — fails for small text. Darken `--color-text-faint`.
5. **FAQ answers collapse via `max-height` with no `hidden`/`aria-controls` relationship** — partially fine, but tab order includes links inside closed answers? (No links currently inside answers — keep it that way or add `inert`.)
6. Theme toggle: icon and `aria-label` update correctly — good — but see §7 on persistence.

---

## 6. SEO Audit (on-page & technical)

**Strengths (keep doing this):**
- Exactly one keyword-targeted H1 per page; descriptive, differentiated titles (39–82 chars) and meta descriptions (136–160 chars) on all 31 pages — no duplicates found.
- 20-article content cluster with disciplined internal linking (every article cross-links 4–6 siblings; insights hub links all 20; relative extensionless hrefs match canonicals).
- `robots.txt` + complete, accurate `sitemap.xml` (all 30 indexable URLs, real lastmod dates that match the git history — rare and valuable).
- Schema coverage: Organization, Person (founders), Service, LocalBusiness, Article (20×), FAQPage (21×), HowTo (4×). This is far beyond typical SMB sites.

**Fixes:**
1. **og:image absolute URLs** (§1.2) — the highest-impact SEO-adjacent fix.
2. **www vs non-www in schema** (§2.2).
3. **Organization schema is missing `sameAs` and `logo`.** Add the founders' LinkedIn URLs at minimum (`sameAs` is the primary entity-reconciliation signal for knowledge panels and AI engines), plus `"logo": "https://ochilmanagement.com/images/logo.png"`.
4. **No BreadcrumbList schema** and no visible breadcrumbs on blog articles (`Home › Insights › Article`). Cheap win for SERP display and crawl context.
5. Blog `Article` schema lacks `image` — Google's article rich results require it. Reuse the (absolute) og:image.
6. Add `article:published_time` / `article:modified_time` OG tags on blog posts (the `<time datetime>` element is already there — good).
7. Titles on services/insights pages run 81–82 chars and will truncate in SERPs; consider trimming the brand suffix on the two longest.
8. The homepage `LocalBusiness` (on contact) vs `Organization` (on home) split is fine, but both should share `@id` so engines merge them, e.g. `"@id": "https://ochilmanagement.com/#org"`.

---

## 7. Local SEO ("geo") Audit — the biggest strategic gap

The site contains **no geographic information whatsoever** outside the footer's "Washington State Certified Veteran-Owned Business" badge image:

- `LocalBusiness` schema (contact page) has **no `address`, no `telephone`, no `geo`, no `areaServed`, no `openingHours`** — it's a LocalBusiness with no locality, which is essentially inert.
- No NAP (Name–Address–Phone) anywhere in visible content. No phone number exists on the site at all (the analytics code even tracks `tel:` clicks — there's nothing to click).
- No city/region keywords on any page ("fractional CFO Washington", "fractional CFO Spokane/Seattle/Tacoma…" — whichever is true).
- No Google Business Profile linkage signals.

Fractional CFO/COO is a high-trust purchase where "near me"/"in Washington" queries convert disproportionately, and the firm already holds a **state veteran-owned certification** — a powerful local trust signal that's currently buried in a footer JPEG.

**Recommendations (in order):**
1. Decide the public location posture. Even service-area businesses (home-based, no office) can and should publish at least a city/region and phone number.
2. Complete the LocalBusiness schema: `address` (at minimum `addressLocality`/`addressRegion`), `telephone`, `areaServed` (e.g., `["Washington", "United States"]` — remote-friendly firms should say so in copy too), `sameAs`, and `@id` shared with the Organization.
3. Create/claim a Google Business Profile and link it bidirectionally.
4. Add a short "Based in [City], Washington — serving clients nationwide" line to the footer and contact page (visible NAP beats schema-only NAP).
5. Pursue the directories that matter for this niche: state veteran-owned business directory (they're certified — be listed), Clutch/UpCity for fractional services, chamber listings.

---

## 8. GEO (Generative-Engine / AI-Answer Optimization)

This site is clearly already being optimized for AI answer engines, and much of it is well executed:

**Strengths:** answer capsules at the top of every article (direct, quotable definitions), FAQPage schema mirroring visible `<details>` FAQs, comparison tables with concrete numbers, cited statistics with named sources, consistent entity naming ("Ochil Hills Management", "CAIRN"), author attribution with credentials on every article.

**Gaps:**
1. **Entity reinforcement is undermined by the www/non-www split** (§2.2) — AI engines reconcile entities by URL; fix the inconsistency.
2. **No `sameAs` graph** (§6.3) — this is how LLM-backed engines verify the firm is a real entity.
3. **Unverifiable differentiation claims** ("The only fractional firm…", "Zero direct competitors nationally") appear in schema FAQ answers. AI engines increasingly discount or skip absolute claims they can't corroborate; consider "one of the only" phrasing in the *schema text* even if marketing copy stays bolder.
4. Consider adding an `llms.txt` at root summarizing the firm, services, and key pages — emerging convention, zero cost.
5. The 7 newest blog posts (`budget-planning…`, `cash-flow-management…`, `financial-reporting…`, `fractional-cfo-vs-bookkeeper`, `how-to-hire…`, `outsourced-cfo-services`, `what-does-a-fractional-coo-do`) are **missing the custom event-tracking block** that the other 24 pages have — so article-engagement data (the feedback loop for the GEO strategy) is silently absent on the newest content. Externalizing the script (§2.1) fixes this permanently.
6. robots.txt currently allows everything — good; explicitly *do not* add AI-crawler blocks given the GEO strategy. Consider explicitly allowing `GPTBot`, `ClaudeBot`, `PerplexityBot` as documentation of intent.

---

## 9. Aesthetic & UX Review

**What works:** The Zodiak serif + Work Sans pairing is distinctive and appropriate for "operator-led, not corporate." The earth-tone palette with Scottish-hills photography is a memorable, ownable brand world. Fluid type scale (`clamp`) is professionally done. Card/section rhythm is consistent. The land-and-expand journey visualization communicates the service model well. Dark mode existing at all is a nice touch.

**Issues:**

1. **Palette sprawl.** Five accent families are in active use: forest green (primary), heather purple (links/CTAs), gold (labels), teal `#01696F` (Client Login button — hard-coded, not a CSS variable, not in the brand palette), bright green, and burnt orange (defined, barely used). The primary CTA is heather, the CTA banner button is class `btn--accent` (gold) but overridden back to heather in CSS — dead styling that signals indecision. **Recommendation:** pick one conversion color (heather) for all primary CTAs, gold strictly for labels/decoration, retire the teal one-off (restyle Client Login as a ghost/secondary button), and delete unused tokens.
2. **Inline style drift.** 50+ `style=""` attributes across pages (hero title widths, card borders, list styling, contact icons). This bypasses the otherwise excellent design system, makes dark mode brittle, and guarantees inconsistency as pages multiply. Promote recurring patterns to classes.
3. **Hero redundancy on the homepage:** the badge reads "Veteran-Owned · Family-Operated · Faith-Driven" and the *very next section* repeats the identical three items as value badges. Use the hero badge for something additive (e.g., "Fractional CFO + COO · $500K–$7M SMBs").
4. **Theme toggle doesn't persist.** Choosing dark mode resets to light on every navigation (no `localStorage`, no `prefers-color-scheme` respect). A toggle that forgets is worse than no toggle. Persist the choice and honor the OS preference on first visit (with a pre-paint inline snippet to avoid flash).
5. **Typographic niggles:** services page journey step copy has a lowercase sentence start ("our team embedded."); em-dash spacing alternates between `—` set open and closed across pages. Minor, but this brand sells precision.
6. The contact form's success/error colors are hard-coded light-mode hex values — in dark mode they appear as bright boxes. Use the existing tokens.
7. Five-tier service architecture is presented in *different orders* on the homepage (CFO→COO→Integrated→Consulting→Sprints) vs. services page (Sprints→Consulting→CFO→COO→Integrated, framed as a ladder). The services-page ladder is the stronger story — consider matching the homepage order to it.

---

## 10. Analytics & Conversion

- GA4 base tag present on all 31 pages; event taxonomy (cta_click, form_submission, generate_lead, scroll_depth, faq_interaction, outbound clicks) is thoughtfully designed.
- **7 newest blog posts missing the event block** (§8.5).
- Scroll-depth `Infinity` bug on short pages (§2.3) will pollute the scroll_depth dimension.
- Web3Forms access key is public by design, but enable its domain-allowlist/captcha so the endpoint can't be abused for spam from elsewhere.
- No cookie-consent mechanism. For a US-only B2B audience this is currently a judgment call, but the privacy policy should accurately describe GA4 usage — verify it does.
- Conversion path is clean (every page → contact), but consider a low-friction scheduling embed (Calendly et al.) on contact — "We schedule a discovery call" currently adds an email round-trip for a time-poor audience.

---

## Prioritized Action Plan

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Strip EXIF/GPS from kylie-kaiser-real.jpg; re-export resized | Privacy | Minutes |
| 2 | Absolute og:image URLs sitewide (+ dimensions, ideally a 1200×630 card) | Social/SEO | Low |
| 3 | Resize/convert the 7 oversized images; delete 5 unused ones | Performance | Low |
| 4 | Replace 240 KB logo.png with small PNG/SVG (every page) | Performance | Minutes |
| 5 | Remove duplicate form handler in main.js; fix reCAPTCHA badge | Functionality/trust | Minutes |
| 6 | Add favicon set | Brand/SERP | Minutes |
| 7 | Unify www→non-www across schema/og; add sameAs + logo to Organization | SEO/GEO | Low |
| 8 | Complete LocalBusiness schema + visible NAP + Google Business Profile | Local SEO | Medium |
| 9 | Fix 769–1024px header overflow (hamburger at ≤900px or hide login CTA) | Responsive | Low |
| 10 | Externalize analytics block; restores tracking on 7 newest articles | Analytics | Low |
| 11 | aria-expanded toggling, skip link, contrast fixes (gold/faint text) | Accessibility | Low–Med |
| 12 | Persist theme choice; honor prefers-color-scheme | UX | Low |
| 13 | srcset + preload + fetchpriority on hero images; width/height on all imgs | Performance/CLS | Medium |
| 14 | Move charset to top of head; close `<picture>` tags; fix or remove picture wrappers | Technical | Low |
| 15 | Custom 404 page; explicit cache/security headers | Technical | Low |
| 16 | BreadcrumbList + Article image schema on blog | SEO | Medium |
| 17 | Consolidate CTA color system; reduce inline styles | Design system | Medium |

---

*This audit is documentation only. No changes were made to site files; nothing was deployed.*

---

## Remediation Status (implemented on this branch — June 9, 2026)

All changes live on branch `claude/website-audit-review-cv9rdm` only. `main` (the live site) is untouched.

| Audit item | Status | Notes |
|---|---|---|
| 1. EXIF/GPS stripped from kylie-kaiser-real.jpg | ✅ Done | Re-encoded clean, resized to 600w (968 KB → 116 KB) |
| 2. Absolute og:image + dimensions | ✅ Done | New 1200×630 share cards (og-home/services/about/portfolio.jpg) on all 31 pages |
| 3. Image optimization | ✅ Done | heather 1.2 MB→332 KB, civichire 1.4 MB→20 KB, waterfall 576→320 KB; 5 unused images deleted |
| 4. Logo resized | ✅ Done | 240 KB → 32 KB (192×144, 3× display size) |
| 5. Duplicate form handler + fake reCAPTCHA badge | ✅ Done | Legacy handler removed from main.js; badge removed; result styling now theme-aware classes |
| 6. Favicon set | ✅ Done | favicon.ico, favicon-32.png, apple-touch-icon.png, linked on every page |
| 7. www→non-www in schema/og; sameAs + logo + @id | ✅ Done | All structured data now uses https://ochilmanagement.com consistently |
| 8. Local SEO | ◐ Partial | LocalBusiness now has addressRegion WA, areaServed, sameAs, @id; footer says "Based in Washington State, serving clients nationwide." **Needs your input:** city, phone number, Google Business Profile |
| 9. 769–1024px header overflow | ✅ Done | Client Login hidden 769–1100px (still in footer + mobile menu) |
| 10. Analytics externalized | ✅ Done | js/analytics.js on all 31 pages incl. the 7 that were missing tracking; scroll-depth Infinity bug fixed; passive listeners |
| 11. aria-expanded, skip link, contrast | ✅ Done | JS now updates ARIA state; skip-to-content link sitewide; new --color-accent-text (AA) for labels/tags; text-faint darkened |
| 12. Theme persistence | ✅ Done | localStorage + prefers-color-scheme, applied pre-paint (no flash) |
| 13. srcset/preload/fetchpriority/dimensions | ✅ Done | 768/1280/1920/2752w hero variants, preload with imagesrcset, width/height on all known images |
| 14. charset placement, picture tags | ✅ Done | charset/viewport now first in head; redundant/unclosed picture wrappers replaced with responsive img |
| 15. 404 page + headers | ✅ Done | Branded 404.html (noindex); _headers file (Cloudflare/Netlify format — remove if host differs) |
| 16. BreadcrumbList + Article image schema | ✅ Done | All 20 blog posts |
| 17. CTA color consolidation | ◐ Partial | Teal Client Login one-off retired (now brand primary outline); Escape key closes mobile menu; deeper inline-style cleanup deferred |
| Bonus | ✅ | llms.txt added; fontshare preconnect; hero badge de-duplicated ("Fractional CFO + COO · For $500K–$7M Businesses") |

**Still needs a human decision:** publish a city + phone number (then complete the PostalAddress and add `telephone` to schema), create the Google Business Profile, and confirm the hosting platform so `_headers` can be adapted if needed.
