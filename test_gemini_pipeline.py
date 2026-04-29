"""
Test Gemini with a pipeline-sized payload (mimics advanced-inferences call).
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

API_KEY = None
env_path = os.path.join(os.path.dirname(__file__), ".env.local")
with open(env_path) as f:
    for line in f:
        if line.startswith("GEMINI_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1]

if not API_KEY:
    print("ERROR: no key")
    sys.exit(1)

# Simulate the actual advanced-inferences prompt
system_prompt = """You are TREND PRISM's Advanced Inference Engine — the most sophisticated trend analysis AI.

You are advising a CONTENT CREATOR — someone who makes videos, posts, and content on social platforms.
They need to know: Should I make content about this trend? Will it get views? Is it too late? What angle should I take?

You MUST respond in valid JSON with this EXACT structure:
{
  "deltaVelocity": {"value": 0, "label": "Stable", "detail": "test"},
  "peakWidth": {"days": 14, "label": "Medium Lifespan", "detail": "test"},
  "decayHalfLife": {"days": 7, "label": "Fast Decay", "detail": "test"},
  "regionalSkew": {"dominantRegion": "US", "concentration": 50, "isGlobal": false, "detail": "test"},
  "trendTriade": {
    "communityFragmentation": {"score": 50, "indicators": ["a","b","c"], "detail": "test"},
    "semanticSaturation": {"score": 50, "indicators": ["a","b","c"], "detail": "test"},
    "commercialExhaustion": {"score": 50, "indicators": ["a","b","c"], "detail": "test"}
  },
  "overallRiskScore": 50,
  "phase": "Growth",
  "velocity": "Stable",
  "timeToCollapse": "2-3 weeks",
  "collapseProbability": 50,
  "llmAnalysis": "analysis here"
}"""

user_prompt = """Analyze this trend deeply: "barcelona vs mallorca"

RAW METRICS FROM GOOGLE TRENDS:
- Current Interest Level: 75/100
- Peak Interest Level: 100/100
- Average Interest: 60/100
- Trend Direction: falling
- Week-over-Week Change: -15%
- Month-over-Month Change: 200%
- Volatility: 25%
- Days Since Peak: 3
- Consistency Score: 40/100

TOP REGIONS: [{"name":"Spain","value":100},{"name":"Mexico","value":15}]
RELATED RISING QUERIES: [{"query":"copa del rey","value":100}]
RELATED TOP QUERIES: [{"query":"barcelona","value":100}]

DATA POINTS AVAILABLE: 90 days of data

Generate deep inferences NOW. Be specific with numbers."""

payload = {
    "model": "gemini-2.5-flash",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ],
    "temperature": 0.6,
    "max_tokens": 2500,
    "response_format": {"type": "json_object"},
}

print(f"Payload size: {len(json.dumps(payload))} bytes")
print(f"Sending to Gemini (15s timeout)...")

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
        tokens = body.get("usage", {})
        print(f"Status: OK ({resp.status})")
        print(f"Latency: {elapsed:.2f}s")
        print(f"Tokens: {tokens}")
        try:
            parsed = json.loads(content)
            print(f"Response (parsed JSON):")
            print(json.dumps(parsed, indent=2))
        except:
            print(f"Raw response: {content[:500]}")
except urllib.error.HTTPError as e:
    elapsed = time.time() - start
    error_body = e.read().decode() if e.fp else "no body"
    print(f"HTTP ERROR {e.code}: {e.reason}")
    print(f"Body: {error_body}")
    print(f"Latency: {elapsed:.2f}s")
except Exception as e:
    elapsed = time.time() - start
    print(f"ERROR: {type(e).__name__}: {e}")
    print(f"Latency: {elapsed:.2f}s")
