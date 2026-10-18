// Product entry pages work both from file bookmarks and on the hosted site.
const fs = require('node:fs');
const path = require('node:path');
const routes = require('./product-routing');
for (const [slug, target] of Object.entries(routes)) {
  const name = slug === 'payslipmaker' ? 'PaySlipMaker' : slug === 'emibuddy' ? 'EMIBuddy' : slug === 'rentbanao' ? 'RentBanao' : slug.toUpperCase();
  // Existing product redirects are already curated; only write restored entries.
  if (!['dpdp', 'payslipmaker', 'rentbanao', 'pdf', 'legal', 'emibuddy'].includes(slug)) continue;
  fs.writeFileSync(path.join(__dirname, '..', slug + '.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DoAide ${name}</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<meta name="robots" content="noindex,follow">
<script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body><p><a href="${target}">Open DoAide ${name}</a></p></body>
</html>
`);
}
