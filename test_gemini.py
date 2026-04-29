"""
Test Gemini API connectivity via the OpenAI-compatible endpoint.
Usage: python test_gemini.py
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Load API key from .env.local
API_KEY = None
env_path = os.path.join(os.path.dirname(__file__), ".env.local")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                API_KEY = line.strip().split("=", 1)[1]
                break

if not API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env.local")
    sys.exit(1)

print(f"API Key: {API_KEY[:10]}...{API_KEY[-4:]}")
print(f"Endpoint: https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")
print(f"Model: gemini-2.5-flash")
print()

# Test 1: Simple text completion
print("=" * 60)
print("TEST 1: Simple text completion")
print("=" * 60)

payload = {
    "model": "gemini-2.5-flash",
    "messages": [
        {"role": "user", "content": "Say 'Hello from Gemini!' and nothing else."}
    ],
    "temperature": 0.3,
    "max_tokens": 50,
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    data=data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    },
    method="POST",
)

start = time.time()
try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode())
        elapsed = time.time() - start
        content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
        model = body.get("model", "unknown")
        tokens = body.get("usage", {})
        print(f"  Status: OK ({resp.status})")
        print(f"  Model: {model}")
        print(f"  Response: {content}")
        print(f"  Tokens: {tokens}")
        print(f"  Latency: {elapsed:.2f}s")
except urllib.error.HTTPError as e:
    elapsed = time.time() - start
    error_body = e.read().decode() if e.fp else "no body"
    print(f"  HTTP ERROR {e.code}: {e.reason}")
    print(f"  Body: {error_body}")
    print(f"  Latency: {elapsed:.2f}s")
except Exception as e:
    elapsed = time.time() - start
    print(f"  ERROR: {type(e).__name__}: {e}")
    print(f"  Latency: {elapsed:.2f}s")

print()

# Test 2: JSON mode (what the pipeline uses)
print("=" * 60)
print("TEST 2: JSON mode response")
print("=" * 60)

payload2 = {
    "model": "gemini-2.5-flash",
    "messages": [
        {"role": "system", "content": "Respond in valid JSON only."},
        {"role": "user", "content": 'Return this JSON: {"status": "ok", "message": "Gemini works"}'},
    ],
    "temperature": 0.3,
    "max_tokens": 100,
    "response_format": {"type": "json_object"},
}

data2 = json.dumps(payload2).encode("utf-8")
req2 = urllib.request.Request(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    data=data2,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    },
    method="POST",
)

start = time.time()
try:
    with urllib.request.urlopen(req2, timeout=20) as resp:
        body = json.loads(resp.read().decode())
        elapsed = time.time() - start
        content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
        print(f"  Status: OK ({resp.status})")
        print(f"  Response: {content}")
        print(f"  Latency: {elapsed:.2f}s")
        # Try parsing the JSON response
        try:
            parsed = json.loads(content)
            print(f"  Parsed JSON: {parsed}")
        except json.JSONDecodeError as je:
            print(f"  JSON parse error: {je}")
except urllib.error.HTTPError as e:
    elapsed = time.time() - start
    error_body = e.read().decode() if e.fp else "no body"
    print(f"  HTTP ERROR {e.code}: {e.reason}")
    print(f"  Body: {error_body}")
    print(f"  Latency: {elapsed:.2f}s")
except Exception as e:
    elapsed = time.time() - start
    print(f"  ERROR: {type(e).__name__}: {e}")
    print(f"  Latency: {elapsed:.2f}s")

print()
print("Done.")
