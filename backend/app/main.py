# Proxy entry point forwarding to unified root backend/main.py
import sys
import os

# Insert parent directory (backend/) into path if not already there
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from main import app
