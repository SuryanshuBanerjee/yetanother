import os
import sys

# Install google-genai if not present (optional helper, but better to rely on pip install)
try:
    from google import genai
except ImportError:
    print("Please run: pip install -U google-genai")
    sys.exit(1)

# Set the API key provided
os.environ["GEMINI_API_KEY"] = "AIzaSyBaQ01R_ipcbpO5KPGAf_H5FIn4OsmsYUE"

def test_key():
    print("Initializing Google GenAI Client...")

if __name__ == "__main__":
    test_key()
