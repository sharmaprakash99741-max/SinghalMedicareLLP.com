#!/usr/bin/env python3
"""
Singhal Medicare LLP — Schedule Report Utility
================================================
Reads data/clinic.json and prints:
  1. Whether the pharmacy is open right now (IST).
  2. Which doctors are sitting today (IST).
  3. A weekly schedule grid.

Run:
    python python/schedule_report.py
    python python/schedule_report.py --json
"""

from __future__ import annotations
import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

IST = timezone(timedelta(hours=5, minutes=30), name="IST")
DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "clinic.json"


def load_data() -> dict:
    with DATA.open("r", encoding="utf-8") as f:
        return json.load(f)


def now_ist() -> datetime:
    return datetime.now(IST)


def parse_hhmm(s: str) -> tuple[int, int]:
    h, m = s.split(":")
    return int(h), int(m)


def pharmacy_open(data: dict, now: datetime) -> tuple[bool, str]:
    hours = data["clinic"]["hours"]
    o_h, o_m = parse_hhmm(hours["open"])
    c_h, c_m = parse_hhmm(hours["close"])
    now_min = now.hour * 60 + now.minute
    open_min = o_h * 60 + o_m
    close_min = c_h * 60 + c_m
    is_open = open_min <= now_min < close_min and now.weekday() != 6 or (
        open_min <= now_min < close_min
    )  # open every day per config
    # Simplified: days list from config includes all 7
    if now.isoweekday() % 7 not in hours["days"]:
        return False, f"Closed today ({DAY_NAMES[now.weekday() % 7] if now.weekday() < 6 else 'Sunday'})"
    label = "Open" if is_open else "Closed"
    return is_open, f"{label} · {hours['open']}–{hours['close']} IST · now {now.strftime('%H:%M')}"


def is_sitting_today(doc: dict, now: datetime) -> bool:
    days = doc.get("days")
    if days is None:
        return True
    if not isinstance(days, list) or not days:
        return False
    # JS getDay(): 0=Sun..6=Sat ; Python weekday(): 0=Mon..6=Sun
    js_day = (now.weekday() + 1) % 7
    return js_day in days


def weekly_grid(data: dict) -> list[list[str]]:
    grid: list[list[str]] = [[] for _ in range(7)]
    for doc in data["doctors"]:
        days = doc.get("days")
        if days is None:
            targets = list(range(7))
        elif isinstance(days, list) and days:
            targets = days
        else:
            continue
        for d in targets:
            grid[d % 7].append(f"{doc['name']} ({doc['time']})")
    return grid


def render_text(data: dict) -> str:
    now = now_ist()
    out: list[str] = []
    out.append("=" * 66)
    out.append(f" {data['clinic']['legal_name']} — Schedule Report")
    out.append(f" {data['clinic']['kind']} · {data['clinic']['address']['city']}, {data['clinic']['address']['state']}")
    out.append("=" * 66)
    out.append(f" Generated: {now.strftime('%A, %d %B %Y · %H:%M %Z')}")
    out.append(f" Phone    : {data['clinic']['phone']}")
    out.append(f" WhatsApp : +{data['clinic']['whatsapp']}")
    out.append("")

    is_open, status = pharmacy_open(data, now)
    out.append(f" Pharmacy : {status}")
    out.append(f" Payments : {', '.join(data['clinic']['payments'])}")
    out.append("")

    out.append("-" * 66)
    out.append(" Sitting today (IST)")
    out.append("-" * 66)
    today_docs = [d for d in data["doctors"] if is_sitting_today(d, now)]
    if today_docs:
        for d in today_docs:
            out.append(f"  • {d['name']:<28} {d['specialty']:<38} {d['time']}")
    else:
        out.append("  (no doctor scheduled today — please call to confirm)")
    out.append("")

    out.append("-" * 66)
    out.append(" Weekly schedule")
    out.append("-" * 66)
    grid = weekly_grid(data)
    # JS day order: Sun..Sat
    order = [0, 1, 2, 3, 4, 5, 6]
    names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    for idx in order:
        out.append(f" {names[idx]}:")
        if grid[idx]:
            for entry in grid[idx]:
                out.append(f"    - {entry}")
        else:
            out.append("    - (no fixed sitting)")
        out.append("")

    out.append("-" * 66)
    out.append(" Full doctor list")
    out.append("-" * 66)
    for d in data["doctors"]:
        out.append(f"  {d['name']} — {d['specialty']}")
        out.append(f"     Time: {d['time']}")
        days = d.get("days")
        if days is None:
            day_txt = "Every day"
        elif isinstance(days, list) and days:
            day_txt = ", ".join(names[x % 7] for x in days)
        else:
            day_txt = "No fixed day — call for timing"
        out.append(f"     Days: {day_txt}")
        if d.get("note"):
            out.append(f"     Note: {d['note']}")
        out.append("")

    out.append("=" * 66)
    out.append(" Disclaimer: Doctor timings may change. Please call before visiting.")
    out.append(" Always take medicines as advised by your doctor.")
    out.append("=" * 66)
    return "\n".join(out)


def render_json(data: dict) -> str:
    now = now_ist()
    payload = {
        "generated_at_ist": now.isoformat(),
        "pharmacy": pharmacy_open(data, now)[1],
        "sitting_today": [
            {"name": d["name"], "specialty": d["specialty"], "time": d["time"]}
            for d in data["doctors"]
            if is_sitting_today(d, now)
        ],
        "doctors": data["doctors"],
    }
    return json.dumps(payload, indent=2, ensure_ascii=False)


def main() -> int:
    ap = argparse.ArgumentParser(description="Singhal Medicare schedule report")
    ap.add_argument("--json", action="store_true", help="output as JSON")
    args = ap.parse_args()

    if not DATA.exists():
        print(f"[error] data file not found: {DATA}", file=sys.stderr)
        return 2
    data = load_data()
    print(render_json(data) if args.json else render_text(data))
    return 0


if __name__ == "__main__":
    sys.exit(main())
