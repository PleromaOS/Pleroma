#!/usr/bin/env python3
"""
Netherlands Salon & Barbershop Scraper
=======================================
Scrapes all hair salons, barbershops, and beauty salons across the Netherlands
from Google Maps using the Places API with a grid-based search pattern.

SETUP:
  1. pip install requests
  2. Get a Google Places API key:
       - Go to https://console.cloud.google.com
       - Create a project → Enable "Places API"
       - Create an API key under Credentials
       - Set it below in API_KEY
  3. Run: python scrape_nl_salons.py

COST ESTIMATE:
  - Nearby Search API: $32 per 1,000 calls
  - Place Details API: $17 per 1,000 calls
  - With default settings (~2,500 grid points, expect 8,000-15,000 unique results):
    ~$80-120 total — set a $200 budget cap in Google Cloud console to be safe.

RESUME:
  If the script is interrupted, just run it again.
  It saves progress to scrape_progress.json and won't repeat completed searches.

OUTPUT:
  nl_salons.csv — one row per unique business with:
  name, address, phone, website, rating, reviews, Google Maps link
"""

import requests
import csv
import time
import json
import os
import sys
from datetime import datetime

# ============================================================
# CONFIGURATION — edit these
# ============================================================

API_KEY = "YOUR_GOOGLE_PLACES_API_KEY"   # ← paste your key here

OUTPUT_CSV      = "nl_salons.csv"
PROGRESS_FILE   = "scrape_progress.json"

# Netherlands bounding box
LAT_MIN, LAT_MAX = 50.75, 53.55
LNG_MIN, LNG_MAX = 3.35,  7.22

# Grid spacing in degrees. 0.045° ≈ 5km. Smaller = better coverage, more API calls.
# 0.045 → ~2,500 grid points → good coverage of all NL
# 0.09  → ~625 grid points  → cheaper but may miss rural areas
GRID_STEP = 0.045

# Search radius in meters (should match ~GRID_STEP distance so circles overlap slightly)
SEARCH_RADIUS = 5000

# What to search for at each grid point.
# "hair_care" covers salons + barbers; "beauty_salon" adds nail/beauty places.
# Using just hair_care keeps it focused on kappers/salons.
PLACE_TYPES = ["hair_care"]
KEYWORDS    = ["kapper", "kapsalon", "barbershop"]

# ============================================================
# GOOGLE PLACES API
# ============================================================

NEARBY_URL  = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

DETAIL_FIELDS = (
    "name,formatted_address,formatted_phone_number,"
    "international_phone_number,website,rating,"
    "user_ratings_total,business_status,url,types"
)


def nearby_search(lat, lng, place_type=None, keyword=None,
                  page_token=None, radius=5000):
    """One call to the Nearby Search endpoint. Returns the full JSON response."""
    if page_token:
        params = {"pagetoken": page_token, "key": API_KEY}
    else:
        params = {
            "location": f"{lat},{lng}",
            "radius": radius,
            "key": API_KEY,
        }
        if place_type:
            params["type"] = place_type
        if keyword:
            params["keyword"] = keyword

    for attempt in range(3):
        try:
            r = requests.get(NEARBY_URL, params=params, timeout=15)
            data = r.json()
            status = data.get("status", "")
            if status in ("OK", "ZERO_RESULTS"):
                return data
            elif status == "INVALID_REQUEST" and page_token:
                # page_token sometimes needs a couple of seconds to become valid
                time.sleep(2)
                continue
            elif status == "OVER_QUERY_LIMIT":
                print("  ⚠  Over query limit — waiting 30 seconds…")
                time.sleep(30)
                continue
            else:
                print(f"  ⚠  API status: {status} — {data.get('error_message', '')}")
                return data
        except requests.RequestException as e:
            print(f"  ⚠  Request error (attempt {attempt + 1}/3): {e}")
            time.sleep(3)

    return {"results": [], "status": "ERROR"}


def get_details(place_id):
    """Fetches detailed info for a single place_id."""
    params = {
        "place_id": place_id,
        "fields": DETAIL_FIELDS,
        "language": "nl",
        "key": API_KEY,
    }
    for attempt in range(3):
        try:
            r = requests.get(DETAILS_URL, params=params, timeout=15)
            return r.json().get("result", {})
        except requests.RequestException as e:
            print(f"  ⚠  Details error (attempt {attempt + 1}/3): {e}")
            time.sleep(3)
    return {}


# ============================================================
# GRID
# ============================================================

def build_grid(lat_min, lat_max, lng_min, lng_max, step):
    """Returns list of (lat, lng) tuples covering the bounding box."""
    points = []
    lat = lat_min
    while lat <= lat_max + 1e-9:
        lng = lng_min
        while lng <= lng_max + 1e-9:
            points.append((round(lat, 4), round(lng, 4)))
            lng = round(lng + step, 4)
        lat = round(lat + step, 4)
    return points


# ============================================================
# PROGRESS / STATE
# ============================================================

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            p = json.load(f)
            # Migrate old format if needed
            if "found_ids" not in p:
                p["found_ids"] = []
            if "completed_keys" not in p:
                p["completed_keys"] = []
            return p
    return {"completed_keys": [], "found_ids": []}


def save_progress(completed_keys, seen_ids):
    with open(PROGRESS_FILE, "w") as f:
        json.dump({
            "completed_keys": list(completed_keys),
            "found_ids": list(seen_ids),
            "last_saved": datetime.now().isoformat(),
        }, f, indent=2)


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  Netherlands Salon & Barbershop Scraper")
    print("=" * 60)

    if API_KEY == "YOUR_GOOGLE_PLACES_API_KEY":
        print("\n❌  Please set your API_KEY in this script before running.")
        print("    Get one at: https://console.cloud.google.com")
        sys.exit(1)

    # Build task list
    grid = build_grid(LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX, GRID_STEP)
    tasks = []
    for lat, lng in grid:
        for pt in PLACE_TYPES:
            tasks.append((lat, lng, "type", pt))
        for kw in KEYWORDS:
            tasks.append((lat, lng, "keyword", kw))

    # Cost estimate (rough)
    nearby_calls_est   = len(tasks) * 1.3  # 30% need a page 2
    detail_calls_est   = 12_000            # rough expected unique results
    cost_est = (nearby_calls_est / 1000 * 32) + (detail_calls_est / 1000 * 17)

    print(f"\n  Grid points   : {len(grid):,}")
    print(f"  Search tasks  : {len(tasks):,}")
    print(f"  Cost estimate : ~${cost_est:.0f} in API credits")
    print(f"  Output file   : {OUTPUT_CSV}")
    print()
    print("  💡 Tip: set a $200 billing cap in Google Cloud Console")
    print("          to avoid surprises.")
    print()

    cont = input("  Proceed? (y/n): ").strip().lower()
    if cont != "y":
        print("Aborted.")
        return

    # Load resume state
    progress      = load_progress()
    seen_ids      = set(progress["found_ids"])
    completed_keys = set(progress["completed_keys"])

    print(f"\n  Resuming from: {len(completed_keys):,} completed tasks, "
          f"{len(seen_ids):,} known businesses\n")

    # Open CSV (append mode so we can resume)
    csv_is_new = not os.path.exists(OUTPUT_CSV) or os.path.getsize(OUTPUT_CSV) == 0
    csvfile = open(OUTPUT_CSV, "a", newline="", encoding="utf-8-sig")  # utf-8-sig = Excel-friendly
    fieldnames = [
        "name", "place_id", "address", "phone", "phone_intl",
        "website", "rating", "review_count", "business_status",
        "types", "google_maps_url", "lat", "lng", "scraped_at",
    ]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    if csv_is_new:
        writer.writeheader()

    new_this_run = 0
    start_time   = time.time()

    for i, (lat, lng, mode, value) in enumerate(tasks):
        task_key = f"{lat},{lng},{mode},{value}"
        if task_key in completed_keys:
            continue

        # Progress log every 100 tasks
        if i % 100 == 0:
            elapsed = (time.time() - start_time) / 60
            pct = i / len(tasks) * 100
            print(f"  [{pct:5.1f}%] Task {i:,}/{len(tasks):,} | "
                  f"Total found: {len(seen_ids):,} | "
                  f"New: {new_this_run:,} | "
                  f"Elapsed: {elapsed:.1f}m")

        # Paginate through all results for this search
        page_token = None
        page_num   = 0

        while True:
            if mode == "type":
                data = nearby_search(lat, lng, place_type=value,
                                     page_token=page_token, radius=SEARCH_RADIUS)
            else:
                data = nearby_search(lat, lng, keyword=value,
                                     page_token=page_token, radius=SEARCH_RADIUS)

            for place in data.get("results", []):
                pid = place.get("place_id")
                if not pid or pid in seen_ids:
                    continue
                seen_ids.add(pid)

                # Fetch details (phone, website, etc.)
                time.sleep(0.08)  # gentle rate limit
                details = get_details(pid)

                loc = place.get("geometry", {}).get("location", {})
                row = {
                    "name"           : place.get("name", ""),
                    "place_id"       : pid,
                    "address"        : details.get("formatted_address",
                                                    place.get("vicinity", "")),
                    "phone"          : details.get("formatted_phone_number", ""),
                    "phone_intl"     : details.get("international_phone_number", ""),
                    "website"        : details.get("website", ""),
                    "rating"         : place.get("rating", ""),
                    "review_count"   : place.get("user_ratings_total", ""),
                    "business_status": place.get("business_status", ""),
                    "types"          : ", ".join(details.get("types", [])),
                    "google_maps_url": details.get("url", ""),
                    "lat"            : loc.get("lat", ""),
                    "lng"            : loc.get("lng", ""),
                    "scraped_at"     : datetime.now().strftime("%Y-%m-%d %H:%M"),
                }
                writer.writerow(row)
                csvfile.flush()
                new_this_run += 1

            # Check for next page
            next_token = data.get("next_page_token")
            if not next_token or page_num >= 2:  # Google returns max 3 pages
                break
            page_num  += 1
            time.sleep(2)  # Required — next_page_token isn't valid immediately
            page_token = next_token

        completed_keys.add(task_key)

        # Save progress every 50 tasks
        if i % 50 == 0:
            save_progress(completed_keys, seen_ids)

        time.sleep(0.1)

    csvfile.close()
    save_progress(completed_keys, seen_ids)

    elapsed_total = (time.time() - start_time) / 60
    print("\n" + "=" * 60)
    print(f"  ✅  Done!")
    print(f"  Total unique businesses : {len(seen_ids):,}")
    print(f"  New this run            : {new_this_run:,}")
    print(f"  Time elapsed            : {elapsed_total:.1f} minutes")
    print(f"  Output                  : {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == "__main__":
    main()
