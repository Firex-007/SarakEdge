# Project SarakEdge: MVP Context
**Goal:** Build a working prototype for HackHustle 2026. The system proves "Store-Carry-Forward" (DTN) logic for offline-resilient logistics telemetry.

**Core Philosophy:** Logistics networks drop. We don't drop data. If the network is down, we buffer at the edge. If it's up, we sync.

**Scope Constraint:** STRICTLY MVP. No authentication, no complex cloud deployments. We are building a local demonstration to record a 2-minute validation video.

**The 3 Components:**
1. Edge Node Simulator (Python script acting as ESP32/nRF9160).
2. Backend (FastAPI + SQLite).
3. Frontend Dashboard (Next.js + Tailwind).
