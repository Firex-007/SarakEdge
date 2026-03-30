<div align="center">

# ⚡ SarakEdge
### Store-Carry-Forward Logistics Telemetry System

*HackHustle 2026 Submission*

[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)

</div>

---

## 🧠 The Problem

Logistics networks in remote or developing regions **drop constantly** — cellular dead zones, satellite gaps, rural infrastructure gaps. Standard IoT systems **lose that data forever**.

SarakEdge proves a different approach: **if the network is down, we don't drop data — we carry it**.

---

## 🔁 Store → Carry → Forward (DTN)

```
NETWORK UP   →  Edge Node POSTs packet directly to backend  (LIVE)
NETWORK DOWN →  Packet is appended to local buffer.json      (STORED)
RECONNECT    →  Entire buffer POSTed as a bulk batch          (FORWARDED)
              →  Dashboard marks recovered data in AMBER      (RECOVERED)
```

This is **Delay-Tolerant Networking (DTN)** — a resilience pattern used in deep-space communications, now applied to last-mile logistics.

---

## 🏗 Architecture

```
┌────────────────────────────────────────┐
│  Edge Node Simulator (Python)          │
│  • Simulates MPU6050 (shock) + DHT22   │
│  • Detects network state via flag file │
│  • Buffers to buffer.json offline      │
│  • Bulk-syncs on reconnect             │
└──────────────┬─────────────────────────┘
               │ HTTP POST /ingest
               ▼
┌────────────────────────────────────────┐
│  FastAPI Backend (Python)              │
│  • SQLite DB (zero-config)             │
│  • POST /ingest — single or bulk       │
│  • GET  /telemetry — last 50 records   │
│  • Stores packet_type: LIVE/BUFFERED   │
└──────────────┬─────────────────────────┘
               │ REST API (port 8000)
               ▼
┌────────────────────────────────────────┐
│  Next.js Dashboard (TypeScript)        │
│  • Polls /telemetry every 3s           │
│  • 🟢 Green = LIVE packets             │
│  • 🟠 Amber = RECOVERED/BUFFERED       │
│  • Detects DTN sync events → toast     │
│  • Recharts telemetry timeline         │
│  • DTN Resilience ring gauge           │
└────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20 LTS

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API docs: http://127.0.0.1:8000/docs

### 2. Edge Simulator
```bash
cd edge
pip install -r requirements.txt
python simulator.py
```

### 3. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Dashboard: http://localhost:3000

---

## 🎬 Demo: Simulating a Network Outage

Open a third terminal in the `edge/` directory:

```powershell
# SIMULATE OUTAGE — creates the flag file
New-Item -ItemType File -Name network_down.txt

# ... wait 15-20 seconds — watch packets buffer in amber ...

# RESTORE — deletes the flag file, triggers DTN sync
Remove-Item network_down.txt
```

Watch the terminal **explode** with the DTN sync banner, and the dashboard **toast** appear with recovered packet count.

---

## 📁 Project Structure

```
SarakEdge/
├── backend/
│   ├── main.py              # FastAPI + SQLite server
│   └── requirements.txt
├── edge/
│   ├── simulator.py         # DTN edge node simulator
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Modular UI components
│   │   ├── hooks/           # useTelemetry polling hook
│   │   └── lib/             # API client + types
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔑 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `network_down.txt` flag file | Mimics an embedded device's connectivity-manager signal — no extra dependencies |
| Bulk `/ingest` endpoint | One POST for 1 or N packets — edge doesn't need separate retry logic |
| `packet_type` field | Carries provenance (LIVE vs BUFFERED) through the entire pipeline to the UI |
| SQLite | Zero-config, file-based — perfect for a local demo/hackathon with no cloud required |
| 3s polling vs WebSocket | Simpler to demo; the 3s lag is negligible for logistics telemetry |

---

<div align="center">

**Built for HackHustle 2026** · *Data resilience at the edge*

</div>
