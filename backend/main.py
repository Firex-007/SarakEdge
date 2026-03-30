"""
=============================================================================
  PROJECT SARAK EDGE — BACKEND
  Role: Backend Engineer (FastAPI + SQLite)
  HackHustle 2026
=============================================================================
  Endpoints:
    POST /ingest        — Accept a single packet OR a bulk array of packets
    GET  /telemetry     — Return last 50 telemetry records
=============================================================================
"""

import sqlite3
import time
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ─── DATABASE SETUP ──────────────────────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(__file__), "telemetry.db")


def get_db():
    """Create a new SQLite connection for each request."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # Return rows as dict-like objects
    return conn


def init_db():
    """
    Zero-config database bootstrap.
    Creates the telemetry table if it does not exist.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id       TEXT    NOT NULL,
            temperature     REAL    NOT NULL,
            humidity        REAL    NOT NULL,
            shock_x         REAL    NOT NULL,
            shock_y         REAL    NOT NULL,
            shock_z         REAL    NOT NULL,
            packet_type     TEXT    NOT NULL DEFAULT 'LIVE',
            timestamp_edge  REAL    NOT NULL,
            timestamp_server REAL   NOT NULL DEFAULT (strftime('%s', 'now'))
        )
    """)
    conn.commit()
    conn.close()
    print("[BACKEND] ✅ SQLite database initialised at:", DB_PATH)


# ─── FASTAPI LIFESPAN ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup logic before the server accepts requests."""
    init_db()
    print("[BACKEND] 🚀 SarakEdge FastAPI server is live.")
    yield
    print("[BACKEND] 🛑 Server shutting down.")


# ─── APP INITIALISATION ───────────────────────────────────────────────────────

app = FastAPI(
    title="SarakEdge Telemetry API",
    description="Store-Carry-Forward logistics telemetry backend — HackHustle 2026",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow Next.js frontend (localhost:3000) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # MVP: open CORS; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── PYDANTIC MODELS ──────────────────────────────────────────────────────────

class TelemetryPacket(BaseModel):
    """
    A single telemetry reading from the edge node.
    packet_type:
       'LIVE'      — sent in real time (green on dashboard)
       'BUFFERED'  — recovered via Store-Carry-Forward sync (orange on dashboard)
    """
    device_id:      str
    temperature:    float
    humidity:       float
    shock_x:        float
    shock_y:        float
    shock_z:        float
    packet_type:    Optional[str] = "LIVE"   # 'LIVE' | 'BUFFERED'
    timestamp_edge: float                     # Unix epoch from edge node


class BulkIngestPayload(BaseModel):
    """Wrapper for bulk DTN sync — carries an array of packets."""
    packets: List[TelemetryPacket]


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "SarakEdge Backend Online ✅"}


@app.post("/ingest", status_code=201, tags=["Telemetry"])
def ingest(payload: BulkIngestPayload):
    """
    Accept a bulk array of telemetry packets.
    Called with a single packet:  { "packets": [ {...} ] }
    Called after DTN sync:        { "packets": [ {...}, {...}, ... ] }

    ── STORE-CARRY-FORWARD: This is the receiving end ──
    When the edge node comes back online, it POSTs the entire local
    buffer as a single bulk request here. Each packet carries
    packet_type='BUFFERED' so the dashboard can highlight them differently.
    """
    if not payload.packets:
        raise HTTPException(status_code=400, detail="No packets provided.")

    conn = get_db()
    cursor = conn.cursor()

    rows_inserted = 0
    server_time = time.time()

    for pkt in payload.packets:
        cursor.execute("""
            INSERT INTO telemetry
              (device_id, temperature, humidity, shock_x, shock_y, shock_z,
               packet_type, timestamp_edge, timestamp_server)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pkt.device_id,
            pkt.temperature,
            pkt.humidity,
            pkt.shock_x,
            pkt.shock_y,
            pkt.shock_z,
            pkt.packet_type,
            pkt.timestamp_edge,
            server_time,
        ))
        rows_inserted += 1

    conn.commit()
    conn.close()

    # Log bulk syncs visibly so they stand out in the demo
    if rows_inserted > 1:
        print(f"[BACKEND] 📦 [DTN BULK SYNC] {rows_inserted} buffered packets committed to DB.")
    else:
        pkt = payload.packets[0]
        print(f"[BACKEND] 📡 [LIVE] {pkt.device_id} | "
              f"Temp={pkt.temperature}°C  Humidity={pkt.humidity}%  "
              f"Shock=({pkt.shock_x:.2f}, {pkt.shock_y:.2f}, {pkt.shock_z:.2f})")

    return {
        "status": "ok",
        "inserted": rows_inserted,
        "message": f"{rows_inserted} packet(s) stored successfully.",
    }


@app.get("/telemetry", tags=["Telemetry"])
def get_telemetry(limit: int = 50):
    """
    Return the last `limit` telemetry records (default 50), newest first.
    The dashboard uses packet_type to colour-code LIVE vs BUFFERED records.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM telemetry
        ORDER BY timestamp_server DESC
        LIMIT ?
    """, (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"count": len(rows), "records": rows}


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
