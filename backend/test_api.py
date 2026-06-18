import time
import requests
import multiprocessing
import uvicorn
import sys

def start_server():
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="warning")

def run_tests():
    base_url = "http://127.0.0.1:8000"
    
    # Wait for server to boot (including ML model training and FAISS build)
    print("Waiting for server to initialize and train ML models on startup (approx 5-10s)...")
    for _ in range(15):
        try:
            res = requests.get(base_url, timeout=2)
            if res.status_code == 200:
                print("Server is up and running! ✓")
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

    # 1. GET /
    print("\n[1] Testing GET / ...")
    res = requests.get(base_url)
    print("Status:", res.status_code)
    print("Response:", res.json())
    if res.status_code != 200: errors += 1

    # 2. POST /api/fingerprint
    print("\n[2] Testing POST /api/fingerprint ...")
    res = requests.post(f"{base_url}/api/fingerprint", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response Fingerprint Text:", data.get("fingerprint_text"))
    if res.status_code != 200 or "fingerprint_text" not in data: errors += 1

    # 3. POST /api/similar-events
    print("\n[3] Testing POST /api/similar-events ...")
    res = requests.post(f"{base_url}/api/similar-events", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Found Similar Events Count:", len(data.get("similar_events", [])))
    for i, item in enumerate(data.get("similar_events", [])[:2], 1):
        print(f"  #{i} ID: {item['historical_event_id']}, Score: {item['similarity_score']}%, Corridor: {item['corridor']}")
    if res.status_code != 200 or "similar_events" not in data: errors += 1

    # 4. POST /api/predictions
    print("\n[4] Testing POST /api/predictions ...")
    res = requests.post(f"{base_url}/api/predictions", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response:", data)
    assert "predicted_road_closure" in data
    assert "predicted_priority" in data
    assert "manpower_diversion_score" in data
    if res.status_code != 200: errors += 1

    # 5. POST /api/recommendations
    print("\n[5] Testing POST /api/recommendations ...")
    res = requests.post(f"{base_url}/api/recommendations", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response:")
    for k, v in data.items():
        print(f"  {k:<30} {v}")
    assert "road_closure_probability" in data
    assert "recommended_manpower" in data
    assert "suggested_diversion" in data
    if res.status_code != 200: errors += 1

    # 6. POST /api/learning
    print("\n[6] Testing POST /api/learning ...")
    res = requests.post(f"{base_url}/api/learning", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Response:", data)
    if res.status_code != 200 or data.get("status") != "success": errors += 1

    print("\n" + "="*40)
    if errors == 0:
        print("🎉 ALL API TESTS PASSED SUCCESSFULLY! 🎉")
    else:
        print(f"❌ Completed with {errors} errors. ❌")
        sys.exit(1)

if __name__ == "__main__":
    # Start server as background process
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
