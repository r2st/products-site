#!/usr/bin/env node
/* Emits the static site from build/products.js.
   The published site needs no build step — this only keeps the ten pages
   consistent with one another. Run: node build/generate.js */

const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('./products');

const OUT = path.join(__dirname, '..');
const SITE = 'https://products.aiknol.com';
const COMPANY = 'Apprend Technologies';

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const icon = (body, size = 24) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;

const ARROW_UR = icon('<path d="M7 17 17 7M9 7h8v8"/>', 15);
const ARROW_R = icon('<path d="M5 12h13m-5-5 5 5-5 5"/>', 15);
const ARROW_L = icon('<path d="M19 12H6m5 5-5-5 5-5"/>', 15);
const ARROW_D = icon('<path d="M12 5v13m5-5-5 5-5-5"/>', 15);
const TICK = icon('<path d="m4 12 5 5 11-11"/>', 16);
const CHEV = icon('<path d="m6 9 6 6 6-6"/>', 13);

const LIVE = PRODUCTS.filter((p) => p.status === 'live');

/* The mark: one dot per product, laid out 3×3, coloured by the spectrum. */
function markSvg() {
  const cells = PRODUCTS.map((p, i) => {
    const cx = 3 + (i % 3) * 9;
    const cy = 3 + Math.floor(i / 3) * 9;
    return `<circle cx="${cx}" cy="${cy}" r="2.6" fill="${p.hex}" opacity=".92"/>`;
  }).join('');
  return `<svg class="mark__grid" viewBox="0 0 24 24" aria-hidden="true">${cells}</svg>`;
}

const FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#06070a"/>` +
      PRODUCTS.map((p, i) => {
        const cx = 5 + (i % 3) * 7;
        const cy = 5 + Math.floor(i / 3) * 7;
        return `<circle cx="${cx}" cy="${cy}" r="2.3" fill="${p.hex}"/>`;
      }).join('') +
      `</svg>`
  );

/* -------------------------------------------------------------------------- */
/* partials                                                                    */
/* -------------------------------------------------------------------------- */

function head({ title, description, canonical, accent }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#06070a">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="${FAVICON}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${COMPANY}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600&family=Martian+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css">
<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>${
    accent ? `\n<style>:root{--accent:var(${accent})}</style>` : ''
  }`;
}

function header(current) {
  const items = PRODUCTS.map(
    (p) =>
      `<a class="menu__item" href="/${p.slug}.html" style="--accent:var(${p.accent})"><span class="menu__dot"></span>${esc(
        p.name
      )}${p.status === 'soon' ? '<span class="menu__soon">Soon</span>' : ''}</a>`
  ).join('\n        ');

  return `<header class="header">
  <div class="wrap header__bar">
    <a class="mark" href="/" aria-label="${COMPANY} — home">
      ${markSvg()}
      <span class="mark__word">Apprend <span>Technologies</span></span>
    </a>

    <button class="burger" data-burger type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>

    <nav class="nav" id="site-nav" data-nav aria-label="Primary">
      <div class="menu">
        <button class="menu__btn" data-menu-btn type="button" aria-expanded="false" aria-controls="menu-panel">
          Products ${CHEV}
        </button>
        <div class="menu__panel" id="menu-panel" data-menu-panel>
        ${items}
        </div>
      </div>
      <a class="nav__link" href="/#products"${current === 'index' ? ' aria-current="page"' : ''}>Catalogue</a>
      <a class="nav__link" href="/#company">Company</a>
      <a class="nav__cta" href="https://aiknol.com" target="_blank" rel="noopener">aiknol.com ${ARROW_UR}</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  const col = (arr) =>
    arr
      .map(
        (p) =>
          `<li><a href="/${p.slug}.html"><span class="menu__dot" style="--accent:var(${p.accent})"></span>${esc(
            p.name
          )}</a></li>`
      )
      .join('\n        ');

  return `<footer class="footer" id="company">
  <div class="wrap">
    <div class="footer__grid">
      <div>
        <a class="mark" href="/" aria-label="${COMPANY} — home">
          ${markSvg()}
          <span class="mark__word">Apprend <span>Technologies</span></span>
        </a>
        <p class="footer__blurb">
          Nine applied-AI products for the operational work that keeps a business
          running — valuation, compliance, hiring, clinical decisions and the
          conversations in between.
        </p>
      </div>

      <div>
        <h4>Products</h4>
        <ul>
        ${col(PRODUCTS.slice(0, 5))}
        </ul>
      </div>

      <div>
        <h4>More</h4>
        <ul>
        ${col(PRODUCTS.slice(5))}
        </ul>
      </div>

      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="/#products">Catalogue</a></li>
          <li><a href="/#principles">How we build</a></li>
          <li><a href="https://aiknol.com" target="_blank" rel="noopener">aiknol.com ${ARROW_UR}</a></li>
        </ul>
      </div>
    </div>

    <div class="footer__bottom">
      <span>&copy; <span data-year>2026</span> ${COMPANY}</span>
      <span>${LIVE.length} live &middot; ${PRODUCTS.length - LIVE.length} in development</span>
      <span><a href="https://aiknol.com" target="_blank" rel="noopener">aiknol.com</a></span>
    </div>
  </div>
</footer>`;
}

const shell = (inner) =>
  `<div class="field" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<a class="skip" href="#main">Skip to content</a>
${inner}
<script src="/main.js" defer></script>`;

/* -------------------------------------------------------------------------- */
/* screenshot placeholder                                                      */
/* -------------------------------------------------------------------------- */

function shot(label, url, small) {
  const side = Array.from({ length: 6 }, (_, i) =>
    `<div class="sk${i === 1 ? ' sk--accent' : ''}" style="width:${[100, 72, 88, 60, 80, 66][i]}%"></div>`
  ).join('');
  const bars = [58, 92, 44, 76]
    .map((h, i) => `<div class="sk${i === 1 ? ' sk--accent' : ''}" style="height:${h}%"></div>`)
    .join('');

  return `<figure class="shot${small ? ' shot--sm' : ''} rv">
  <div class="shot__chrome">
    <span class="shot__dot"></span><span class="shot__dot"></span><span class="shot__dot"></span>
    <span class="shot__url">${esc(url)}</span>
  </div>
  <div class="shot__body">
    <div class="shot__rows">
      <div class="shot__side">${side}</div>
      <div class="shot__main">
        <div class="sk sk--accent"></div>
        <div class="shot__bars">${bars}</div>
      </div>
    </div>
  </div>
  <figcaption class="shot__label">${esc(label)}</figcaption>
</figure>`;
}

/* -------------------------------------------------------------------------- */
/* index                                                                       */
/* -------------------------------------------------------------------------- */

function statusPill(p) {
  return p.status === 'live'
    ? '<span class="pill pill--live"><span class="pill__dot"></span>Live</span>'
    : '<span class="pill pill--soon"><span class="pill__dot"></span>In development</span>';
}

function card(p) {
  const feats = p.feats.map((f) => `<li>${TICK}<span>${esc(f)}</span></li>`).join('\n        ');
  const visit = p.url
    ? `<a class="btn btn--accent btn--sm" href="${p.url}" target="_blank" rel="noopener">Visit ${p.name} ${ARROW_UR}</a>`
    : `<span class="card__soon">Coming soon</span>`;

  return `<article class="card rv" style="--accent:var(${p.accent})">
      <span class="card__n">${p.num} / ${esc(p.category)}</span>
      <div class="card__icon">${icon(p.icon)}</div>
      <h3 class="card__name">${esc(p.name)}</h3>
      <p class="card__one">${esc(p.one)}</p>
      <ul class="card__feats">
        ${feats}
      </ul>
      <div class="card__foot">
        ${visit}
        <a class="card__link" href="/${p.slug}.html">Overview ${ARROW_R}</a>
      </div>
    </article>`;
}

function manifestRow(p) {
  return `<a class="manifest__row" href="/${p.slug}.html" style="--accent:var(${p.accent})">
        <span class="manifest__n">${p.num}</span>
        <span class="manifest__name">${esc(p.name)} <em>${esc(p.category)}</em></span>
        <span class="manifest__arrow">${ARROW_R}</span>
      </a>`;
}

const PRINCIPLES = [
  [
    'Built for the work, not the demo',
    'Each product is aimed at a job someone is already doing by hand — a 409A, a GST return, a hiring loop. The measure is whether that job gets easier, not whether the model sounds impressive.',
    '<path d="M3 21h18M6 21V8m6 13V3m6 18v-9"/>',
  ],
  [
    'Reasoning you can audit',
    'A recommendation nobody can check is a liability. Every product shows its working — the assumptions, the sources, the path to the answer — because these outputs go in front of auditors, clinicians and regulators.',
    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M11 8v3l2 2"/>',
  ],
  [
    'A human keeps the wheel',
    'Autopilot has guardrails. Clinical support supports a clinician. Outreach holds back what does not clear the bar. The systems act, and they stop where judgement starts.',
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v8.5l6 6"/>',
  ],
];

function indexPage() {
  const stats = [
    [String(PRODUCTS.length), 'Products in the catalogue'],
    [String(LIVE.length), 'Live in production'],
    ['6', 'Domains covered'],
  ]
    .map(
      ([n, l]) => `<div class="stat"><div class="stat__n">${n}</div><div class="stat__l">${l}</div></div>`
    )
    .join('\n          ');

  const principles = PRINCIPLES.map(
    ([t, b, ic], i) => `<article class="tile rv" style="--accent:var(--p${i * 4 + 1})">
        <div class="tile__icon">${icon(ic, 20)}</div>
        <h3>${esc(t)}</h3>
        <p>${esc(b)}</p>
      </article>`
  ).join('\n      ');

  return `<!doctype html>
<html lang="en">
<head>
${head({
  title: `${COMPANY} — Applied AI products`,
  description:
    'Nine applied-AI products from Apprend Technologies: 409A valuation, outreach, GST compliance, talent sourcing, clinical decision support, client management, voice, hiring and compliance.',
  canonical: SITE + '/',
  accent: '--p5',
})}
</head>
<body>
${shell(`${header('index')}

<main id="main">

  <section class="hero">
    <div class="wrap hero__grid">
      <div class="load">
        <p class="eyebrow">${COMPANY} &nbsp;/&nbsp; AI product studio</p>
        <h1 class="display hero__title">Serious AI for the <span class="sweep">unglamorous</span> work.</h1>
        <p class="lede">
          Valuations, tax filings, hiring loops, clinical decisions, client
          conversations. The work that has to be right, happens on a deadline,
          and nobody puts on a keynote slide. We build nine products for it.
        </p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="#products">Browse the catalogue ${ARROW_D}</a>
          <a class="btn btn--ghost" href="https://aiknol.com" target="_blank" rel="noopener">aiknol.com ${ARROW_UR}</a>
        </div>
        <div class="hero__stats">
          ${stats}
        </div>
      </div>

      <div class="load">
        <div class="manifest">
          <div class="manifest__head">
            <span class="eyebrow eyebrow--plain">The catalogue</span>
            <span class="mono dim">${PRODUCTS.length} products</span>
          </div>
          ${PRODUCTS.map(manifestRow).join('\n          ')}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tight" id="products">
    <div class="wrap">
      <div class="rail rv" style="margin-bottom:clamp(2.5rem,5vw,4rem)"></div>
      <div class="section__head">
        <div>
          <p class="eyebrow rv">Catalogue</p>
          <h2 class="h2 rv" style="margin-top:1rem">Nine products, one spectrum.</h2>
        </div>
        <p class="rv" style="font-size:.9375rem;color:var(--text-2);max-width:34ch">
          ${LIVE.length} are live and in production today. ${PRODUCTS.length - LIVE.length} are in
          active development. Each one owns a colour, a domain and a job.
        </p>
      </div>

      <div class="cards" data-stagger="60">
        ${PRODUCTS.map(card).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" id="principles">
    <div class="wrap">
      <div class="section__head">
        <div>
          <p class="eyebrow rv">How we build</p>
          <h2 class="h2 rv" style="margin-top:1rem">Three commitments that survive contact&nbsp;with production.</h2>
        </div>
      </div>
      <div class="trio" data-stagger="80">
      ${principles}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <div class="band rv" style="--accent:var(--p4)">
        <p class="eyebrow eyebrow--plain" style="justify-content:center">${COMPANY}</p>
        <h2 class="h2" style="margin-top:1rem">Start with the one that matches your problem.</h2>
        <p class="lede">
          Every live product is running in production and open to try. Pick the
          domain, open the product, and judge it on the work it does.
        </p>
        <div class="band__actions">
          <a class="btn btn--primary" href="#products">See all ${PRODUCTS.length} products ${ARROW_D}</a>
          <a class="btn btn--ghost" href="https://aiknol.com" target="_blank" rel="noopener">About Apprend ${ARROW_UR}</a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer()}`)}
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/* product page                                                                */
/* -------------------------------------------------------------------------- */

function productPage(p, i) {
  const prev = PRODUCTS[(i - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(i + 1) % PRODUCTS.length];
  const host = p.url ? p.url.replace(/^https?:\/\//, '') : `${p.slug}.aiknol.com`;

  const specRows = p.spec
    .map(([k, v]) => `<div class="spec__row"><span class="spec__k">${esc(k)}</span><span class="spec__v">${esc(v)}</span></div>`)
    .join('\n      ');

  const features = p.features
    .map(
      ([t, b]) => `<article class="tile rv">
        <div class="tile__icon">${TICK}</div>
        <h3>${esc(t)}</h3>
        <p>${esc(b)}</p>
      </article>`
    )
    .join('\n      ');

  const steps = p.steps
    .map(
      ([t, b], n) => `<article class="step rv">
        <span class="step__n">Step ${String(n + 1).padStart(2, '0')}</span>
        <h3>${esc(t)}</h3>
        <p>${esc(b)}</p>
      </article>`
    )
    .join('\n      ');

  const inside = p.inside
    .map(
      ([s, b]) => `<div class="inside__row rv">${TICK}<span><strong>${esc(s)}</strong> — ${esc(b)}</span></div>`
    )
    .join('\n      ');

  const primary = p.url
    ? `<a class="btn btn--accent" href="${p.url}" target="_blank" rel="noopener">Visit ${esc(p.name)} ${ARROW_UR}</a>`
    : `<span class="btn btn--accent is-disabled" aria-disabled="true">In development</span>`;

  return `<!doctype html>
<html lang="en">
<head>
${head({
  title: `${p.name} — ${p.tagline} | ${COMPANY}`,
  description: p.one,
  canonical: `${SITE}/${p.slug}.html`,
  accent: p.accent,
})}
</head>
<body>
${shell(`${header(p.slug)}

<main id="main">

  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Catalogue</a><span>/</span><span>${p.num}</span><span>/</span><span>${esc(p.name)}</span>
    </nav>
  </div>

  <section class="phero">
    <div class="wrap phero__grid">
      <div class="load">
        <div class="phero__badge">
          <span class="phero__mark">${icon(p.icon, 26)}</span>
          ${statusPill(p)}
          <span class="pill">${esc(p.category)}</span>
        </div>
        <h1 class="display phero__name">${esc(p.name)}</h1>
        <p class="phero__tag">${esc(p.tagline)}</p>
        <p class="lede" style="max-width:54ch">${esc(p.lede)}</p>
        <div class="phero__actions">
          ${primary}
          <a class="btn btn--ghost" href="#features">What it does ${ARROW_D}</a>
        </div>
      </div>

      <div class="load">
        <div class="spec">
          <div class="spec__head">Specification</div>
          ${specRows}
          <div class="spec__row">
            <span class="spec__k">Address</span>
            <span class="spec__v">${
              p.url
                ? `<a href="${p.url}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(host)}</a>`
                : `<span class="dim">${esc(host)} &middot; not yet published</span>`
            }</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <div class="section__head">
        <div>
          <p class="eyebrow rv">Interface</p>
          <h2 class="h2 rv" style="margin-top:1rem">Inside ${esc(p.name)}.</h2>
        </div>
        <p class="rv mono dim">Screenshots pending &middot; representative layout</p>
      </div>
      <div class="shots">
        ${shot(p.shots[0], host, false)}
        <div class="shots__stack">
          ${shot(p.shots[1], host, true)}
          ${shot(p.shots[2], host, true)}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="features">
    <div class="wrap">
      <div class="section__head">
        <div>
          <p class="eyebrow rv">Capabilities</p>
          <h2 class="h2 rv" style="margin-top:1rem">What it does.</h2>
        </div>
      </div>
      <div class="trio" data-stagger="60">
      ${features}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <div class="section__head">
        <div>
          <p class="eyebrow rv">Workflow</p>
          <h2 class="h2 rv" style="margin-top:1rem">How it works.</h2>
        </div>
      </div>
      <div class="steps" data-stagger="70">
      ${steps}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section__head">
        <div>
          <p class="eyebrow rv">Detail</p>
          <h2 class="h2 rv" style="margin-top:1rem">What&rsquo;s inside.</h2>
        </div>
      </div>
      <div class="inside" data-stagger="45">
      ${inside}
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <div class="band rv">
        <p class="eyebrow eyebrow--plain" style="justify-content:center">${esc(p.category)}</p>
        <h2 class="h2" style="margin-top:1rem">${
          p.url ? `Try ${esc(p.name)} now.` : `${esc(p.name)} is on the way.`
        }</h2>
        <p class="lede">${
          p.url
            ? `${esc(p.name)} is live in production at ${esc(host)}. Open it and judge it on the work it does.`
            : `${esc(p.name)} is in active development. In the meantime, ${LIVE.length} other ${COMPANY} products are live and in production today.`
        }</p>
        <div class="band__actions">
          ${primary}
          <a class="btn btn--ghost" href="/#products">All ${PRODUCTS.length} products ${ARROW_R}</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <nav class="pn" aria-label="Product navigation">
        <a class="pn__item" href="/${prev.slug}.html" style="--accent:var(${prev.accent})">
          <span class="pn__k">${ARROW_L} Previous</span>
          <span class="pn__v"><span class="menu__dot"></span>${esc(prev.name)}</span>
        </a>
        <a class="pn__item pn__item--next" href="/${next.slug}.html" style="--accent:var(${next.accent})">
          <span class="pn__k">Next ${ARROW_R}</span>
          <span class="pn__v">${esc(next.name)}<span class="menu__dot"></span></span>
        </a>
      </nav>
    </div>
  </section>

</main>

${footer()}`)}
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/* emit                                                                        */
/* -------------------------------------------------------------------------- */

function write(name, contents) {
  fs.writeFileSync(path.join(OUT, name), contents);
  console.log('  ' + name.padEnd(22) + (contents.length / 1024).toFixed(1) + ' kB');
}

console.log('Generating products.aiknol.com …');
write('index.html', indexPage());
PRODUCTS.forEach((p, i) => write(`${p.slug}.html`, productPage(p, i)));

/* sitemap + robots, so the catalogue is indexable */
const urls = ['/', ...PRODUCTS.map((p) => `/${p.slug}.html`)]
  .map((u) => `  <url><loc>${SITE}${u}</loc><changefreq>weekly</changefreq></url>`)
  .join('\n');
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Done — ${PRODUCTS.length + 3} files.`);
