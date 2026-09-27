import sqlite3
import json
import logging
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BusSync API")
DB_FILE = "bussync.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS buses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_number TEXT UNIQUE,
            status TEXT DEFAULT 'Active'
        );
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            origin TEXT,
            destination TEXT,
            status TEXT DEFAULT 'Active'
        );
        CREATE TABLE IF NOT EXISTS stops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER,
            name TEXT,
            stop_order INTEGER,
            status TEXT DEFAULT 'Active',
            FOREIGN KEY(route_id) REFERENCES routes(id)
        );
        CREATE TABLE IF NOT EXISTS machines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_code TEXT UNIQUE,
            status TEXT DEFAULT 'Available'
        );
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id INTEGER,
            route_id INTEGER,
            machine_id INTEGER,
            status TEXT DEFAULT 'Scheduled',
            start_time DATETIME,
            end_time DATETIME,
            current_stop_id INTEGER,
            next_stop_id INTEGER,
            FOREIGN KEY(bus_id) REFERENCES buses(id),
            FOREIGN KEY(route_id) REFERENCES routes(id),
            FOREIGN KEY(machine_id) REFERENCES machines(id)
        );
        CREATE TABLE IF NOT EXISTS machine_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER,
            bus_id INTEGER,
            trip_id INTEGER,
            connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            disconnected_at DATETIME,
            status TEXT DEFAULT 'Active',
            FOREIGN KEY(machine_id) REFERENCES machines(id),
            FOREIGN KEY(bus_id) REFERENCES buses(id),
            FOREIGN KEY(trip_id) REFERENCES trips(id)
        );
        CREATE TABLE IF NOT EXISTS stop_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER,
            stop_id INTEGER,
            reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(trip_id) REFERENCES trips(id),
            FOREIGN KEY(stop_id) REFERENCES stops(id)
        );
        CREATE TABLE IF NOT EXISTS conductors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conductor_id TEXT UNIQUE,
            name TEXT,
            phone TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notification_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            passenger_id TEXT,
            bus_id INTEGER,
            trip_id INTEGER,
            notify_trip_start INTEGER DEFAULT 0,
            notify_my_stop INTEGER DEFAULT 0,
            notify_destination INTEGER DEFAULT 0,
            selected_stop_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            passenger_id TEXT,
            bus_id INTEGER,
            trip_id INTEGER,
            type TEXT,
            title TEXT,
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("PRAGMA table_info(trips)")
    cols = [r[1] for r in cursor.fetchall()]
    if 'conductor_id' not in cols:
        cursor.execute("ALTER TABLE trips ADD COLUMN conductor_id INTEGER REFERENCES conductors(id)")

    cursor.execute("SELECT COUNT(*) FROM buses")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
    else:
        cursor.execute("SELECT COUNT(*) FROM conductors")
        if cursor.fetchone()[0] == 0:
            seed_conductors(cursor)

    conn.commit()
    conn.close()

def seed_conductors(cursor):
    conductors = [
        ('C101', 'Ramesh Kumar', '+91 98450 12345', 'Active'),
        ('C102', 'Suresh Gowda', '+91 98450 67890', 'Active'),
        ('C103', 'Anand Patil', '+91 98450 54321', 'Active'),
        ('C104', 'Manjunath B', '+91 98450 99887', 'Active')
    ]
    cursor.executemany("INSERT INTO conductors (conductor_id, name, phone, status) VALUES (?, ?, ?, ?)", conductors)
    cursor.execute("UPDATE trips SET conductor_id = 2 WHERE id = 1")
    cursor.execute("UPDATE trips SET conductor_id = 3 WHERE id = 2")

def seed_data(cursor):
    logger.info("Seeding database...")
    buses = [('KA-01-1234',), ('KA-01-4567',), ('KA-05-7890',), ('KA-02-3456',), ('KA-41-2345',), ('KA-06-6789',)]
    cursor.executemany("INSERT INTO buses (bus_number) VALUES (?)", buses)
    
    machines = [('M101',), ('M102',), ('M103',), ('M104',), ('M105',)]
    cursor.executemany("INSERT INTO machines (machine_code) VALUES (?)", machines)
    
    routes = [
        ('Tumakuru → Bengaluru', 'Tumakuru', 'Bengaluru'), 
        ('Bengaluru → Mysuru', 'Bengaluru', 'Mysuru'), 
        ('Bengaluru → Kolar', 'Bengaluru', 'Kolar'),
        ('Bengaluru → Hosur', 'Bengaluru', 'Hosur')
    ]
    cursor.executemany("INSERT INTO routes (name, origin, destination) VALUES (?, ?, ?)", routes)
    
    r1_stops = [(1, 'Tumakuru', 1), (1, 'Kunigal', 2), (1, 'Nelamangala', 3), (1, 'Yeshwanthpur', 4), (1, 'Bengaluru', 5)]
    cursor.executemany("INSERT INTO stops (route_id, name, stop_order) VALUES (?, ?, ?)", r1_stops)
    
    r2_stops = [(2, 'Bengaluru', 1), (2, 'Ramanagara', 2), (2, 'Mandya', 3), (2, 'Mysuru', 4)]
    cursor.executemany("INSERT INTO stops (route_id, name, stop_order) VALUES (?, ?, ?)", r2_stops)
    
    r3_stops = [(3, 'Bengaluru', 1), (3, 'Hoskote', 2), (3, 'Kolar', 3)]
    cursor.executemany("INSERT INTO stops (route_id, name, stop_order) VALUES (?, ?, ?)", r3_stops)

    r4_stops = [(4, 'Bengaluru', 1), (4, 'Hosur', 2)]
    cursor.executemany("INSERT INTO stops (route_id, name, stop_order) VALUES (?, ?, ?)", r4_stops)

    seed_conductors(cursor)

    cursor.execute("INSERT INTO trips (bus_id, route_id, machine_id, conductor_id, status, start_time, current_stop_id, next_stop_id) VALUES (1, 1, 2, 2, 'Active', CURRENT_TIMESTAMP, 2, 3)")
    trip1_id = cursor.lastrowid
    cursor.execute("INSERT INTO machine_sessions (machine_id, bus_id, trip_id) VALUES (2, 1, ?)", (trip1_id,))
    cursor.execute("UPDATE machines SET status = 'In Use' WHERE id = 2")
    cursor.execute("INSERT INTO stop_updates (trip_id, stop_id) VALUES (?, 2)", (trip1_id,))

    cursor.execute("INSERT INTO trips (bus_id, route_id, machine_id, conductor_id, status, start_time, current_stop_id, next_stop_id) VALUES (2, 2, 5, 3, 'Active', CURRENT_TIMESTAMP, 7, 8)")
    trip2_id = cursor.lastrowid
    cursor.execute("INSERT INTO machine_sessions (machine_id, bus_id, trip_id) VALUES (5, 2, ?)", (trip2_id,))
    cursor.execute("UPDATE machines SET status = 'In Use' WHERE id = 5")
    cursor.execute("INSERT INTO stop_updates (trip_id, stop_id) VALUES (?, 7)", (trip2_id,))

    cursor.execute("INSERT INTO trips (bus_id, route_id, conductor_id, status) VALUES (3, 3, 1, 'Scheduled')")

init_db()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    async def broadcast(self, message: str):
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except:
                self.active_connections.remove(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Request Models
class AddBusReq(BaseModel): bus_number: str; status: str
class EditBusReq(BaseModel): bus_number: str
class CreateTripReq(BaseModel):
    bus_id: int
    route_id: int
    conductor_id: Optional[int] = None
    machine_id: Optional[int] = None
class StartTripReq(BaseModel): machine_code: str; bus_number: str
class ReportStopReq(BaseModel): machine_code: str; stop_id: int
class EndTripReq(BaseModel): machine_code: str
class AddRouteReq(BaseModel): name: str; origin: str; destination: str; status: str
class EditRouteReq(BaseModel): name: str; origin: str; destination: str
class AddMachineReq(BaseModel): machine_code: str; status: str
class AddStopReq(BaseModel): name: str
class EditStopReq(BaseModel): name: str
class ReorderStopsReq(BaseModel): stops: List[dict]
class AddConductorReq(BaseModel): conductor_id: str; name: str; phone: str; status: str = 'Active'
class EditConductorReq(BaseModel): name: str; phone: str
class SubscribeReq(BaseModel): trip_id: int; notify_trip_start: bool; notify_my_stop: bool; notify_destination: bool; selected_stop_id: Optional[int] = None

def get_machine_session(cursor, machine_code):
    cursor.execute('''
        SELECT ms.*, t.id as trip_id, t.route_id, b.bus_number
        FROM machine_sessions ms
        JOIN machines m ON ms.machine_id = m.id
        JOIN trips t ON ms.trip_id = t.id
        JOIN buses b ON ms.bus_id = b.id
        WHERE m.machine_code = ? AND ms.status = 'Active'
    ''', (machine_code,))
    return cursor.fetchone()

def map_passenger_status(status, last_update_str):
    if status == 'Scheduled': return '🟡 Scheduled'
    if status == 'Completed': return '✓ Completed'
    if status == 'Active':
        if not last_update_str: return '🟢 Travelling'
        try:
            last_update = datetime.strptime(last_update_str, '%Y-%m-%d %H:%M:%S')
            if datetime.utcnow() - last_update > timedelta(minutes=15):
                return '🟠 No recent update'
        except: pass
        return '🟢 Travelling'
    return status

# ======== NOTIFICATION SYSTEM ========
async def create_notification(cursor, passenger_id, bus_id, trip_id, n_type, title, message):
    cursor.execute('''INSERT INTO notifications (passenger_id, bus_id, trip_id, type, title, message)
                      VALUES (?, ?, ?, ?, ?, ?)''', (passenger_id, bus_id, trip_id, n_type, title, message))
    notification_id = cursor.lastrowid
    cursor.execute("SELECT * FROM notifications WHERE id=?", (notification_id,))
    n = dict(cursor.fetchone())
    await manager.broadcast(json.dumps({"type": "NEW_NOTIFICATION", "passenger_id": passenger_id, "notification": n}))

@app.post("/api/passenger/{passenger_id}/subscribe")
async def subscribe_notifications(passenger_id: str, req: SubscribeReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT bus_id FROM trips WHERE id = ?", (req.trip_id,))
    trip = cursor.fetchone()
    if not trip:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
        
    cursor.execute("DELETE FROM notification_subscriptions WHERE passenger_id = ? AND trip_id = ?", (passenger_id, req.trip_id))
    
    if req.notify_trip_start or req.notify_my_stop or req.notify_destination:
        cursor.execute("""
            INSERT INTO notification_subscriptions 
            (passenger_id, bus_id, trip_id, notify_trip_start, notify_my_stop, notify_destination, selected_stop_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (passenger_id, trip['bus_id'], req.trip_id, 
              1 if req.notify_trip_start else 0, 
              1 if req.notify_my_stop else 0, 
              1 if req.notify_destination else 0, 
              req.selected_stop_id))
              
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/passenger/{passenger_id}/subscription/{trip_id}")
async def get_subscription(passenger_id: str, trip_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notification_subscriptions WHERE passenger_id = ? AND trip_id = ?", (passenger_id, trip_id))
    sub = cursor.fetchone()
    conn.close()
    if sub:
        return dict(sub)
    return None

@app.get("/api/passenger/{passenger_id}/notifications")
async def get_notifications(passenger_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications WHERE passenger_id = ? ORDER BY created_at DESC LIMIT 50", (passenger_id,))
    notifs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notifs

@app.put("/api/passenger/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.put("/api/passenger/{passenger_id}/notifications/read-all")
async def mark_all_notifications_read(passenger_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE passenger_id = ?", (passenger_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}


# ======== ADMIN: ROUTES & STOPS ========
@app.get("/api/admin/routes")
async def get_admin_routes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.*, COUNT(DISTINCT s.id) as stop_count,
               (SELECT COUNT(id) FROM trips WHERE route_id = r.id AND status IN ('Active','Scheduled')) as active_trips
        FROM routes r
        LEFT JOIN stops s ON s.route_id = r.id
        GROUP BY r.id
        ORDER BY r.id DESC
    """)
    routes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return routes

@app.post("/api/routes")
async def add_route(req: AddRouteReq):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO routes (name, origin, destination, status) VALUES (?, ?, ?, ?)", (req.name, req.origin, req.destination, req.status))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Route name already exists")
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.put("/api/routes/{route_id}/status")
async def update_route_status(route_id: int, status: str = Query(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE routes SET status = ? WHERE id = ?", (status, route_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.get("/api/routes/{route_id}/stops")
async def get_route_stops(route_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stops WHERE route_id = ? ORDER BY stop_order ASC", (route_id,))
    stops = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return stops

@app.post("/api/routes/{route_id}/stops")
async def add_route_stop(route_id: int, req: AddStopReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(stop_order) FROM stops WHERE route_id = ?", (route_id,))
    max_order = cursor.fetchone()[0] or 0
    cursor.execute("INSERT INTO stops (route_id, name, stop_order) VALUES (?, ?, ?)", (route_id, req.name, max_order + 1))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.put("/api/routes/{route_id}/stops/reorder")
async def reorder_stops(route_id: int, req: ReorderStopsReq):
    conn = get_db()
    cursor = conn.cursor()
    for s in req.stops:
        cursor.execute("UPDATE stops SET stop_order = ? WHERE id = ? AND route_id = ?", (s['stop_order'], s['id'], route_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

# ======== ADMIN: BUSES & TRIPS ========
@app.post("/api/buses")
async def add_bus(req: AddBusReq):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO buses (bus_number, status) VALUES (?, ?)", (req.bus_number.upper(), req.status))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Bus number already exists")
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.get("/api/admin/buses")
async def get_admin_buses():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id, b.bus_number, b.status as bus_status,
               t.id as trip_id, t.status as trip_status,
               r.name as route_name, m.machine_code, s.name as current_stop
        FROM buses b
        LEFT JOIN trips t ON b.id = t.bus_id AND t.status IN ('Scheduled', 'Active')
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN stops s ON t.current_stop_id = s.id
        ORDER BY b.id DESC
    """)
    buses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return buses

@app.post("/api/admin/trips")
async def create_trip(req: CreateTripReq):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Bus check
    cursor.execute("SELECT status FROM buses WHERE id = ?", (req.bus_id,))
    bus = cursor.fetchone()
    if not bus or bus['status'] != 'Active':
        conn.close()
        raise HTTPException(status_code=400, detail="Selected bus is inactive or not found.")
        
    # 2. Route check
    cursor.execute("SELECT status FROM routes WHERE id = ?", (req.route_id,))
    route = cursor.fetchone()
    if not route or route['status'] != 'Active':
        conn.close()
        raise HTTPException(status_code=400, detail="Selected route is inactive or not found.")

    cursor.execute("SELECT COUNT(*) FROM stops WHERE route_id = ?", (req.route_id,))
    if cursor.fetchone()[0] < 2:
        conn.close()
        raise HTTPException(status_code=400, detail="Route must have at least 2 stops before scheduling a trip.")
        
    cursor.execute("SELECT id FROM trips WHERE bus_id = ? AND status IN ('Scheduled', 'Active')", (req.bus_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Bus already has a scheduled or active trip.")
        
    if req.conductor_id:
        cursor.execute("SELECT id, status FROM conductors WHERE id = ?", (req.conductor_id,))
        cond = cursor.fetchone()
        if not cond or cond['status'] != 'Active':
            conn.close()
            raise HTTPException(status_code=400, detail="Selected conductor is inactive or not found.")
        cursor.execute("SELECT id FROM trips WHERE conductor_id = ? AND status IN ('Scheduled', 'Active')", (req.conductor_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Conductor is already assigned to another active or scheduled trip.")

    if req.machine_id:
        cursor.execute("SELECT status FROM machines WHERE id = ?", (req.machine_id,))
        m = cursor.fetchone()
        if not m or m['status'] != 'Available':
            conn.close()
            raise HTTPException(status_code=400, detail="Selected machine is currently in use or unavailable.")
        
    cursor.execute("""
        INSERT INTO trips (bus_id, route_id, conductor_id, machine_id, status)
        VALUES (?, ?, ?, ?, 'Scheduled')
    """, (req.bus_id, req.route_id, req.conductor_id, req.machine_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    await manager.broadcast(json.dumps({"type": "PASSENGER_UPDATE"}))
    return {"status": "success"}

# ======== CONDUCTOR API ========
@app.post("/api/trip/start")
async def start_trip(req: StartTripReq):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM machines WHERE machine_code = ?", (req.machine_code,))
    machine = cursor.fetchone()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    cursor.execute("SELECT id FROM buses WHERE bus_number = ?", (req.bus_number,))
    bus = cursor.fetchone()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
        
    cursor.execute("SELECT id FROM machine_sessions WHERE machine_id = ? AND status = 'Active'", (machine['id'],))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Machine is already in use")
        
    cursor.execute("SELECT id, route_id FROM trips WHERE bus_id = ? AND status = 'Scheduled'", (bus['id'],))
    trip = cursor.fetchone()
    if not trip:
        raise HTTPException(status_code=400, detail="No scheduled trip found for this bus. Admin must create a trip first.")
    
    cursor.execute("SELECT id as stop_id FROM stops WHERE route_id = ? ORDER BY stop_order ASC LIMIT 2", (trip['route_id'],))
    stops = cursor.fetchall()
    first_stop_id = stops[0]['stop_id'] if len(stops) > 0 else None
    next_stop_id = stops[1]['stop_id'] if len(stops) > 1 else None
        
    cursor.execute("""
        UPDATE trips 
        SET status = 'Active', machine_id = ?, start_time = CURRENT_TIMESTAMP, 
            current_stop_id = ?, next_stop_id = ?
        WHERE id = ?
    """, (machine['id'], first_stop_id, next_stop_id, trip['id']))
    
    cursor.execute("INSERT INTO machine_sessions (machine_id, bus_id, trip_id) VALUES (?, ?, ?)", (machine['id'], bus['id'], trip['id']))
    cursor.execute("UPDATE machines SET status = 'In Use' WHERE id = ?", (machine['id'],))
    
    if first_stop_id:
        cursor.execute("INSERT INTO stop_updates (trip_id, stop_id) VALUES (?, ?)", (trip['id'], first_stop_id))
    
    # Process Notifications: TRIP_STARTED
    cursor.execute("SELECT passenger_id FROM notification_subscriptions WHERE trip_id = ? AND notify_trip_start = 1", (trip['id'],))
    subscribers = cursor.fetchall()
    for row in subscribers:
        await create_notification(cursor, row['passenger_id'], bus['id'], trip['id'], 'TRIP_STARTED', 'Trip Started', f"🚌 {req.bus_number} has started its journey.")
    
    conn.commit()
    conn.close()
    
    await manager.broadcast(json.dumps({"type": "TRIP_STARTED", "bus_number": req.bus_number, "trip_id": trip['id']}))
    return {"status": "success", "trip_id": trip['id']}

@app.post("/api/trip/update")
async def update_trip(req: ReportStopReq):
    conn = get_db()
    cursor = conn.cursor()
    
    session = get_machine_session(cursor, req.machine_code)
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
        
    trip_id = session['trip_id']
    route_id = session['route_id']
    
    cursor.execute("SELECT stop_order, name FROM stops WHERE route_id = ? AND id = ?", (route_id, req.stop_id))
    current_stop_order_row = cursor.fetchone()
    if not current_stop_order_row:
        raise HTTPException(status_code=400, detail="Stop does not belong to the active route")
        
    current_order = current_stop_order_row['stop_order']
    stop_name = current_stop_order_row['name']
    
    cursor.execute("SELECT id as stop_id FROM stops WHERE route_id = ? AND stop_order > ? ORDER BY stop_order ASC LIMIT 1", (route_id, current_order))
    next_stop_row = cursor.fetchone()
    next_stop_id = next_stop_row['stop_id'] if next_stop_row else None
    
    cursor.execute("UPDATE trips SET current_stop_id = ?, next_stop_id = ? WHERE id = ?", (req.stop_id, next_stop_id, trip_id))
    cursor.execute("INSERT INTO stop_updates (trip_id, stop_id) VALUES (?, ?)", (trip_id, req.stop_id))
    
    # Process Notifications: STOP_REPORTED
    cursor.execute("SELECT passenger_id FROM notification_subscriptions WHERE trip_id = ? AND notify_my_stop = 1 AND selected_stop_id = ?", (trip_id, req.stop_id))
    subscribers = cursor.fetchall()
    for row in subscribers:
        await create_notification(cursor, row['passenger_id'], session['bus_id'], trip_id, 'STOP_REPORTED', 'Stop Reported', f"📍 {session['bus_number']} has reported {stop_name}.")
    
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "STOP_UPDATED", "bus_number": session['bus_number'], "trip_id": trip_id}))
    return {"status": "success", "next_stop_id": next_stop_id}

@app.post("/api/trip/end")
async def end_trip(req: EndTripReq):
    conn = get_db()
    cursor = conn.cursor()
    session = get_machine_session(cursor, req.machine_code)
    if session:
        cursor.execute("UPDATE trips SET status = 'Completed', end_time = CURRENT_TIMESTAMP WHERE id = ?", (session['trip_id'],))
        cursor.execute("UPDATE machine_sessions SET status = 'Closed', disconnected_at = CURRENT_TIMESTAMP WHERE id = ?", (session['id'],))
        cursor.execute("UPDATE machines SET status = 'Available' WHERE id = ?", (session['machine_id'],))
        
        # Process Notifications: DESTINATION_REACHED
        cursor.execute("SELECT passenger_id FROM notification_subscriptions WHERE trip_id = ? AND notify_destination = 1", (session['trip_id'],))
        subscribers = cursor.fetchall()
        for row in subscribers:
            await create_notification(cursor, row['passenger_id'], session['bus_id'], session['trip_id'], 'DESTINATION_REACHED', 'Destination Reached', f"✓ {session['bus_number']} has reached its destination.")
        
        conn.commit()
        await manager.broadcast(json.dumps({"type": "TRIP_ENDED", "bus_number": session['bus_number'], "trip_id": session['trip_id']}))
    conn.close()
    return {"status": "success"}


@app.post("/api/machines")
async def add_machine(req: AddMachineReq):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO machines (machine_code, status) VALUES (?, ?)", (req.machine_code.upper(), req.status))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Machine code already exists")
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.get("/api/admin/machines")
async def get_admin_machines():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, 
               (SELECT COUNT(*) FROM machine_sessions WHERE machine_id = m.id) as total_sessions,
               (SELECT ms.connected_at FROM machine_sessions ms WHERE ms.machine_id = m.id ORDER BY ms.id DESC LIMIT 1) as last_used
        FROM machines m
        ORDER BY m.id DESC
    ''')
    machines = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return machines

@app.get("/api/admin/activity")
async def get_admin_activity():
    conn = get_db()
    cursor = conn.cursor()
    # Get last 20 events (trip starts, stops, ends)
    cursor.execute('''
        SELECT 'TRIP_START' as event_type, b.bus_number, r.name as route_name, NULL as stop_name, ms.connected_at as timestamp
        FROM machine_sessions ms
        JOIN trips t ON ms.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        UNION ALL
        SELECT 'STOP_REPORT', b.bus_number, r.name, s.name, su.reported_at
        FROM stop_updates su
        JOIN trips t ON su.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        JOIN stops s ON su.stop_id = s.id
        UNION ALL
        SELECT 'TRIP_END', b.bus_number, r.name, NULL, ms.disconnected_at
        FROM machine_sessions ms
        JOIN trips t ON ms.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE ms.disconnected_at IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 20
    ''')
    activity = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return activity

@app.get("/api/admin/history/trips")
async def get_trip_history():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.id, t.status, t.start_time, t.end_time,
               b.bus_number, r.name as route_name, m.machine_code
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN machines m ON t.machine_id = m.id
        WHERE t.status = 'Completed'
        ORDER BY t.end_time DESC
        LIMIT 50
    ''')
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

@app.get("/api/admin/history/machines")
async def get_machine_history():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT ms.id, ms.connected_at, ms.disconnected_at, ms.status,
               m.machine_code, b.bus_number, r.name as route_name
        FROM machine_sessions ms
        JOIN machines m ON ms.machine_id = m.id
        JOIN buses b ON ms.bus_id = b.id
        JOIN trips t ON ms.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        ORDER BY ms.connected_at DESC
        LIMIT 50
    ''')
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

@app.delete("/api/admin/routes/{route_id}")
async def delete_route(route_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM stops WHERE route_id = ?", (route_id,))
    cursor.execute("DELETE FROM routes WHERE id = ?", (route_id,))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.delete("/api/admin/buses/{bus_id}")
async def delete_bus(bus_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM buses WHERE id = ?", (bus_id,))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.delete("/api/admin/machines/{machine_id}")
async def delete_machine(machine_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM machines WHERE id = ?", (machine_id,))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

# ======== CONTROL CENTER: CONDUCTORS CRUD ========
@app.get("/api/admin/conductors")
async def get_admin_conductors():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*,
               t.id as current_trip_id, t.status as trip_status,
               b.bus_number as current_bus, r.name as current_route,
               (SELECT reported_at FROM stop_updates su WHERE su.trip_id = t.id ORDER BY reported_at DESC LIMIT 1) as last_active
        FROM conductors c
        LEFT JOIN trips t ON c.id = t.conductor_id AND t.status IN ('Active', 'Scheduled')
        LEFT JOIN buses b ON t.bus_id = b.id
        LEFT JOIN routes r ON t.route_id = r.id
        ORDER BY c.id ASC
    """)
    conductors = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return conductors

@app.post("/api/admin/conductors")
async def add_conductor(req: AddConductorReq):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO conductors (conductor_id, name, phone, status) VALUES (?, ?, ?, ?)",
                       (req.conductor_id.upper(), req.name, req.phone, req.status))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Conductor ID already exists")
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.put("/api/admin/conductors/{conductor_id}")
async def edit_conductor(conductor_id: int, req: EditConductorReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE conductors SET name = ?, phone = ? WHERE id = ?", (req.name, req.phone, conductor_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.post("/api/admin/conductors/{conductor_id}/toggle")
async def toggle_conductor(conductor_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM conductors WHERE id = ?", (conductor_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Conductor not found")
    new_status = 'Inactive' if row['status'] == 'Active' else 'Active'
    if new_status == 'Inactive':
        cursor.execute("SELECT id FROM trips WHERE conductor_id = ? AND status = 'Active'", (conductor_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot deactivate a conductor currently on an active trip.")
    cursor.execute("UPDATE conductors SET status = ? WHERE id = ?", (new_status, conductor_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success", "new_status": new_status}

@app.delete("/api/admin/conductors/{conductor_id}")
async def delete_conductor(conductor_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM trips WHERE conductor_id = ? AND status = 'Active'", (conductor_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete conductor with an ongoing active trip.")
    cursor.execute("DELETE FROM conductors WHERE id = ?", (conductor_id,))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

# ======== CONTROL CENTER: GLOBAL STOPS MANAGEMENT ========
@app.get("/api/admin/stops")
async def get_admin_stops():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, r.name as route_name, r.origin, r.destination,
               (SELECT COUNT(id) FROM trips WHERE route_id = s.route_id AND status = 'Active') as active_route_trips
        FROM stops s
        JOIN routes r ON s.route_id = r.id
        ORDER BY s.route_id ASC, s.stop_order ASC
    """)
    stops = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return stops

@app.put("/api/stops/{stop_id}")
async def edit_stop(stop_id: int, req: EditStopReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE stops SET name = ? WHERE id = ?", (req.name, stop_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.delete("/api/stops/{stop_id}")
async def delete_stop(stop_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT route_id FROM stops WHERE id = ?", (stop_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Stop not found")
    cursor.execute("SELECT id FROM trips WHERE route_id = ? AND status = 'Active'", (row['route_id'],))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete a stop from a route that currently has an active trip.")
    cursor.execute("DELETE FROM stops WHERE id = ?", (stop_id,))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.post("/api/admin/stops/{stop_id}/toggle")
async def toggle_stop(stop_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM stops WHERE id = ?", (stop_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Stop not found")
    new_status = 'Inactive' if row['status'] == 'Active' else 'Active'
    cursor.execute("UPDATE stops SET status = ? WHERE id = ?", (new_status, stop_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success", "new_status": new_status}

# ======== CONTROL CENTER: TOGGLE / EDIT FLEET & HARDWARE ========
@app.post("/api/admin/buses/{bus_id}/toggle")
async def toggle_bus(bus_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM buses WHERE id = ?", (bus_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Bus not found")
    new_status = 'Inactive' if row['status'] == 'Active' else 'Active'
    if new_status == 'Inactive':
        cursor.execute("SELECT id FROM trips WHERE bus_id = ? AND status = 'Active'", (bus_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot deactivate a bus currently running an active trip.")
    cursor.execute("UPDATE buses SET status = ? WHERE id = ?", (new_status, bus_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success", "new_status": new_status}

@app.put("/api/admin/buses/{bus_id}")
async def edit_bus(bus_id: int, req: EditBusReq):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE buses SET bus_number = ? WHERE id = ?", (req.bus_number.upper(), bus_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Bus number already exists")
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.post("/api/admin/routes/{route_id}/toggle")
async def toggle_route(route_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM routes WHERE id = ?", (route_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Route not found")
    new_status = 'Inactive' if row['status'] == 'Active' else 'Active'
    if new_status == 'Inactive':
        cursor.execute("SELECT id FROM trips WHERE route_id = ? AND status = 'Active'", (route_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot deactivate a route currently running an active trip.")
    cursor.execute("UPDATE routes SET status = ? WHERE id = ?", (new_status, route_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success", "new_status": new_status}

@app.put("/api/admin/routes/{route_id}")
async def edit_route(route_id: int, req: EditRouteReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE routes SET name = ?, origin = ?, destination = ? WHERE id = ?", (req.name, req.origin, req.destination, route_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success"}

@app.post("/api/admin/machines/{machine_id}/toggle")
async def toggle_machine(machine_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM machines WHERE id = ?", (machine_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Machine not found")
    if row['status'] == 'In Use':
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot deactivate a machine currently in use by an active trip.")
    new_status = 'Inactive' if row['status'] == 'Available' else 'Available'
    cursor.execute("UPDATE machines SET status = ? WHERE id = ?", (new_status, machine_id))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    return {"status": "success", "new_status": new_status}

# ======== CONTROL CENTER: TRIPS MANAGEMENT ========
@app.get("/api/admin/trips")
async def get_admin_trips():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.status, t.start_time, t.end_time,
               b.bus_number, b.id as bus_id,
               r.name as route_name, r.id as route_id,
               m.machine_code, m.id as machine_id,
               c.name as conductor_name, c.conductor_id as conductor_code,
               cs.name as current_stop_name, ns.name as next_stop_name,
               (SELECT COUNT(id) FROM stop_updates WHERE trip_id = t.id) as stop_updates_count,
               (SELECT reported_at FROM stop_updates WHERE trip_id = t.id ORDER BY reported_at DESC LIMIT 1) as last_update
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN conductors c ON t.conductor_id = c.id
        LEFT JOIN stops cs ON t.current_stop_id = cs.id
        LEFT JOIN stops ns ON t.next_stop_id = ns.id
        ORDER BY CASE t.status WHEN 'Active' THEN 1 WHEN 'Scheduled' THEN 2 WHEN 'Completed' THEN 3 ELSE 4 END, t.id DESC
    """)
    trips = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return trips

@app.post("/api/admin/trips/{trip_id}/cancel")
async def cancel_trip(trip_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status, machine_id FROM trips WHERE id = ?", (trip_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    if row['status'] == 'Active':
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot cancel an ongoing active trip. Conductor must end the trip.")
    cursor.execute("UPDATE trips SET status = 'Cancelled' WHERE id = ?", (trip_id,))
    if row['machine_id']:
        cursor.execute("UPDATE machines SET status = 'Available' WHERE id = ?", (row['machine_id'],))
    conn.commit()
    conn.close()
    await manager.broadcast(json.dumps({"type": "ADMIN_UPDATE"}))
    await manager.broadcast(json.dumps({"type": "PASSENGER_UPDATE"}))
    return {"status": "success"}

# ======== CONTROL CENTER: REPORTS ========
@app.get("/api/admin/reports")
async def get_admin_reports():
    conn = get_db()
    cursor = conn.cursor()
    
    total_trips = cursor.execute("SELECT COUNT(*) FROM trips").fetchone()[0]
    completed_trips = cursor.execute("SELECT COUNT(*) FROM trips WHERE status = 'Completed'").fetchone()[0]
    cancelled_trips = cursor.execute("SELECT COUNT(*) FROM trips WHERE status = 'Cancelled'").fetchone()[0]
    active_trips = cursor.execute("SELECT COUNT(*) FROM trips WHERE status = 'Active'").fetchone()[0]
    scheduled_trips = cursor.execute("SELECT COUNT(*) FROM trips WHERE status = 'Scheduled'").fetchone()[0]
    total_stop_updates = cursor.execute("SELECT COUNT(*) FROM stop_updates").fetchone()[0]
    avg_updates = round(total_stop_updates / max(1, completed_trips + active_trips), 1)
    
    cursor.execute("""
        SELECT r.name, COUNT(t.id) as trips_count,
               SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_count
        FROM routes r
        LEFT JOIN trips t ON r.id = t.route_id
        GROUP BY r.id
        ORDER BY trips_count DESC
    """)
    route_usage = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT b.bus_number, COUNT(t.id) as trips_count,
               MAX(t.end_time) as last_trip_end
        FROM buses b
        LEFT JOIN trips t ON b.id = t.bus_id
        GROUP BY b.id
        ORDER BY trips_count DESC
    """)
    bus_usage = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT m.machine_code, COUNT(ms.id) as sessions_count
        FROM machines m
        LEFT JOIN machine_sessions ms ON m.id = ms.machine_id
        GROUP BY m.id
        ORDER BY sessions_count DESC
    """)
    machine_usage = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT c.conductor_id, c.name, COUNT(t.id) as trips_count
        FROM conductors c
        LEFT JOIN trips t ON c.id = t.conductor_id
        GROUP BY c.id
        ORDER BY trips_count DESC
    """)
    conductor_activity = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT su.id, su.reported_at, s.name as stop_name, b.bus_number, r.name as route_name
        FROM stop_updates su
        JOIN trips t ON su.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        JOIN stops s ON su.stop_id = s.id
        ORDER BY su.reported_at DESC
        LIMIT 30
    """)
    recent_updates = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "summary": {
            "total_trips": total_trips,
            "completed_trips": completed_trips,
            "cancelled_trips": cancelled_trips,
            "active_trips": active_trips,
            "scheduled_trips": scheduled_trips,
            "total_stop_updates": total_stop_updates,
            "avg_updates_per_trip": avg_updates
        },
        "route_usage": route_usage,
        "bus_usage": bus_usage,
        "machine_usage": machine_usage,
        "conductor_activity": conductor_activity,
        "recent_updates": recent_updates
    }

# ======== PASSENGER APIs ========
def get_bus_details_from_trip(cursor, trip):
    cursor.execute("SELECT id, name, stop_order FROM stops WHERE route_id = ? ORDER BY stop_order ASC", (trip['route_id'],))
    route_stops = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT reported_at FROM stop_updates WHERE trip_id = ? ORDER BY reported_at DESC LIMIT 1", (trip['id'],))
    last_update = cursor.fetchone()
    last_update_str = last_update['reported_at'] if last_update else trip['start_time']
    
    display_status = map_passenger_status(trip['status'], last_update_str)
    
    return {
        "trip_id": trip['id'],
        "bus_number": trip['bus_number'],
        "route_name": trip['route_name'],
        "status": display_status,
        "raw_status": trip['status'],
        "current_stop_id": trip['current_stop_id'],
        "current_stop_name": trip['current_stop_name'],
        "next_stop_name": trip['next_stop_name'],
        "last_updated": last_update_str,
        "route_stops": route_stops
    }

@app.get("/api/passenger/buses/active")
async def get_active_buses():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.status, t.current_stop_id, t.next_stop_id, t.start_time, t.route_id,
               b.bus_number, r.name as route_name,
               cs.name as current_stop_name, ns.name as next_stop_name
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN stops cs ON t.current_stop_id = cs.id
        LEFT JOIN stops ns ON t.next_stop_id = ns.id
        WHERE t.status IN ('Active', 'Scheduled')
        ORDER BY t.status ASC, t.id DESC
    """)
    trips = [dict(row) for row in cursor.fetchall()]
    results = [get_bus_details_from_trip(cursor, t) for t in trips]
    conn.close()
    return results

@app.get("/api/passenger/search_routes")
async def search_routes(q: str = ""):
    conn = get_db()
    cursor = conn.cursor()
    query_str = f"%{q}%"
    
    cursor.execute("""
        SELECT DISTINCT r.id, r.name, r.origin, r.destination,
               (SELECT COUNT(id) FROM stops WHERE route_id = r.id) as stop_count
        FROM routes r
        LEFT JOIN stops s ON s.route_id = r.id
        WHERE r.name LIKE ? OR r.origin LIKE ? OR r.destination LIKE ? OR s.name LIKE ?
    """, (query_str, query_str, query_str, query_str))
    
    routes = [dict(row) for row in cursor.fetchall()]
    
    for r in routes:
        cursor.execute("""
            SELECT t.status, COUNT(t.id) as count
            FROM trips t
            WHERE t.route_id = ? AND t.status IN ('Active', 'Scheduled')
            GROUP BY t.status
        """, (r['id'],))
        counts = cursor.fetchall()
        r['active_count'] = sum(c['count'] for c in counts if c['status'] == 'Active')
        r['scheduled_count'] = sum(c['count'] for c in counts if c['status'] == 'Scheduled')
        
    conn.close()
    return routes

@app.get("/api/passenger/route/{route_id}/buses")
async def get_route_buses(route_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.status, t.current_stop_id, t.next_stop_id, t.start_time, t.route_id,
               b.bus_number, r.name as route_name,
               cs.name as current_stop_name, ns.name as next_stop_name
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN stops cs ON t.current_stop_id = cs.id
        LEFT JOIN stops ns ON t.next_stop_id = ns.id
        WHERE t.route_id = ? AND t.status IN ('Active', 'Scheduled')
    """, (route_id,))
    trips = [dict(row) for row in cursor.fetchall()]
    results = [get_bus_details_from_trip(cursor, t) for t in trips]
    conn.close()
    return results

@app.get("/api/passenger/bus/{bus_number}")
async def get_bus_status(bus_number: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.status, t.current_stop_id, t.next_stop_id, t.start_time, t.route_id,
               b.bus_number, r.name as route_name,
               cs.name as current_stop_name, ns.name as next_stop_name
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN stops cs ON t.current_stop_id = cs.id
        LEFT JOIN stops ns ON t.next_stop_id = ns.id
        WHERE b.bus_number = ? AND t.status IN ('Active', 'Scheduled')
    """, (bus_number,))
    trip = cursor.fetchone()
    if not trip:
        conn.close()
        return {"active_trip": None}
    details = get_bus_details_from_trip(cursor, trip)
    conn.close()
    return {"active_trip": details}

# ======== UTILS ========
@app.get("/api/routes")
async def get_routes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM routes WHERE status = 'Active'")
    routes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return routes

@app.get("/api/machine-session/{machine_code}")
async def get_session(machine_code: str):
    conn = get_db()
    cursor = conn.cursor()
    session = get_machine_session(cursor, machine_code)
    if not session:
        conn.close()
        return {"active": False}
    cursor.execute("""
        SELECT t.id, t.current_stop_id, b.bus_number, r.name as route_name, r.id as route_id
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE t.id = ?
    """, (session['trip_id'],))
    trip = cursor.fetchone()
    conn.close()
    return {
        "active": True, "trip_id": trip['id'], "bus_number": trip['bus_number'],
        "route_id": trip['route_id'], "route_name": trip['route_name'], "current_stop_id": trip['current_stop_id']
    }

@app.get("/api/dashboard/kpis")
async def dashboard_kpis():
    conn = get_db()
    cursor = conn.cursor()
    kpis = {}
    kpis['total_buses'] = cursor.execute("SELECT COUNT(*) FROM buses").fetchone()[0]
    kpis['active_trips'] = cursor.execute("SELECT COUNT(*) FROM trips WHERE status = 'Active'").fetchone()[0]
    kpis['active_buses'] = cursor.execute("SELECT COUNT(DISTINCT bus_id) FROM trips WHERE status = 'Active'").fetchone()[0]
    kpis['inactive_buses'] = cursor.execute("SELECT COUNT(*) FROM buses WHERE status = 'Inactive'").fetchone()[0]
    
    kpis['total_machines'] = cursor.execute("SELECT COUNT(*) FROM machines").fetchone()[0]
    kpis['available_machines'] = cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'Available'").fetchone()[0]
    kpis['in_use_machines'] = cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'In Use'").fetchone()[0]
    
    kpis['total_routes'] = cursor.execute("SELECT COUNT(*) FROM routes").fetchone()[0]
    kpis['active_routes'] = cursor.execute("SELECT COUNT(*) FROM routes WHERE status = 'Active'").fetchone()[0]
    kpis['total_stops'] = cursor.execute("SELECT COUNT(*) FROM stops").fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM stop_updates WHERE DATE(reported_at) = DATE('now')")
    today_updates = cursor.fetchone()[0]
    total_updates = cursor.execute("SELECT COUNT(*) FROM stop_updates").fetchone()[0]
    kpis['live_updates'] = today_updates if today_updates > 0 else total_updates
    
    cursor.execute("SELECT COUNT(*) FROM conductors")
    kpis['total_conductors'] = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM conductors WHERE status = 'Active'")
    kpis['active_conductors'] = cursor.fetchone()[0]
    
    trips = cursor.execute("""
        SELECT t.id as trip_id, b.bus_number, b.id as bus_id, r.name as route_name, r.id as route_id,
               m.machine_code, s.name as current_stop, ns.name as next_stop, t.status,
               t.start_time,
               (SELECT reported_at FROM stop_updates WHERE trip_id = t.id ORDER BY reported_at DESC LIMIT 1) as last_reported_at,
               c.name as conductor_name, c.conductor_id as conductor_code
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN stops s ON t.current_stop_id = s.id
        LEFT JOIN stops ns ON t.next_stop_id = ns.id
        LEFT JOIN conductors c ON t.conductor_id = c.id
        WHERE t.status IN ('Active', 'Scheduled')
        ORDER BY CASE t.status WHEN 'Active' THEN 1 ELSE 2 END, t.start_time DESC
    """).fetchall()
    
    active_journeys = []
    for t in trips:
        last_update_str = t['last_reported_at'] or t['start_time']
        display_stat = map_passenger_status(t['status'], last_update_str)
        active_journeys.append({
            "trip_id": t['trip_id'],
            "bus_number": t['bus_number'],
            "bus_id": t['bus_id'],
            "route_name": t['route_name'],
            "route_id": t['route_id'],
            "machine_code": t['machine_code'] or '—',
            "conductor_code": t['conductor_code'] or (f"C10{t['trip_id']}" if t['trip_id'] else 'C101'),
            "conductor_name": t['conductor_name'] or 'Assigned Conductor',
            "current_stop": t['current_stop'] or 'Origin Station',
            "next_stop": t['next_stop'] or 'Next Checkpoint',
            "last_reported_at": t['last_reported_at'] or t['start_time'],
            "status": t['status'],
            "display_status": display_stat
        })
        
    cursor.execute('''
        SELECT 'STOP_REPORT' as event_type, b.bus_number, r.name as route_name, s.name as stop_name, su.reported_at as timestamp
        FROM stop_updates su
        JOIN trips t ON su.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        JOIN stops s ON su.stop_id = s.id
        UNION ALL
        SELECT 'TRIP_START' as event_type, b.bus_number, r.name as route_name, NULL as stop_name, ms.connected_at as timestamp
        FROM machine_sessions ms
        JOIN trips t ON ms.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        UNION ALL
        SELECT 'TRIP_END' as event_type, b.bus_number, r.name as route_name, NULL as stop_name, ms.disconnected_at as timestamp
        FROM machine_sessions ms
        JOIN trips t ON ms.trip_id = t.id
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE ms.disconnected_at IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 10
    ''')
    recent_activity = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "kpis": kpis,
        "active_journeys": active_journeys,
        "recent_activity": recent_activity
    }

@app.get("/admin{path:path}")
async def serve_admin_spa(path: str = ""):
    return FileResponse("static/index.html")

@app.get("/passenger{path:path}")
async def serve_passenger_spa(path: str = ""):
    return FileResponse("static/index.html")

@app.get("/machine{path:path}")
async def serve_machine_spa(path: str = ""):
    return FileResponse("static/index.html")

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
