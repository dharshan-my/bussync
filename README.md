# bussync

> **Karnataka's Next-Gen Intelligent Bus Monitoring & Fleet Mobility System**  
> *"My Bus, My Journey."*

BusSync is a real-time public transit tracking and intelligent fleet management system engineered with a vibrant Karnataka-themed visual identity (Deep Crimson `#C8102E` and Amber Gold `#FFC72C`). It delivers live bus trajectory monitoring, telemetry diagnostics, ticketing machine integration, and transit control center analytics.

---

## 🌟 Key Features

### 1. 🎛️ Karnataka Mobility Control Center (Admin Dashboard)
- **Live Fleet Telemetry**: Real-time metrics on active buses, operational routes, and fleet health.
- **Interactive Route Tracking**: Visual live journey cockpit HUD displaying stops, speed, next arrival, and driver status.
- **Fleet & Route Management**: Instant scheduling, bus onboarding, and driver assignment.
- **Machine Fleet Control**: Automated ticketing machine pairing, status logs, and battery diagnostics.

### 2. 🚏 Next-Gen Passenger Live Tracker
- **Real-Time Arrival Predictions**: Live countdowns and distance estimations for upcoming transit stops.
- **Dynamic Cockpit HUD**: Holographic telemetry card displaying speed (km/h), delay status, passenger occupancy, and GPS fix.
- **Animated Trajectory Ribbon**: Gliding bus indicator mapping transit progress between sequential checkpoints.
- **Authentic Karnataka HSRP Integration**: High-Security Registration Plate (`[ IND 🇮🇳 ] KA-xx-x-xxxx`) styling.

### 3. 🎫 Ticketing Machine (TM) Module
- **Handheld Terminal Simulation**: Real-time ticket issuing interface with route selection and ticket print preview.
- **Automated Session Sync**: Real-time synchronization between ticketing machines, active trips, and the central control room.

---

## 🚀 Tech Stack

- **Backend**: FastAPI (Python), WebSockets for real-time live streaming, SQLite database
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Babel standalone
- **Design System**: Karnataka Red & Yellow palette, glassmorphism telemetry HUD, responsive mobile & desktop layout

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.9+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dharshan-my/bussync.git
   cd bussync
   ```

2. **Install dependencies**
   ```bash
   pip install fastapi uvicorn websockets pydantic
   ```

3. **Start the BusSync Server**
   ```bash
   python main.py
   ```
   The application will start at `http://127.0.0.1:5000`.

4. **Run Live Route Simulation (Optional)**
   To simulate live bus movement and stop updates in real time:
   ```bash
   python simulate.py
   ```

---

## 📂 Project Structure

```text
├── main.py              # FastAPI server, REST endpoints, and WebSocket hub
├── simulate.py          # Real-time bus GPS and route movement simulator
├── bussync.db           # SQLite database (auto-initialized on first run)
├── static/
│   ├── index.html       # Single Page Application entry point
│   └── js/
│       ├── app.bundle.js# Compiled production bundle
│       ├── app.js       # React application source components
│       ├── lucide.min.js# Icon library
│       └── babel.min.js # In-browser JSX transformer
└── README.md            # Project documentation
```

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
