"""
=============================================================================
  PROJECT SARAK EDGE — EDGE NODE SIMULATOR
  Role: Edge Architect (Python)
  HackHustle 2026

  Simulates an ESP32 / nRF9160 field device with:
    • MPU6050  — 3-axis accelerometer (shock detection)
    • DHT22    — Temperature & Humidity sensor

  ════════════════════════════════════════════════════════════
  ██████████████  STORE-CARRY-FORWARD (DTN) LOGIC  █████████
  ════════════════════════════════════════════════════════════

  NETWORK UP   → POST packet directly to backend (/ingest)
  NETWORK DOWN → Append packet to local buffer.json
  RECONNECT    → Read buffer.json, POST entire array to /ingest
                 as packet_type='BUFFERED', then wipe buffer.json

  ── HOW TO TOGGLE NETWORK (for demo) ──
  Create the file:   network_down.txt   to simulate network loss
  Delete the file:   network_down.txt   to simulate reconnection

  Windows PowerShell:
    # Drop:      New-Item network_down.txt
    # Restore:   Remove-Item network_down.txt
=============================================================================
"""

import requests
import time
import json
import random
import os
import sys
from datetime import datetime

# ─── CONFIGURATION ────────────────────────────────────────────────────────────

BACKEND_URL     = "http://127.0.0.1:8000/ingest"
DEVICE_ID       = "EDGE-NODE-001"
SEND_INTERVAL   = 2          # seconds between readings
NETWORK_FLAG    = os.path.join(os.path.dirname(__file__), "network_down.txt")
BUFFER_FILE     = os.path.join(os.path.dirname(__file__), "buffer.json")

# ─── TERMINAL COLOUR HELPERS (ANSI) ──────────────────────────────────────────

GREEN  = "\033[92m"
ORANGE = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def log(colour: str, tag: str, msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{colour}{BOLD}[{ts}] [{tag}]{RESET}{colour} {msg}{RESET}")


# ─── SENSOR SIMULATION ────────────────────────────────────────────────────────

def read_dht22() -> dict:
    """
    Simulate a DHT22 Temperature & Humidity sensor.
    Real range: Temp -40–80°C, Humidity 0–100%
    """
    return {
        "temperature": round(random.uniform(18.0, 45.0), 2),
        "humidity":    round(random.uniform(30.0, 90.0), 2),
    }


def read_mpu6050() -> dict:
    """
    Simulate an MPU6050 3-axis accelerometer (shock/vibration detection).
    Returns g-force units. A parked vehicle ≈ 0.0; a road bump > 0.5g.
    """
    # Occasionally simulate a shock event for drama in the demo
    shock_event = random.random() < 0.15   # 15% chance of spike
    scale = random.uniform(0.4, 1.8) if shock_event else random.uniform(0.0, 0.2)
    return {
        "shock_x": round(random.uniform(-scale, scale), 4),
        "shock_y": round(random.uniform(-scale, scale), 4),
        "shock_z": round(random.uniform(0.8 - scale * 0.1,
                                         1.0 + scale * 0.1), 4),  # gravity baseline
    }


def build_packet(packet_type: str = "LIVE") -> dict:
    """Assemble a full telemetry packet from all sensors."""
    return {
        "device_id":      DEVICE_ID,
        "packet_type":    packet_type,
        "timestamp_edge": time.time(),
        **read_dht22(),
        **read_mpu6050(),
    }


# ─── BUFFER HELPERS ──────────────────────────────────────────────────────────

def load_buffer() -> list:
    """
    ── STORE: Read the local buffer from disk ──
    Returns an empty list if the file doesn't exist or is corrupt.
    """
    if not os.path.exists(BUFFER_FILE):
        return []
    try:
        with open(BUFFER_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def save_buffer(buffer: list):
    """
    ── CARRY: Persist the buffer to disk ──
    Data survives process crashes or power resets (as an embedded device would).
    """
    with open(BUFFER_FILE, "w") as f:
        json.dump(buffer, f, indent=2)


def clear_buffer():
    """── FORWARD-complete: Wipe the buffer after a successful sync ──"""
    if os.path.exists(BUFFER_FILE):
        os.remove(BUFFER_FILE)


# ─── NETWORK STATE ───────────────────────────────────────────────────────────

def network_is_down() -> bool:
    """
    The network state is controlled by the presence of a flag file.
    This mimics a real embedded-device GPIO or connectivity-manager signal.

    Create   network_down.txt  →  simulate link loss
    Delete   network_down.txt  →  simulate link restore
    """
    return os.path.exists(NETWORK_FLAG)


# ─── BACKEND COMMUNICATION ───────────────────────────────────────────────────

def post_to_backend(packets: list) -> bool:
    """
    Send one or more packets to the FastAPI /ingest endpoint.
    Returns True on HTTP 2xx, False on any network/server error.
    """
    try:
        payload = {"packets": packets}
        resp = requests.post(BACKEND_URL, json=payload, timeout=5)
        resp.raise_for_status()
        return True
    except requests.exceptions.ConnectionError:
        log(RED, "ERROR", "Backend unreachable. Is the server running?")
    except requests.exceptions.Timeout:
        log(RED, "ERROR", "POST timed out.")
    except requests.exceptions.HTTPError as e:
        log(RED, "ERROR", f"HTTP {e.response.status_code}: {e.response.text}")
    return False


# ─── DTN SYNC — THE MONEY SHOT ───────────────────────────────────────────────

def attempt_dtn_sync():
    """
    ══════════════════════════════════════════════════════════
    ██  STORE-CARRY-FORWARD (DTN) SYNC ROUTINE              ██
    ══════════════════════════════════════════════════════════

    Called every cycle BEFORE reading new sensor data.
    If there are buffered packets AND the network is back UP:
      1) CARRY  — load buffer.json from disk
      2) FORWARD— POST the entire array to backend as 'BUFFERED' packets
      3) CLEAR  — wipe buffer.json to prevent duplicate syncs

    The backend stores each packet with packet_type='BUFFERED' so the
    dashboard can visually distinguish recovered data (orange) from
    live data (green). This is the core DTN proof-of-concept.
    ══════════════════════════════════════════════════════════
    """
    buffer = load_buffer()
    if not buffer:
        return   # Nothing buffered — nothing to do

    if network_is_down():
        log(ORANGE, "DTN", f"{len(buffer)} packet(s) still buffered. Network still DOWN. Holding.")
        return

    # ── Network restored, buffer has data — execute the sync ──
    count = len(buffer)

    print()
    print(f"{CYAN}{BOLD}{'═'*60}{RESET}")
    print(f"{CYAN}{BOLD}  ██████  DTN SYNC INITIATED  ██████{RESET}")
    print(f"{CYAN}{BOLD}  ⚡ Network connection RESTORED{RESET}")
    print(f"{CYAN}{BOLD}  📦 {count} Buffered Packet(s) queued for upload{RESET}")
    print(f"{CYAN}{BOLD}{'═'*60}{RESET}")
    print()

    # Tag every packet as BUFFERED so the dashboard colours them orange
    for pkt in buffer:
        pkt["packet_type"] = "BUFFERED"

    success = post_to_backend(buffer)

    if success:
        clear_buffer()
        print()
        print(f"{GREEN}{BOLD}{'█'*60}{RESET}")
        print(f"{GREEN}{BOLD}  [DTN SYNC] ✅ {count} Buffered Packet(s) Pushed to Backend!{RESET}")
        print(f"{GREEN}{BOLD}  [DTN SYNC] 💾 Local buffer.json cleared.{RESET}")
        print(f"{GREEN}{BOLD}  [DTN SYNC] 🟢 Resuming LIVE transmission.{RESET}")
        print(f"{GREEN}{BOLD}{'█'*60}{RESET}")
        print()
    else:
        log(RED, "DTN SYNC", f"❌ Sync FAILED. Keeping {count} packets in buffer. Will retry.")


# ─── MAIN LOOP ───────────────────────────────────────────────────────────────

def main():
    print()
    print(f"{CYAN}{BOLD}{'═'*60}")
    print(f"  PROJECT SARAK EDGE — Edge Node Simulator")
    print(f"  Device ID : {DEVICE_ID}")
    print(f"  Backend   : {BACKEND_URL}")
    print(f"  Interval  : {SEND_INTERVAL}s")
    print(f"{'═'*60}{RESET}")
    print(f"{ORANGE}  Toggle network: create/delete '{os.path.basename(NETWORK_FLAG)}'{RESET}")
    print(f"{CYAN}{BOLD}{'═'*60}{RESET}")
    print()

    cycle = 0

    while True:
        try:
            cycle += 1

            # ── Step 1: Check for pending DTN sync on every cycle ──────────
            attempt_dtn_sync()

            # ── Step 2: Read sensors ────────────────────────────────────────
            packet = build_packet(packet_type="LIVE")

            # ── Step 3: STORE-CARRY-FORWARD decision ────────────────────────
            if network_is_down():
                # ── STORE: Network is DOWN — buffer the packet locally ──────
                buffer = load_buffer()
                buffer.append(packet)
                save_buffer(buffer)

                log(ORANGE, "BUFFER",
                    f"🔴 Network DOWN | Packet #{cycle} stored locally. "
                    f"Buffer size: {len(buffer)}")

            else:
                # ── FORWARD: Network is UP — send directly to backend ───────
                success = post_to_backend([packet])

                if success:
                    log(GREEN, "LIVE",
                        f"🟢 Packet #{cycle} sent | "
                        f"Temp={packet['temperature']}°C  "
                        f"Hum={packet['humidity']}%  "
                        f"Shock=({packet['shock_x']:.3f}, "
                        f"{packet['shock_y']:.3f}, "
                        f"{packet['shock_z']:.3f}g)")
                else:
                    # ── STORE: POST failed (transient) — buffer anyway ──────
                    buffer = load_buffer()
                    buffer.append(packet)
                    save_buffer(buffer)
                    log(ORANGE, "BUFFER",
                        f"⚠️  POST failed. Packet #{cycle} buffered. "
                        f"Buffer size: {len(buffer)}")

            time.sleep(SEND_INTERVAL)

        except KeyboardInterrupt:
            print()
            print(f"{RED}{BOLD}[SIMULATOR] Ctrl+C detected. Shutting down edge node.{RESET}")
            remaining = len(load_buffer())
            if remaining:
                print(f"{ORANGE}{BOLD}[SIMULATOR] ⚠️  {remaining} packet(s) remain in buffer.json — "
                      f"they will sync on next startup.{RESET}")
            sys.exit(0)


if __name__ == "__main__":
    main()
