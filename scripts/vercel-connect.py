#!/usr/bin/env python3
"""
Connect iniponsel01-design/waroengss-archery fork to Vercel project
and trigger a fresh deployment via Vercel REST API
"""

import json
import urllib.request
import urllib.error

AUTH_FILE = "/Users/macbookpro/Library/Application Support/com.vercel.cli/auth.json"
TEAM_ID   = "team_Qv9jFpl5WIx6OR3uiCwnv1YO"
PROJECT_ID = "prj_gRyaji9io9u1UEUAd1RDgBCaheYV"
FORK_REPO  = "iniponsel01-design/waroengss-archery"
BRANCH     = "main"

def api(path, method="GET", body=None, token=""):
    url = f"https://api.vercel.com{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read()), res.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

# Load token
with open(AUTH_FILE) as f:
    TOKEN = json.load(f).get("token", "")

print(f"Token: {TOKEN[:12]}...")

# Step 1: Get current project info
print("\n[1] Fetching project info...")
proj, status = api(f"/v9/projects/{PROJECT_ID}?teamId={TEAM_ID}", token=TOKEN)
print(f"  Project: {proj.get('name')} | Status: {status}")
git = proj.get("link", {})
print(f"  Current git: {git.get('type')} | {git.get('repo')} | {git.get('productionBranch')}")

# Step 2: Connect fork repo to project via Git
print(f"\n[2] Connecting fork {FORK_REPO} to project...")
body = {
    "type": "github",
    "repo": FORK_REPO,
    "repoId": None,
    "productionBranch": BRANCH,
}
result, status = api(
    f"/v9/projects/{PROJECT_ID}/link?teamId={TEAM_ID}",
    method="POST",
    body=body,
    token=TOKEN
)
print(f"  Status: {status}")
if status in (200, 201):
    linked = result.get("link", {})
    print(f"  Linked: {linked.get('type')} | {linked.get('repo')}")
else:
    print(f"  Response: {json.dumps(result, indent=2)[:500]}")

# Step 3: Trigger a new deployment from the fork
print(f"\n[3] Triggering deployment from {FORK_REPO}@{BRANCH}...")
deploy_body = {
    "name": "waroengss-archery",
    "gitSource": {
        "type": "github",
        "ref": BRANCH,
        "repoId": None,
    },
    "projectId": PROJECT_ID,
    "target": "production",
}
deploy, status = api(
    f"/v13/deployments?teamId={TEAM_ID}",
    method="POST",
    body=deploy_body,
    token=TOKEN
)
print(f"  Status: {status}")
if status in (200, 201, 202):
    print(f"  Deployment ID: {deploy.get('id')}")
    print(f"  URL: https://{deploy.get('url', '')}")
    print(f"  State: {deploy.get('readyState')}")
else:
    print(f"  Response: {json.dumps(deploy, indent=2)[:500]}")
