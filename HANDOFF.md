# Starlight & Co Group — design concept, developer handoff

A working static prototype of the 5-page site. It is the design reference for the
Next.js + CMS build: same structure, same class names, same separation between
layout, content and the decorative 3D layer.

## Run it

```
powershell -ExecutionPolicy Bypass -File serve.ps1 5180
```

Then open http://localhost:5180. After editing anything in `src/`, rebuild the pages:

```
powershell -ExecutionPolicy Bypass -File build.ps1
```

## Pages and URLs

| Page | URL | Source | Signature moment (one per page) |
|---|---|---|---|
| Accueil | `/` | `src/pages/accueil.html` | Glass infinity splits into four and recomposes (WebGL) |
| Qui sommes-nous | `/qui-sommes-nous/` | `src/pages/qui-sommes-nous.html` | Value chain draws itself along an infinity path (SVG) |
| Nos pôles | `/nos-poles/` | `src/pages/nos-poles.html` | Index follows the pole being read |
| Secteurs & Approche | `/secteurs/` | `src/pages/secteurs.html` | Method rail fills across the four steps |
| Les fondateurs | `/les-fondateurs/` | `src/pages/les-fondateurs.html` | Light pointer interaction: portraits lean toward the cursor with a soft light (desktop pointer only, off for reduced motion), accordion ("En savoir plus", native `<details>`) opens smoothly. No WebGL. Redirect the old `/le-fondateur/` here. |
| Contact | `/contact/` | `src/pages/contact.html` | Real glass slab behind the form (WebGL) |

Nothing else animates on scroll. No reveal-on-scroll on cards or sections.

## Folder map → Next.js

| Prototype | Role | Next.js (App Router) |
|---|---|---|
| `src/layout.html` | Header, footer, `<head>`, JSON-LD, tracking slot | `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx` |
| `src/pages/*.html` | Page content only | `app/page.tsx`, `app/qui-sommes-nous/page.tsx`, `app/nos-poles/page.tsx`, `app/secteurs/page.tsx`, `app/contact/page.tsx` |
| `css/site.css` | Design system | global stylesheet or CSS modules, tokens kept as CSS variables |
| `js/site.js` | Header + the three SVG/scroll moments | small client components: `ValueChain`, `PoleIndex`, `MethodRail` |
| `glass/` | The whole decorative 3D layer | `components/glass/` loaded with `next/dynamic(..., { ssr: false })` |
| `js/analytics.js` | GA4 + Meta Pixel | `components/Analytics.tsx` |
| `build.ps1`, `serve.ps1` | Prototype tooling only | not needed |

Shared, single-instance components: `Header`, `Footer`, `CtaBand`, `.btn` (primary CTA),
`.link-cta` (secondary CTA), `.card`. Every page uses these and nothing page-specific.

## The decorative layer (`/glass`)

- `glass-loader.js` decides whether to load the scene: after `window.load`, on idle,
  and never for `prefers-reduced-motion`, data-saver, 2G, or browsers without WebGL 2.
- `glass-scene.js` is the scene (Three.js r160, vendored in `glass/vendor`). It reads
  the silhouette from `assets/shapes/shape.svg` and renders into `<canvas id="webgl">`.
- `glass.css` holds every cinematic rule, all scoped under `html.glass-on`, a class the
  scene adds only once it is running.
- No text, link or CTA lives in the canvas. On the home page the four chapters are plain
  HTML sections; the scene turns them into fixed overlays, and without it they simply
  stack as normal sections with a static SVG poster.
- To switch it off on a page: set `glass: none` in the page's front matter (prototype),
  or stop rendering the `<GlassLayer>` component (Next.js). To remove it everywhere:
  delete the `glass` folder and the two tags marked `DECORATIVE LAYER`. Layout, content
  and SEO are untouched.
- Hooks a page gives the scene: `data-glass-mode="story|contact"` on the canvas,
  `data-glass-after` on the block that follows the home story, `data-glass-card` on the
  contact form card.
- For production, replace the vendored `three.module.js` (1.2 MB, unminified) with the
  `three` npm package so the bundler can minify and split it.

## CMS: WordPress (headless), content model

WordPress is the content back office; Next.js renders the site. Suggested wiring, to be
confirmed by the developer:

- Next.js reads WordPress through WPGraphQL (or the REST API), with ACF for structured
  fields. Pages are statically generated and revalidated when an editor saves.
- Custom post types for the repeatable content: `pole`, `fondateur`, `secteur`. An ACF
  options page holds `siteSettings`. Each of the six pages is a WordPress page with its
  own ACF field group.
- SEO title and meta description per page come from the SEO plugin's fields exposed to
  the API, and feed `generateMetadata()`.
- Images go through the WordPress media library, with the alt text field mandatory.
- The contact form posts to a Next.js route (`/api/contact`) that sends the email; it does
  not depend on a WordPress form plugin.
- The decorative 3D layer, the analytics slot and the layout live only in the Next.js
  code: an editor cannot reach or break them from WordPress.

Fields per document:

| Document | Fields | Used by |
|---|---|---|
| `siteSettings` (singleton) | name, logo (image + alt), baseline, email, phone, address, socialLinks[] (platform, account, url), ga4Id, metaPixelId | Header, Footer, Contact, JSON-LD, Analytics |
| `page` (one per page) | seoTitle, seoDescription, hero.eyebrow, hero.titleLine1, hero.titleLine2, hero.lead | every page |
| `homeChapter` (4, ordered) | titleLine1, titleLine2, text or items[], secondaryCta (label, link) | Accueil |
| `pole` (ordered list) | title, slug, summary (card), lead, whatWeDo[], forWhom, order | Accueil preview, Nos pôles, Contact select |
| `about` (singleton) | story (title, paragraphs[]), vision, mission, valueChain[] (title, text, position), values[] (title, text), reasons[] (title, text) | Qui sommes-nous |
| `founder` (ordered list, 2 today) | name, slug, role, portrait (image + alt), bio, trigger, quote, more (rich text for the accordion) | Les fondateurs, Person JSON-LD, Organization `founder` |
| `sector` (ordered list) | name, challenges, answer | Secteurs table |
| `methodStep` (4, ordered) | title, text | Secteurs & Approche |
| `ctaBand` (singleton) | title, text, buttonLabel | every page |

A sixth pole is one more `pole` document: the home preview, the pole index, the pole
article and the contact select are all generated from the list. Each pole has its own
anchor (`/nos-poles/#slug`).

Editors only ever touch text and images. Titles are two short lines; the home chapter
titles shrink automatically if a line is too long, so an edit cannot break the layout.

## SEO

- One `<h1>` per page, ordered headings, `header` / `nav` / `main` / `footer` landmarks,
  skip link, real `<table>` with caption and scoped headers for the sectors.
- Per-page `<title>`, meta description, canonical and Open Graph tags: front matter in
  the prototype, `generateMetadata()` fed by the `page` document in Next.js.
- `Organization` + `LocalBusiness` JSON-LD in the layout, fed by `siteSettings`.
- All content is server-rendered HTML; the canvas is `aria-hidden` and empty of content.
- To add at build time: `sitemap.xml`, `robots.txt`, a social share image, favicon.

## Tracking slot

`js/analytics.js` is the only place GA4 and Meta Pixel live. Fill `GA4_ID` and
`META_PIXEL_ID` to install, empty them to remove. Nothing loads while they are empty.
Gate it behind a consent choice before going live.

## Still to supply

- A vector (SVG) version of the logo. The supplied JPG is in `assets/brand/logo.jpg`; the header
  uses `logo-mark.png`, the symbol cut out of it. The glass object is still an approximation
  of the symbol (`assets/shapes/shape.svg`).
- The three social profile URLs (Facebook, Instagram, TikTok, account "Starlight and Co
  Group"). The icons are in place in the footer and on the Contact page, as `<a>` without
  `href`: add `href` on each, and a `sameAs` array with the same URLs in the JSON-LD.
- `[ADDRESS]`, `[SITE_URL]`. Set: email starlightandcosarl@gmail.com; phones +7 996 667 67 00 (label "International") and +237 697 856 826 (label "Cameroun"), as `siteSettings.phones[]` (number, label).
- Portraits are displayed as uploaded (original colours), ratio 3/4.
- WordPress hosting and admin access, to create the post types and field groups above.
- Copy validation. All French copy is draft. To confirm in particular: the names and
  scope of the five poles, the rows of the sectors table, and on "Qui sommes-nous" the
  four values, which are written as commitments made in the company's name.