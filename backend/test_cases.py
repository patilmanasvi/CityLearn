import time
import requests
import multiprocessing
import uvicorn
import sys
import os

def start_server():
    # Make sure we are in the correct directory to find main.py and schemas.py
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="warning")

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

    print("\nExecuting Test Cases...")

    # Case 1: Attendance: 1000, Duration: 30, near Bangalore
    payload_case1 = {
        "event_type": "Public Assembly",
        "event_cause": "Others",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "attendance": 1000,
        "duration": 30,
        "start_datetime": "2026-06-19T12:00:00.000Z",
        "corridor": "Bengaluru, Karnataka, India",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "requires_road_closure": False,
        "closure_status": "No Closure"
    }

    # Case 2: Attendance: 50000, Duration: 180, near Bangalore
    payload_case2 = {
        "event_type": "Public Assembly",
        "event_cause": "Others",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "attendance": 50000,
        "duration": 180,
        "start_datetime": "2026-06-19T12:00:00.000Z",
        "corridor": "Bengaluru, Karnataka, India",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "requires_road_closure": False,
        "closure_status": "No Closure"
    }

    # Case 3: Attendance: 50000, Duration: 180, far from Bangalore (Mumbai)
    payload_case3 = {
        "event_type": "Public Assembly",
        "event_cause": "Others",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "attendance": 50000,
        "duration": 180,
        "start_datetime": "2026-06-19T12:00:00.000Z",
        "corridor": "Mumbai, Maharashtra, India",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "requires_road_closure": False,
        "closure_status": "No Closure"
    }

    # Query Case 1
    print("\n--- QUERYING CASE 1 (Attendance: 1000, Duration: 30) ---")
    res1 = requests.post(f"{base_url}/predict/manpower", json=payload_case1).json()
    print("Manpower Score:", res1["manpower_diversion_score"])
    print("Recommended Officers:", res1["recommended_manpower"])

    # Query Case 2
    print("\n--- QUERYING CASE 2 (Attendance: 50000, Duration: 180) ---")
    res2 = requests.post(f"{base_url}/predict/manpower", json=payload_case2).json()
    print("Manpower Score:", res2["manpower_diversion_score"])
    print("Recommended Officers:", res2["recommended_manpower"])

    # Query Case 3
    print("\n--- QUERYING CASE 3 (Far Location - Mumbai: Attendance: 50000, Duration: 180) ---")
    res3 = requests.post(f"{base_url}/predict/manpower", json=payload_case3).json()
    print("Manpower Score:", res3["manpower_diversion_score"])
    print("Recommended Officers:", res3["recommended_manpower"])

    # Verify logic changes
    assert res1["manpower_diversion_score"] < res2["manpower_diversion_score"], "Error: Manpower score did not increase with attendance and duration!"
    assert res1["recommended_manpower"] < res2["recommended_manpower"], "Error: Recommended officers count did not increase with attendance!"
    assert res3["manpower_diversion_score"] < res2["manpower_diversion_score"], "Error: Manpower score did not decrease for a far location!"
    
    print("\n" + "="*40)
    print("=== ALL IMPLEMENTATION TESTS PASSED SUCCESSFULLY! ===")
    print("="*40 + "\n")

if __name__ == "__main__":
    # Start server as background process
    sys.path.insert(0, "backend")
    server_process = multiprocessing.Process(target=start_server)
    server_process.start()

    try:
        run_tests()
    finally:
        # Kill server
        print("Stopping FastAPI server...")
        server_process.terminate()
        server_process.join()
