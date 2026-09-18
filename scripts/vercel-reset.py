#!/usr/bin/env python3
"""
Hapus project Vercel lama dan buat project BARU dari scratch
Semua file akan di-upload fresh tanpa cache
"""
import json, urllib.request, urllib.error, hashlib, subprocess, os

AUTH_FILE  = "/Users/macbookpro/Library/Application Support/com.vercel.cli/auth.json"
TEAM_ID    = "team_Qv9jFpl5WIx6OR3uiCwnv1YO"
OLD_PROJ   = "prj_gRyaji9io9u1UEUAd1RDgBCaheYV"
BASE_DIR   = "/Users/macbookpro/www/waroengss-archery"

with open(AUTH_FILE) as f:
    TOKEN = json.load(f).get("token", "")

def api(path, method="GET", body=None):
    url = f"https://api.vercel.com{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as res:
            txt = res.read()
            return json.loads(txt) if txt else {}, res.status
    except urllib.error.HTTPError as e:
        txt = e.read()
        return json.loads(txt) if txt else {}, e.code

def upload_file(sha, data):
    url = f"https://api.vercel.com/v2/files?teamId={TEAM_ID}"
    req = urllib.request.Request(url, data=data, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}",
                 "Content-Type": "application/octet-stream",
                 "x-now-digest": sha, "x-now-size": str(len(data))})
    try:
        with urllib.request.urlopen(req) as res:
            return res.status
    except urllib.error.HTTPError as e:
        return e.code

print("=== Step 1: Delete old project ===")
result, status = api(f"/v9/projects/{OLD_PROJ}?teamId={TEAM_ID}", method="DELETE")
print(f"Delete status: {status}")

print("\n=== Step 2: Create new project ===")
new_proj, status = api(
    f"/v9/projects?teamId={TEAM_ID}",
    method="POST",
    body={
        "name": "waroengss-archery",
        "framework": "nextjs",
        "buildCommand": "prisma generate && next build",
        "installCommand": "npm install --legacy-peer-deps",
        "outputDirectory": ".next",
    }
)
if status not in (200, 201):
    print(f"Create project failed: {status}")
    print(json.dumps(new_proj, indent=2)[:500])
    exit(1)

NEW_PROJ_ID = new_proj.get("id")
print(f"New project ID: {NEW_PROJ_ID}")
print(f"Project name: {new_proj.get('name')}")

# Save new project ID
with open(f"{BASE_DIR}/.vercel/project.json", "w") as f:
    json.dump({
        "projectId": NEW_PROJ_ID,
        "orgId": TEAM_ID,
        "projectName": "waroengss-archery"
    }, f)
print(f"Saved new project ID to .vercel/project.json")

print("\n=== Step 3: Set env vars ===")
env_file = f"{BASE_DIR}/.env.local"
env_vars = {}
try:
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                val = val.strip('"')
                env_vars[key.strip()] = val
except Exception as e:
    print(f"Warning: {e}")

# Also add from .env
env_file2 = f"{BASE_DIR}/.env"
try:
    with open(env_file2) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                val = val.strip('"')
                if key.strip() not in env_vars:
                    env_vars[key.strip()] = val
except Exception:
    pass

SKIP_KEYS = {"VERCEL_OIDC_TOKEN", "GOOGLE_SERVICE_ACCOUNT_KEY_FILE", "NODE_ENV"}
env_count = 0
for key, val in env_vars.items():
    if key in SKIP_KEYS or not val:
        continue
    env_type = "encrypted" if any(s in key.upper() for s in ["SECRET", "PASSWORD", "KEY", "JSON", "TOKEN", "URL"]) else "plain"
    result, status = api(
        f"/v9/projects/{NEW_PROJ_ID}/env?teamId={TEAM_ID}",
        method="POST",
        body={"key": key, "value": val, "type": env_type, "target": ["production", "preview"]}
    )
    if status in (200, 201):
        env_count += 1
    else:
        print(f"  Warning: {key} failed ({status})")

print(f"Set {env_count} env vars")

# Add NODE_ENV=production separately
api(f"/v9/projects/{NEW_PROJ_ID}/env?teamId={TEAM_ID}", method="POST",
    body={"key": "NODE_ENV", "value": "production", "type": "plain", "target": ["production"]})

# Add GOOGLE_SERVICE_ACCOUNT_JSON from service-account.json
sa_file = f"{BASE_DIR}/service-account.json"
if os.path.exists(sa_file):
    with open(sa_file) as f:
        sa = json.dumps(json.load(f), separators=(",", ":"))
    api(f"/v9/projects/{NEW_PROJ_ID}/env?teamId={TEAM_ID}", method="POST",
        body={"key": "GOOGLE_SERVICE_ACCOUNT_JSON", "value": sa,
              "type": "encrypted", "target": ["production", "preview"]})
    print("Set GOOGLE_SERVICE_ACCOUNT_JSON")

print("\n=== Step 4: Upload all files ===")
result = subprocess.run(["git", "ls-files"], capture_output=True, text=True, cwd=BASE_DIR)
git_files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]

SKIP_DIRS = {"node_modules", ".next", ".git", "__pycache__"}
files = []
upload_queue = []

for rel_path in git_files:
    if any(part in SKIP_DIRS for part in rel_path.split("/")):
        continue
    full_path = os.path.join(BASE_DIR, rel_path)
    if not os.path.isfile(full_path):
        continue
    try:
        with open(full_path, "rb") as fh:
            data = fh.read()
    except Exception:
        continue
    sha = hashlib.sha1(data).hexdigest()
    files.append({"file": rel_path, "sha": sha, "size": len(data)})
    upload_queue.append((sha, data, rel_path))

print(f"Uploading {len(files)} files...")
uploaded = 0
for sha, data, name in upload_queue:
    status = upload_file(sha, data)
    if status in (200, 201, 204):
        uploaded += 1
    if uploaded % 20 == 0 and uploaded > 0:
        print(f"  {uploaded}/{len(upload_queue)}...")

print(f"Uploaded {uploaded}/{len(files)} files")

print("\n=== Step 5: Create deployment ===")
deploy, status = api(
    f"/v13/deployments?teamId={TEAM_ID}&projectId={NEW_PROJ_ID}&forceNew=1",
    method="POST",
    body={
        "name": "waroengss-archery",
        "files": files,
        "projectSettings": {
            "framework": "nextjs",
            "buildCommand": "prisma generate && next build",
            "installCommand": "npm install --legacy-peer-deps",
            "outputDirectory": ".next",
            "devCommand": None,
            "rootDirectory": None,
        },
        "target": "production",
    }
)

print(f"Deploy status: {status}")
if status in (200, 201, 202):
    print(f"✅ Deployment created!")
    print(f"ID:  {deploy.get('id')}")
    print(f"URL: https://{deploy.get('url', '')}")
    print(f"State: {deploy.get('readyState')}")
    print(f"\nMonitor: https://vercel.com/waroengss-archery/waroengss-archery")
else:
    print(f"❌ Failed: {json.dumps(deploy, indent=2)[:500]}")
