#!/usr/bin/env python3
"""
DoAide Umami Analytics API Client

Pulls per-page metrics, active visitors, events, and stats
from the self-hosted Umami v2 instance at analytics.doaide.com.

Usage:
  python3 umami_api.py                    # full report, last 7 days
  python3 umami_api.py --days 30          # last 30 days
  python3 umami_api.py --product taxfile  # single product
  python3 umami_api.py --json             # machine-readable output

Environment variables (or edit DEFAULTS below):
  UMAMI_BASE_URL   (default: https://analytics.doaide.com)
  UMAMI_USERNAME   (default: admin)
  UMAMI_PASSWORD   (default: doaide2026)
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode

# ── Config ────────────────────────────────────────────────────────────

BASE_URL = os.environ.get("UMAMI_BASE_URL", "https://analytics.doaide.com")
USERNAME = os.environ.get("UMAMI_USERNAME", "admin")
PASSWORD = os.environ.get("UMAMI_PASSWORD", "doaide2026")

PRODUCTS = {
    "taxfile":  {"id": "0052a6f2-5931-4d11-ae2f-e92a37edcd04", "domain": "tax.doaide.com"},
    "comply":   {"id": "addb5af4-2c5a-4054-ae61-07ba182b3723", "domain": "comply.doaide.com"},
    "bizname":  {"id": "36ac3ce7-5cad-49bb-9d45-d28b0703ef34", "domain": "bizname.doaide.com"},
    "gstbot":   {"id": "b2dddc29-9da3-4726-a6ba-4f4b7d998981", "domain": "gst.doaide.com"},
    "insurekit":{"id": "709b48f1-7067-4f59-b33f-afae08acd4a9", "domain": "insure.doaide.com"},
    "med":      {"id": "9f3291d6-8cff-44b1-846c-833ac001b4b0", "domain": "med.doaide.com"},
    "docs":     {"id": "05d01dd4-7c6c-4901-85a2-6ae3bc97c3b6", "domain": "docs.doaide.com"},
}

# ── HTTP helpers ──────────────────────────────────────────────────────

_token = None

def _get_token():
    global _token
    if _token:
        return _token
    body = json.dumps({"username": USERNAME, "password": PASSWORD}).encode()
    req = Request(
        f"{BASE_URL}/api/auth/login",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = urlopen(req, timeout=15)
    data = json.loads(resp.read())
    _token = data["token"]
    return _token


def api_get(path, params=None):
    """GET request to Umami API with auth."""
    token = _get_token()
    url = f"{BASE_URL}{path}"
    if params:
        url += "?" + urlencode(params)
    req = Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        resp = urlopen(req, timeout=30)
        return json.loads(resp.read())
    except HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"  API error {e.code} for {url}: {body}", file=sys.stderr)
        return None


# ── Data fetchers ─────────────────────────────────────────────────────

def get_stats(website_id, start_at, end_at):
    """Overall stats: pageviews, visitors, visits, bounce rate, time on site."""
    return api_get(f"/api/websites/{website_id}/stats", {
        "startAt": start_at,
        "endAt": end_at,
    })


def get_metrics(website_id, start_at, end_at, metric_type="path", limit=20):
    """
    Per-dimension metrics. type= path | referrer | browser | os | device |
    country | event | title | query | entry | exit | channel | language
    NOTE: 'path' is correct for v2. 'url' returns 400.
    """
    return api_get(f"/api/websites/{website_id}/metrics", {
        "startAt": start_at,
        "endAt": end_at,
        "type": metric_type,
        "limit": limit,
    })


def get_events(website_id, start_at, end_at, limit=50):
    """Custom event names and counts."""
    return get_metrics(website_id, start_at, end_at, metric_type="event", limit=limit)


def get_active(website_id):
    """Current active visitors."""
    return api_get(f"/api/websites/{website_id}/active")


def get_pageviews(website_id, start_at, end_at, unit="day"):
    """Time-series pageviews and sessions."""
    return api_get(f"/api/websites/{website_id}/pageviews", {
        "startAt": start_at,
        "endAt": end_at,
        "unit": unit,
    })


# ── Report builder ────────────────────────────────────────────────────

def build_report(products, days, as_json=False):
    now = datetime.now(timezone.utc)
    end_at = int(now.timestamp() * 1000)
    start_at = int((now - timedelta(days=days)).timestamp() * 1000)

    report = {"generated": now.isoformat(), "period_days": days, "products": {}}

    for name, cfg in products.items():
        wid = cfg["id"]
        domain = cfg["domain"]

        stats = get_stats(wid, start_at, end_at)
        top_pages = get_metrics(wid, start_at, end_at, "path", 15)
        top_referrers = get_metrics(wid, start_at, end_at, "referrer", 10)
        top_countries = get_metrics(wid, start_at, end_at, "country", 5)
        top_devices = get_metrics(wid, start_at, end_at, "device", 5)
        events = get_events(wid, start_at, end_at, 30)
        active = get_active(wid)

        product_data = {
            "domain": domain,
            "website_id": wid,
            "stats": stats,
            "active_visitors": active,
            "top_pages": top_pages,
            "top_referrers": top_referrers,
            "top_countries": top_countries,
            "top_devices": top_devices,
            "events": events,
        }
        report["products"][name] = product_data

    if as_json:
        return json.dumps(report, indent=2, default=str)

    return format_text_report(report)


def format_text_report(report):
    lines = []
    lines.append("=" * 70)
    lines.append(f"  DoAide Analytics Report — Last {report['period_days']} days")
    lines.append(f"  Generated: {report['generated'][:19]}")
    lines.append("=" * 70)

    for name, data in report["products"].items():
        lines.append("")
        lines.append(f"─── {name.upper()} ({data['domain']}) ───")

        stats = data.get("stats") or {}
        # Umami v2 returns flat integers, not nested {value: N}
        pv = stats.get("pageviews", 0) if isinstance(stats.get("pageviews"), int) else stats.get("pageviews", {}).get("value", 0)
        vis = stats.get("visitors", 0) if isinstance(stats.get("visitors"), int) else stats.get("visitors", {}).get("value", 0)
        visits = stats.get("visits", 0) if isinstance(stats.get("visits"), int) else stats.get("visits", {}).get("value", 0)
        bounce = stats.get("bounces", 0) if isinstance(stats.get("bounces"), int) else stats.get("bounces", {}).get("value", 0)
        time_val = stats.get("totaltime", 0) if isinstance(stats.get("totaltime"), int) else stats.get("totaltime", {}).get("value", 0)
        avg_time = round(time_val / max(visits, 1)) if time_val else 0

        active = data.get("active_visitors") or {}
        active_n = active.get("visitors", 0) if isinstance(active, dict) else 0

        lines.append(f"  Active now: {active_n}  |  Pageviews: {pv:,}  |  Visitors: {vis:,}  |  Visits: {visits:,}")
        lines.append(f"  Bounces: {bounce:,}  |  Avg time: {avg_time}s")

        pages = data.get("top_pages") or []
        if pages:
            lines.append("  Top Pages:")
            for p in pages[:10]:
                lines.append(f"    {p.get('x', '?'):40s} {p.get('y', 0):>6,} views")

        referrers = data.get("top_referrers") or []
        if referrers:
            lines.append("  Top Referrers:")
            for r in referrers[:5]:
                lines.append(f"    {r.get('x', '(direct)'):40s} {r.get('y', 0):>6,}")

        events = data.get("events") or []
        if events:
            lines.append("  Custom Events:")
            for e in events[:15]:
                lines.append(f"    {e.get('x', '?'):40s} {e.get('y', 0):>6,} times")

        countries = data.get("top_countries") or []
        if countries:
            lines.append(f"  Top Countries: {', '.join(c.get('x','?') + ' (' + str(c.get('y',0)) + ')' for c in countries[:5])}")

        devices = data.get("top_devices") or []
        if devices:
            lines.append(f"  Devices: {', '.join(d.get('x','?') + ' (' + str(d.get('y',0)) + ')' for d in devices[:5])}")

    lines.append("")
    lines.append("=" * 70)
    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="DoAide cross-product Umami analytics")
    parser.add_argument("--days", type=int, default=7, help="Number of days to look back (default: 7)")
    parser.add_argument("--product", type=str, default=None, help="Single product slug (e.g. taxfile, comply)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    parser.add_argument("--events-only", action="store_true", help="Only show custom events")
    args = parser.parse_args()

    if args.product:
        if args.product not in PRODUCTS:
            print(f"Unknown product: {args.product}. Choose from: {', '.join(PRODUCTS.keys())}", file=sys.stderr)
            sys.exit(1)
        products = {args.product: PRODUCTS[args.product]}
    else:
        products = PRODUCTS

    output = build_report(products, args.days, as_json=args.json)
    print(output)


if __name__ == "__main__":
    main()
