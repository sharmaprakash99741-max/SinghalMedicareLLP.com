#!/usr/bin/env python3
"""
Singhal Medicare LLP — Local development server + JSON API
=============================================================
Serves the static site (index.html, css/, js/, data/) and exposes a
small JSON API that mirrors what the frontend already computes client-
side. Useful for local testing and for any future backend integration.

Endpoints:
    GET  /                       → index.html
    GET  /api/clinic             → clinic + doctors JSON
    GET  /api/status             → { open, ist_time, message }
    GET  /api/doctors/today      → list of doctors sitting today (IST)
    GET  /api/health             → { ok: true }

Run:
    python python/server.py
    python python/server.py --port 8080
Then open http://localhost:8000/
"""

from __future__ import annotations
import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

IST = timezone(timedelta(hours=5, minutes=30), name="IST")
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


def pharmacy_state(data: dict) -> dict:
    now = now_ist()
    hours = data["clinic"]["hours"]
    o_h, o_m = parse_hhmm(hours["open"])
    c_h, c_m = parse_hhmm(hours["close"])
    now_min = now.hour * 60 + now.minute
    is_open = (o_h * 60 + o_m) <= now_min < (c_h * 60 + c_m)
    return {
        "open": is_open,
        "ist_time": now.strftime("%H:%M"),
        "ist_date": now.strftime("%A, %d %B %Y"),
        "message": (
            f"Open now · closes at {hours['close']}"
            if is_open
            else f"Closed · opens at {hours['open']}"
        ),
    }


def sitting_today(data: dict) -> list[dict]:
    now = now_ist()
    js_day = (now.weekday() + 1) % 7
    out = []
    for d in data["doctors"]:
        days = d.get("days")
        if days is None:
            out.append(d)
        elif isinstance(days, list) and days and js_day in days:
            out.append(d)
    return out


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _send_json(self, payload, status: int = 200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        path = urlparse(self.path).path
        try:
            data = load_data()
        except Exception as e:
            self._send_json({"error": f"failed to load data: {e}"}, 500)
            return

        if path == "/api/health":
            return self._send_json({"ok": True, "time_ist": now_ist().isoformat()})
        if path == "/api/clinic":
            return self._send_json(data)
        if path == "/api/status":
            return self._send_json(pharmacy_state(data))
        if path == "/api/doctors/today":
            return self._send_json({"date_ist": now_ist().strftime("%A, %d %B %Y"),
                                    "doctors": sitting_today(data)})
        return super().do_GET()


def main() -> int:
    ap = argparse.ArgumentParser(description="Singhal Medicare local server")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()

    if not DATA.exists():
        print(f"[error] missing {DATA}", file=sys.stderr)
        return 2

    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"[ok] Singhal Medicare local server")
    print(f"     → http://{args.host}:{args.port}/")
    print(f"     → http://{args.host}:{args.port}/api/status")
    print(f"     → http://{args.host}:{args.port}/api/doctors/today")
    print("     Ctrl+C to stop")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[ok] stopped")
    finally:
        srv.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
