#!/usr/bin/env python3
"""
Deploy semua file ke Vercel via REST API (tanpa GitHub)
Membuat deployment baru dengan upload semua file dari git ls-files
"""

import json, os, hashlib, mimetypes, urllib.request, urllib.error, subprocess, base64

AUTH_FILE  = "/Users/macbookpro/Library/Application Support/com.vercel.cli/auth.json"
TEAM_ID    = "team_Qv9jFpl5WIx6OR3uiCwnv1YO"
PROJECT_ID = "prj_gRyaji9io9u1UEUAd1RDgBCaheYV"
BASE_DIR   = "/Users/macbookpro/www/waroengss-archery"

SKIP_EXTS = {".pyc", ".db", ".sqlite", ".log"}
SKIP_DIRS = {"node_modules", ".next", ".git", "__pycache__", "coverage"}

with open(AUTH_FILE) as f:
    TOKEN = json.load(f).get("token", "")

def api(path, method="GET", body=None, token=""):
    url = f"https://api.vercel.com{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read()), res.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

def upload_file(sha, data, token):
    url = f"https://api.vercel.com/v2/files?teamId={TEAM_ID}"
    req = urllib.request.Request(url, data=data, method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
            "x-now-digest": sha,
            "x-now-size": str(len(data)),
        })
    try:
        with urllib.request.urlopen(req) as res:
            return res.status
    except urllib.error.HTTPError as e:
        if e.code == 200:
            return 200
        return e.code

# Get all files from git
result = subprocess.run(
    ["git", "ls-files"], capture_output=True, text=True, cwd=BASE_DIR
)
git_files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
print(f"Found {len(git_files)} files in git")

# Build file list for deployment
files = []
upload_queue = []

for rel_path in git_files:
    # Skip problematic files
    if any(part in SKIP_DIRS for part in rel_path.split("/")):
        continue
    ext = os.path.splitext(rel_path)[1]
    if ext in SKIP_EXTS:
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

print(f"Prepared {len(files)} files for upload")

# Upload files
print("Uploading files...")
uploaded = 0
skipped = 0
for sha, data, name in upload_queue:
    status = upload_file(sha, data, TOKEN)
    if status in (200, 201, 204):
        uploaded += 1
    elif status == 200:
        skipped += 1
    if uploaded % 20 == 0 and uploaded > 0:
        print(f"  {uploaded}/{len(upload_queue)} uploaded...")

print(f"Upload complete: {uploaded} uploaded, {skipped} already existed")

# Create deployment
print("\nCreating deployment...")
deploy_body = {
    "name": "waroengss-archery",
    "files": files,
    "projectSettings": {
        "framework": "nextjs",
        "buildCommand": "prisma generate && next build",
        "installCommand": "npm install",
        "outputDirectory": ".next",
    },
    "target": "production",
}

deploy, status = api(
    f"/v13/deployments?teamId={TEAM_ID}&projectId={PROJECT_ID}&forceNew=1",
    method="POST",
    body=deploy_body,
    token=TOKEN
)

print(f"Status: {status}")
if status in (200, 201, 202):
    print(f"Deployment ID: {deploy.get('id')}")
    print(f"URL: https://{deploy.get('url', '')}")
    print(f"State: {deploy.get('readyState')}")
    print(f"\nInspect: https://vercel.com/waroengss-archery/waroengss-archery/{deploy.get('id','')}")
else:
    print(f"Error: {json.dumps(deploy, indent=2)[:1000]}")
