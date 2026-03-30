# Technical Boundaries & Stack

**Edge Simulator:** Python. Use `requests`, `time`, `json`, `random`. Must simulate MPU6050 (shock) and DHT22 (temp). Must have a hotkey/toggle to simulate network drop/reconnect.

**Backend:** Python, FastAPI, Uvicorn, SQLite3. Zero-config database. Endpoints: `POST /ingest` (single or bulk), `GET /telemetry`.

**Frontend:** React, Next.js, Tailwind CSS, Recharts (for telemetry graphs).

**Rules:**
- Keep all files modular.
- Do not use deprecated libraries.
- Comment the "Store-Carry-Forward" logic explicitly so it can be highlighted in the demo video.
