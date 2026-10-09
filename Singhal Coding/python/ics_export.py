#!/usr/bin/env python3
"""
Singhal Medicare LLP — ICS Calendar Export
============================================
Generates a .ics file with weekly recurring events for every doctor
who has a fixed sitting day. Import it into Google Calendar, Apple
Calendar, or Outlook so patients can see sitting days at a glance.

Run:
    python python/ics_export.py
    # → writes build/singhal-medicare-schedule.ics
"""

from __future__ import annotations
import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

IST = timezone(timedelta(hours=5, minutes=30))
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "clinic.json"
OUT  = ROOT / "build" / "singhal-medicare-schedule.ics"

# Python weekday(): Mon=0..Sun=6 ; JS getDay(): Sun=0..Sat=6
JS_TO_PY = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
PY_DAY_ABBR = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]


def load() -> dict:
    with DATA.open("r", encoding="utf-8") as f:
        return json.load(f)


def fold(line: str) -> str:
    """RFC 5545 requires lines <= 75 octets, folded with CRLF + space."""
    out = []
    b = line.encode("utf-8")
    while len(b) > 74:
        cut = 74
        # avoid splitting a UTF-8 char
        while cut > 0 and (b[cut] & 0xC0) == 0x80:
            cut -= 1
        out.append(b[:cut].decode("utf-8", errors="ignore"))
        b = b[cut:]
    out.append(b.decode("utf-8", errors="ignore"))
    return "\r\n ".join(out)


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def parse_hhmm(s: str) -> tuple[int, int]:
    h, m = s.split(":")
    return int(h), int(m)


def next_weekday_start(target_py_weekday: int, hour: int, minute: int) -> datetime:
    """Return the next occurrence of target weekday at given time in IST."""
    now = datetime.now(IST)
    delta = (target_py_weekday - now.weekday()) % 7
    day = (now + timedelta(days=delta)).replace(hour=hour, minute=minute, second=0, microsecond=0)
    if day <= now:
        day = day + timedelta(days=7)
    return day


def build_vevent(doc: dict, clinic: dict) -> list[str]:
    days = doc.get("days")
    start_s, end_s = doc.get("start"), doc.get("end")
    if not start_s or not end_s:
        return []  # no fixed timing → skip
    sh, sm = parse_hhmm(start_s)
    eh, em = parse_hhmm(end_s)

    if days is None:
        # daily
        byday = ",".join(PY_DAY_ABBR)
        first_py = 0  # Monday
    elif isinstance(days, list) and days:
        py_days = sorted({JS_TO_PY[d % 7] for d in days})
        byday = ",".join(PY_DAY_ABBR[d] for d in py_days)
        first_py = py_days[0]
    else:
        return []

    dtstart = next_weekday_start(first_py, sh, sm)
    dtend   = dtstart.replace(hour=eh, minute=em)
    if dtend <= dtstart:
        dtend = dtend + timedelta(days=1)

    uid = f"{doc['id']}-{uuid.uuid4().hex[:8]}@singhal-medicare.local"
    now_stamp = datetime.now(IST).strftime("%Y%m%dT%H%M%S")

    lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{now_stamp}",
        f"DTSTART;TZID=Asia/Kolkata:{dtstart.strftime('%Y%m%dT%H%M%S')}",
        f"DTEND;TZID=Asia/Kolkata:{dtend.strftime('%Y%m%dT%H%M%S')}",
        f"RRULE:FREQ=WEEKLY;BYDAY={byday}",
        f"SUMMARY:{esc(doc['name'] + ' — ' + doc['specialty'])}",
        f"DESCRIPTION:{esc('Singhal Medicare LLP · ' + doc['time'] + '. Timings may change; please call before visiting.')}",
        f"LOCATION:{esc(clinic['legal_name'] + ', ' + clinic['address']['line1'] + ', ' + clinic['address']['city'] + ', ' + clinic['address']['state'] + ' ' + clinic['address']['pincode'])}",
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Doctor sitting in 30 minutes",
        "END:VALARM",
        "END:VEVENT",
    ]
    return [fold(l) for l in lines]


def build_vtimezone() -> list[str]:
    return [
        "BEGIN:VTIMEZONE",
        "TZID:Asia/Kolkata",
        "BEGIN:STANDARD",
        "DTSTART:19700101T000000",
        "TZOFFSETFROM:+0530",
        "TZOFFSETTO:+0530",
        "TZNAME:IST",
        "END:STANDARD",
        "END:VTIMEZONE",
    ]


def main() -> int:
    data = load()
    clinic = data["clinic"]
    events: list[str] = []
    for doc in data["doctors"]:
        events.extend(build_vevent(doc, clinic))

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Singhal Medicare LLP//Schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{esc(clinic['legal_name'] + ' — Doctor Schedule')}",
        "X-WR-TIMEZONE:Asia/Kolkata",
    ]
    lines.extend(build_vtimezone())
    lines.extend(events)
    lines.append("END:VCALENDAR")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\r\n".join(lines) + "\r\n", encoding="utf-8")
    print(f"[ok] wrote {OUT}  ({len(events) // 12} doctor events)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
