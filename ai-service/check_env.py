import sys
print(f"Python version: {sys.version}")

try:
    import fastapi
    print("FastAPI imported successfully")
except ImportError as e:
    print(f"Failed to import fastapi: {e}")

try:
    import uvicorn
    print("Uvicorn imported successfully")
except ImportError as e:
    print(f"Failed to import uvicorn: {e}")

try:
    import numpy
    print("NumPy imported successfully")
except ImportError as e:
    print(f"Failed to import numpy: {e}")
