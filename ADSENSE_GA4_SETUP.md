# Google AdSense & GA4 Setup Guide for DoAide Products Site

## Status
- AdSense script and ad units: **Added with placeholder IDs**
- GA4 tracking: **Added with placeholder ID**
- Both use `async` loading to avoid blocking page render

## Step 1: Set Up Google AdSense

1. Go to https://adsense.google.com and sign in
2. Add your site `doaide.com` and complete verification
3. Once approved, find your **Publisher ID** (format: `ca-pub-XXXXXXXXXXXXXXXX`)
4. Replace all occurrences of `ca-pub-REPLACE_WITH_ADSENSE_PUB_ID` in the HTML files

### Ad Slot IDs
After AdSense is set up, create ad units in your AdSense dashboard:
- Create 3 "Display ads" (responsive) ad units
- Replace `REPLACE_WITH_AD_SLOT_ID` with the slot IDs from each ad unit
- You can use the same slot ID for all placements, or create separate units for tracking

### Ad Placements
- **index.html**: 3 ads (after hero, between products/how-it-works, before footer)
- **Product pages**: 2 ads each (after product hero, before footer)

## Step 2: Set Up Google Analytics 4

1. Go to https://analytics.google.com
2. Create a property for `doaide.com`
3. Get your **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Replace all occurrences of `G-REPLACE_WITH_GA4_ID` in the HTML files

### Link with Search Console
1. In GA4, go to Admin > Product Links > Search Console Links
2. Click "Link" and select your Search Console property
3. This enables organic search data in GA4

## Quick Replace Command

Once you have your IDs, run these from the `public/` directory:

```bash
# Replace AdSense publisher ID
sed -i '' 's/ca-pub-REPLACE_WITH_ADSENSE_PUB_ID/ca-pub-YOUR_ACTUAL_ID/g' *.html

# Replace GA4 measurement ID
sed -i '' 's/G-REPLACE_WITH_GA4_ID/G-YOUR_ACTUAL_ID/g' *.html

# Replace ad slot IDs (use the same or different per placement)
sed -i '' 's/REPLACE_WITH_AD_SLOT_ID/YOUR_ACTUAL_SLOT_ID/g' *.html
```

## Files Modified
All 16 HTML pages: index.html, bizname.html, complipilot.html, convert.html, documedic.html, gosumo.html, gstbot.html, herald.html, hireagent.html, invoicer.html, n409.html, qr.html, resume.html, salary.html, talentping.html, voicedesk.html

## Notes
- Umami analytics (analytics.doaide.com) is NOT affected — GA4 runs alongside it
- Both AdSense and GA4 scripts use `async` to avoid blocking page load
- Ad units use `data-ad-format="auto"` and `data-full-width-responsive="true"` for mobile
- Ads are hidden in print view via CSS
