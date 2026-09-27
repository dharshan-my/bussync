import sqlite3
import time
import requests
import sys

API_BASE = "http://localhost:5000/api"

def simulate():
    print("🚌 Starting BusSync Simulation...")
    
    # 1. Admin creates a trip
    print("\n[Admin] Scheduling trip for KA-01-1234 on Route 1 (Tumakuru → Bengaluru)...")
    res = requests.post(f"{API_BASE}/admin/trips", json={"bus_id": 1, "route_id": 1})
    if res.status_code != 200 and "already has a scheduled" not in res.text:
        print(f"Error creating trip: {res.text}")
    
    time.sleep(2)
    
    # 2. Conductor starts trip
    print("\n[Conductor] Machine M102 starting trip for KA-01-1234...")
    res = requests.post(f"{API_BASE}/trip/start", json={"machine_code": "M102", "bus_number": "KA-01-1234"})
    if res.status_code == 200:
        print("✓ Trip started successfully. MACHINE_SESSION created.")
    else:
        print(f"Warning: {res.text}. (Trip might already be active)")

    time.sleep(3)
    
    # 3. Fetch stops
    stops = requests.get(f"{API_BASE}/routes/1/stops").json()
    
    # 4. Conductor reports stops sequentially
    for stop in stops[1:]: # Skip first stop as it's reported on start
        print(f"\n[Conductor] Reporting stop: {stop['name']}...")
        res = requests.post(f"{API_BASE}/trip/update", json={"machine_code": "M102", "stop_id": stop['id']})
        if res.status_code == 200:
            print(f"✓ Stop reported. Passenger UI should now show {stop['name']}.")
        else:
            print(f"Error reporting stop: {res.text}")
        
        # Wait to let passenger see the update
        print("Waiting 5 seconds before next stop...")
        time.sleep(5)
        
    # 5. Conductor ends trip
    print("\n[Conductor] Reached destination. Ending trip...")
    res = requests.post(f"{API_BASE}/trip/end", json={"machine_code": "M102"})
    if res.status_code == 200:
        print("✓ Trip ended. MACHINE_SESSION closed. M102 is available.")
        
    print("\n✅ Simulation complete! The dynamic machine-to-bus concept has been demonstrated.")

if __name__ == "__main__":
    simulate()
