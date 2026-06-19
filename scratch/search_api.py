import os

def search_keywords():
    search_dir = "citylearn/src"
    keywords = ["fetch", "axios", "http", "localhost", "8000", "/api/"]
    for r, d, fs in os.walk(search_dir):
        for f in fs:
            if f.endswith((".tsx", ".ts", ".js", ".jsx")):
                path = os.path.join(r, f)
                try:
                    content = open(path, "r", encoding="utf-8").read()
                except Exception:
                    continue
                found = []
                for kw in keywords:
                    if kw in content:
                        found.append(kw)
                if found:
                    print(f"\n--- {path} matches {found} ---")
                    lines = content.splitlines()
                    for idx, line in enumerate(lines):
                        if any(kw in line for kw in keywords):
                            print(f"  {idx+1}: {line.strip()}")

if __name__ == "__main__":
    search_keywords()
