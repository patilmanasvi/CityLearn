import time
import requests
import multiprocessing
import uvicorn
import sys
import os

def start_server():
    # Make sure we are in the correct directory to find main.py and schemas.py
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_level="warning")

def run_tests():
    base_url = "http://127.0.0.1:8000"
    
    print("Waiting for server to boot...")
    for _ in range(10):
        try:
            res = requests.get(f"{base_url}/health", timeout=2)
            if res.status_code == 200:
                print("Server is up and running! [OK]")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        print("Error: Server failed to start.")
        sys.exit(1)

    payload = {
        "id": 9999,
        "event_type": "unplanned",
        "event_cause": "accident",
        "latitude": 12.9539,
        "longitude": 77.5852,
        "start_datetime": "2024-03-07 17:01:48.111000+00:00",
        "corridor": "Lalbagh Road",
        "police_station": "Wilson Garden",
        "zone": "South",
        "junction": "Lalbagh Main Gate Junction",
        "description": "Two vehicles collided causing a blockade near the main gate.",
        "comment": "Minor injuries reported."
    }

    errors = 0

    # 1. GET /health
    print("\n[1] Testing GET /health ...")
    res = requests.get(f"{base_url}/health")
    print("Status:", res.status_code)
    print("Response:", res.json())
    if res.status_code != 200 or res.json().get("status") != "healthy":
        errors += 1

    # 2. POST /predict/closure
    print("\n[2] Testing POST /predict/closure ...")
    res = requests.post(f"{base_url}/predict/closure", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response:", data)
    if res.status_code != 200 or "predicted_road_closure" not in data or "probability" not in data:
        errors += 1

    # 3. POST /predict/priority
    print("\n[3] Testing POST /predict/priority ...")
    res = requests.post(f"{base_url}/predict/priority", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response:", data)
    if res.status_code != 200 or "predicted_priority" not in data or "probability" not in data:
        errors += 1

    # 4. POST /predict/manpower
    print("\n[4] Testing POST /predict/manpower ...")
    res = requests.post(f"{base_url}/predict/manpower", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response:")
    for k, v in data.items():
        print(f"  {k:<30} {v}")
    if (res.status_code != 200 or 
        "manpower_diversion_score" not in data or 
        "recommended_manpower" not in data or
        "suggested_diversion" not in data or
        "recommended_action" not in data):
        errors += 1

    print("\n" + "="*40)
    if errors == 0:
        print("=== ALL NEW API TESTS PASSED SUCCESSFULLY! ===")
    else:
        print(f"Completed with {errors} errors.")
        sys.exit(1)

if __name__ == "__main__":
    # Start server as background process
    # Set cwd to backend to match imports in start_server
    sys.path.insert(0, "backend")
    server_process = multiprocessing.Process(target=start_server)
    server_process.start()

    try:
        run_tests()
    finally:
        # Kill server
        print("\nStopping FastAPI server...")
        server_process.terminate()
        server_process.join()
