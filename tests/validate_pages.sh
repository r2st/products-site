#!/bin/bash
# Validation tests for DoAide static HTML pages
# Checks: file existence, required HTML elements, SEO tags, sitemap entries

PASS=0
FAIL=0
ROOT="/Users/dev/projects/Hackathons/products-site"

pass() { PASS=$((PASS+1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

check_file_exists() {
    if [ -f "$1" ]; then pass "EXISTS: $(basename $1)"; else fail "MISSING: $1"; fi
}

check_contains() {
    if grep -qi "$2" "$1" 2>/dev/null; then pass "$3"; else fail "$3 — not found in $(basename $1)"; fi
}

check_not_contains() {
    if ! grep -q "$2" "$1" 2>/dev/null; then pass "$3"; else fail "$3 — found in $(basename $1)"; fi
}

echo "=== DoAide Page Validation Tests ==="
echo ""

# ─── Tool Pages ───
echo "── Tool Pages ──"
for page in gst-invoice-generator.html eway-bill-helper.html hsn-code-finder.html \
            gst-penalty-calculator.html gst-composition-calculator.html gstr-9-calculator.html; do
    filepath="$ROOT/public/$page"
    echo "  Testing $page..."
    check_file_exists "$filepath"
    check_contains "$filepath" "<title>" "Has <title> tag"
    check_contains "$filepath" 'meta name="description"' "Has meta description"
    check_contains "$filepath" 'rel="canonical"' "Has canonical URL"
    check_contains "$filepath" 'schema.org' "Has Schema.org markup"
    check_contains "$filepath" 'FAQPage' "Has FAQPage schema"
    check_contains "$filepath" 'og:title' "Has OG title"
    check_contains "$filepath" 'DoAide' "References DoAide brand"
    check_contains "$filepath" '</html>' "Has closing HTML tag"
done

echo ""

# ─── Blog Posts ───
echo "── Blog Posts ──"
for page in gst-invoice-format-rules-india.html eway-bill-rules-gst-guide.html \
            hsn-sac-codes-gst-guide.html gst-audit-checklist-small-businesses.html \
            gst-return-filing-deadlines-2026-27.html how-to-claim-itc-on-capital-goods-gst.html; do
    filepath="$ROOT/public/blog/$page"
    echo "  Testing $page..."
    check_file_exists "$filepath"
    check_contains "$filepath" "<title>" "Has <title> tag"
    check_contains "$filepath" 'meta name="description"' "Has meta description"
    check_contains "$filepath" 'rel="canonical"' "Has canonical URL"
    check_contains "$filepath" 'schema.org' "Has Schema.org markup"
    check_contains "$filepath" 'og:title' "Has OG title"
    check_contains "$filepath" 'BreadcrumbList' "Has BreadcrumbList schema"
    check_contains "$filepath" '/blog.html' "Links back to blog listing"
    check_contains "$filepath" '</html>' "Has closing HTML tag"
done

echo ""

# ─── Blog Listing Page ───
echo "── Blog Listing Page ──"
BLOG="$ROOT/blog.html"
check_file_exists "$BLOG"
check_contains "$BLOG" "gst-invoice-format-rules-india.html" "Lists GST invoice blog post"
check_contains "$BLOG" "eway-bill-rules-gst-guide.html" "Lists e-way bill blog post"
check_contains "$BLOG" "hsn-sac-codes-gst-guide.html" "Lists HSN/SAC blog post"
check_contains "$BLOG" "gst-audit-checklist-small-businesses.html" "Lists GST audit blog post"
check_contains "$BLOG" "gst-return-filing-deadlines" "Lists GST deadlines blog post"
check_contains "$BLOG" "how-to-claim-itc" "Lists ITC blog post"

echo ""

# ─── Landing Pages ───
echo "── Landing Pages ──"
INDEX="$ROOT/public/index.html"
GSTBOT="$ROOT/public/gstbot.html"
check_contains "$INDEX" "gst-invoice-generator.html" "Index links to GST Invoice Generator"
check_contains "$INDEX" "eway-bill-helper.html" "Index links to E-Way Bill Helper"
check_contains "$INDEX" "hsn-code-finder.html" "Index links to HSN Code Finder"
check_contains "$GSTBOT" "gst-invoice-generator.html" "GST Bot links to Invoice Generator"
check_contains "$GSTBOT" "eway-bill-helper.html" "GST Bot links to E-Way Bill Helper"
check_contains "$GSTBOT" "hsn-code-finder.html" "GST Bot links to HSN Code Finder"

echo ""

# ─── Sitemap ───
echo "── Sitemap Validation ──"
for sitemap in "$ROOT/sitemap.xml" "$ROOT/public/sitemap.xml"; do
    echo "  Testing $(basename $(dirname $sitemap))/$(basename $sitemap)..."
    check_contains "$sitemap" "gst-invoice-generator.html" "Sitemap has GST Invoice Generator"
    check_contains "$sitemap" "eway-bill-helper.html" "Sitemap has E-Way Bill Helper"
    check_contains "$sitemap" "hsn-code-finder.html" "Sitemap has HSN Code Finder"
    check_contains "$sitemap" "gst-invoice-format-rules-india.html" "Sitemap has invoice blog"
    check_contains "$sitemap" "eway-bill-rules-gst-guide.html" "Sitemap has eway bill blog"
    check_contains "$sitemap" "hsn-sac-codes-gst-guide.html" "Sitemap has HSN/SAC blog"
done

echo ""

# ─── Cross-link Validation ───
echo "── Cross-link Validation ──"
check_contains "$ROOT/public/blog/gst-invoice-format-rules-india.html" "gst-invoice-generator.html" "Invoice blog links to invoice generator tool"
check_contains "$ROOT/public/blog/gst-invoice-format-rules-india.html" "hsn-code-finder.html" "Invoice blog links to HSN code finder tool"
check_contains "$ROOT/public/blog/eway-bill-rules-gst-guide.html" "eway-bill-helper.html" "E-way blog links to e-way bill helper tool"
check_contains "$ROOT/public/blog/hsn-sac-codes-gst-guide.html" "hsn-code-finder.html" "HSN blog links to HSN code finder tool"

echo ""

# ─── HTML Validity Spot Checks ───
echo "── HTML Validity Spot Checks ──"
for page in "$ROOT/public/gst-invoice-generator.html" "$ROOT/public/eway-bill-helper.html" "$ROOT/public/hsn-code-finder.html"; do
    name=$(basename "$page")
    check_contains "$page" '<!DOCTYPE html>' "$name has DOCTYPE"
    check_contains "$page" 'lang="en"' "$name has lang attribute"
    check_contains "$page" 'charset="UTF-8"' "$name has UTF-8 charset"
    check_contains "$page" 'viewport' "$name has viewport meta"
done

echo ""

# ─── No Broken Internal Links ───
echo "── Internal Link Check ──"
BROKEN=0
for html in "$ROOT/public/"*.html "$ROOT/public/blog/"*.html "$ROOT/blog.html"; do
    [ -f "$html" ] || continue
    links=$(grep -o 'href="/[^"#]*\.html"' "$html" | sed 's/href="//;s/"//' | sort -u)
    for link in $links; do
        target="$ROOT/public$link"
        target_root="$ROOT$link"
        if [ ! -f "$target" ] && [ ! -f "$target_root" ]; then
            fail "BROKEN LINK in $(basename $html): $link"
            BROKEN=$((BROKEN+1))
        fi
    done
done
if [ $BROKEN -eq 0 ]; then pass "No broken internal links found"; fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] && exit 0 || exit 1
