# Singhal Medicare LLP — Pharmacy & Clinic Website

A premium, fully animated, multi-page website for **Singhal Medicare LLP**, a family pharmacy and specialist clinic in Shikohabad, Firozabad (Uttar Pradesh). Built with **HTML, CSS, JavaScript, Python, and Java** — every layer of the stack is used.

Watermark: **Made by Aryan Sharma** (footer).

---

## Quick start

### 1. Open the website
Double-click `index.html` — it works as a standalone file (no build step, no server required).

Or serve it locally with Python:
```bash
python python/server.py
# → http://localhost:8000/
```

### 2. Run the Python utilities
```bash
# Schedule report (text)
python python/schedule_report.py

# Schedule report (JSON)
python python/schedule_report.py --json

# Export doctor schedule as .ics (Google / Apple / Outlook calendar)
python python/ics_export.py
# → writes build/singhal-medicare-schedule.ics
```

### 3. Compile & run the Java utilities
```bash
javac -d build/java java/ScheduleReport.java java/MedicineCheck.java

# Weekly schedule report
java -cp build/java ScheduleReport
java -cp build/java ScheduleReport --json

# Medicine availability checker (prints a ready WhatsApp link)
java -cp build/java MedicineCheck "Paracetamol 650 mg"
java -cp build/java MedicineCheck --hi "पैरासिटामोल 650"
```

---

## Pages (page-in-page SPA)

Hash routing keeps everything in one HTML shell — no reloads, instant transitions:

| Route        | What it shows                                                                 |
|--------------|-------------------------------------------------------------------------------|
| `#/home`     | Hero with 3D floating capsule, stats, quick actions, "Sitting today" strip    |
| `#/pharmacy` | Medicine availability checker → opens WhatsApp with a prepared message        |
| `#/doctors`  | All 8 doctors with search, category chips, "Today" tag, detail modal          |
| `#/about`    | Family-pharmacy story, 3D rotating cube, values                               |
| `#/visit`    | Address, hours, live open/closed status, embedded Google Map, FAQs            |

---

## Features

### Frontend (HTML / CSS / JavaScript)
- **3D design** — CSS 3D transforms: floating capsule, spinning medical cross, rotating about-cube, dashed orbital rings, parallax on mouse move.
- **Animations** — scroll reveals, count-up stats, hover tilts, page transitions, pulsing "Today" tag, shimmer effects.
- **Bilingual** — full English ↔ हिन्दी toggle; choice is persisted in `localStorage`.
- **IST-aware open/closed pill** — uses India Standard Time, not the visitor's local timezone, so the status is always correct for the clinic.
- **"Sitting today" tag** — doctors with fixed days (Dr. Shuchita Bharadwaj, Dr. R.K. Verma) get a live *Today* badge when their day matches in IST. Dr. Manshi Bansal is configured as daily per the supplied information.
- **WhatsApp medicine check** — type a medicine name, the site opens `wa.me/919457088602` with a prepared message in the active language.
- **Doctor detail modal** — specialty, sitting days, timing, about, call / WhatsApp / maps buttons.
- **Search + category chips** — filter the 8-doctor directory by name, specialty, or "Today".
- **Address copy** — one-click clipboard copy with toast confirmation.
- **Embedded Google Map** — iframe pointing at Station Road, Shikohabad.
- **Mobile sticky bar** — Call / WhatsApp / Maps always one tap away on small screens.
- **Responsive** — fluid from 320 px phones to wide desktops; hamburger nav under 860 px.
- **Accessibility** — `prefers-reduced-motion` honoured, semantic landmarks, ARIA labels, keyboard-dismissible modal (Esc), focus-visible states.
- **Watermark** — "Made by **Aryan Sharma**" pill in the footer with gradient border.

### Backend companions (Python)
- `python/server.py` — `ThreadingHTTPServer` that serves the static site **and** exposes a JSON API:
  - `GET /api/clinic` — full clinic + doctors payload
  - `GET /api/status` — `{ open, ist_time, message }`
  - `GET /api/doctors/today` — doctors sitting today (IST)
  - `GET /api/health` — liveness probe
- `python/schedule_report.py` — CLI report: pharmacy status, today's doctors, weekly grid, full list. Supports `--json`.
- `python/ics_export.py` — generates an RFC 5545 `.ics` calendar with `RRULE:FREQ=WEEKLY;BYDAY=…` for every doctor who has a fixed sitting day, including a 30-minute `VALARM`.

### Backend companions (Java)
- `java/ScheduleReport.java` — same weekly schedule report as Python, implemented with a hand-rolled JSON parser (no external deps). Supports `--json`.
- `java/MedicineCheck.java` — console medicine checker that prints a ready-to-send `wa.me` deep link, a `tel:` link, and a counter-staff checklist. Supports `--hi` / `--en`.

---

## Project structure

```
.
├── index.html                  # SPA shell — all 5 pages
├── css/
│   ├── style.css               # design system, layout, components
│   ├── animations.css          # keyframes, reveals, reduced-motion
│   └── responsive.css          # breakpoints down to 320 px
├── js/
│   ├── i18n.js                 # EN / HI dictionary + setLang()
│   ├── doctors.js              # doctor data, IST helpers, open-state
│   ├── pharmacy.js             # WhatsApp deep link, address copy, toast
│   ├── animations.js           # reveal observer, 3D tilt, counters
│   └── app.js                  # router, renders, modal, wiring
├── data/
│   └── clinic.json             # single source of truth (Python + Java read this)
├── python/
│   ├── server.py               # static server + JSON API
│   ├── schedule_report.py      # CLI schedule report
│   └── ics_export.py           # .ics calendar generator
├── java/
│   ├── ScheduleReport.java     # CLI schedule report (JDK only)
│   └── MedicineCheck.java      # CLI medicine → WhatsApp link
└── build/                      # generated (gitignored) — .ics, compiled .class
```

---

## Business data

| Field       | Value                                                                                       |
|-------------|---------------------------------------------------------------------------------------------|
| Legal name  | Singhal Medicare LLP                                                                        |
| Kind        | Pharmacy & Clinic                                                                           |
| Address     | Opposite Ahuja Hospital, Station Road, Khera Mohalla, Shikohabad, Firozabad, UP 283135      |
| Phone       | +91 94570 88602                                                                             |
| WhatsApp    | 919457088602                                                                                |
| Hours       | Every day, 8:30 AM – 8:00 PM IST                                                            |
| Payments    | Cash, Debit / Credit card, Google Pay, PhonePe, Paytm, UPI                                  |

### Doctors
| Name                     | Specialty                              | Sitting                       |
|--------------------------|----------------------------------------|-------------------------------|
| Dr. Manshi Bansal        | General Physician                      | Daily · 10:00 AM – 5:00 PM    |
| Dr. Mukesh Chaturvedi    | General Surgeon                        | Call for timing               |
| Dr. S.D. Sharma          | Neurologist                            | Call for timing               |
| Dr. Shuchita Bharadwaj   | Cosmetologist                          | Wed, Fri · 11:00 AM – 2:00 PM |
| Dr. R.K. Verma           | Dermatologist & Cosmetologist          | Tue, Sat · 3:00 PM – 5:00 PM  |
| Dr. Nancy Yadav          | Gynecologist                           | Call for timing               |
| Dr. Virat Tiwari         | Pediatrician                           | Call for timing               |
| Dr. Anup Kumar           | Ayurvedic Specialist (Ksharsutra)      | Call for timing               |

> **Note:** Dr. Manshi Bansal's supplied hours (10 AM – 5 PM) had no day restriction, so the site treats this as a daily sitting. Please confirm with the clinic if this should be limited to specific days.

---

## Design language

- **Palette** — deep clinical green (`#0b6b3a`), ivory (`#f7f3e6`), saffron accent (`#f59e0b`), WhatsApp green for messaging CTAs.
- **Typography** — *Fraunces* (display serif) for headings, *Inter* for UI, *Noto Sans Devanagari* for Hindi.
- **Motion** — every interaction has a transition; 3D elements rotate continuously but pause under `prefers-reduced-motion`.
- **Glassmorphism** — frosted cards on the pharmacy and visit pages.

---

## Deployment

The site is pure static files. Drop the whole folder on any static host:

- **Netlify** — drag-and-drop the folder, or `netlify deploy --prod --dir=.`
- **Vercel** — `vercel --prod`
- **GitHub Pages** — push and enable Pages on the root
- **Any nginx / Apache** — point the document root at this folder

The Python server is for local development only; it is **not** required in production. All "live" behaviour (open/closed, today's doctors) is computed client-side in JavaScript using IST, so the deployed site stays correct without a backend.

---

## Disclaimer

Doctor timings may change; please call before visiting. Always take medicines as advised by your doctor.

---

**Made by Aryan Sharma**
