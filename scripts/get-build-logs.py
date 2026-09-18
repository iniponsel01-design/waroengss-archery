#!/usr/bin/env python3
import json, urllib.request, urllib.error

DEPLOY_ID = "dpl_656agJvQL4QevG6eYzd8ifNaGgbW"
TEAM_ID   = "team_Qv9jFpl5WIx6OR3uiCwnv1YO"

with open("/Users/macbookpro/Library/Application Support/com.vercel.cli/auth.json") as f:
    TOKEN = json.load(f).get("token", "")

def fetch(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    try:
        with urllib.request.urlopen(req) as res:
            return res.read().decode(), res.status
    except urllib.error.HTTPError as e:
        return e.read().decode(), e.code

# Get deployment events/logs
url = f"https://api.vercel.com/v2/deployments/{DEPLOY_ID}/events?teamId={TEAM_ID}&limit=100"
text, status = fetch(url)
print(f"Events endpoint: {status}")

if status == 200:
    lines = [l for l in text.strip().split("\n") if l.strip()]
    print(f"Total events: {len(lines)}")
    
    error_lines = []
    build_lines = []
    
    for line in lines:
        try:
            ev = json.loads(line)
            payload = ev.get("payload", {})
            txt = payload.get("text", "") or str(payload)
            if not txt:
                continue
            build_lines.append(txt)
            if any(k in txt for k in ["error", "Error", "failed", "Module not found", "Cannot find"]):
                error_lines.append(txt)
        except Exception:
            continue
    
    print("\n=== BUILD OUTPUT (last 30 lines) ===")
    for line in build_lines[-30:]:
        print(line[:200])
    
    if error_lines:
        print("\n=== ERRORS ===")
        for line in error_lines:
            print(line[:300])
else:
    # Try build output endpoint
    url2 = f"https://api.vercel.com/v3/deployments/{DEPLOY_ID}/builds?teamId={TEAM_ID}"
    text2, status2 = fetch(url2)
    print(f"Builds endpoint: {status2}")
    print(text2[:2000])
