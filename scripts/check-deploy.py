import json, urllib.request

with open("/Users/macbookpro/Library/Application Support/com.vercel.cli/auth.json") as f:
    token = json.load(f).get("token", "")

TEAM = "team_Qv9jFpl5WIx6OR3uiCwnv1YO"
PROJ = "prj_v4SODZeFGEnQkwJOGE2ieSXWUxJD"

req = urllib.request.Request(
    f"https://api.vercel.com/v6/deployments?teamId={TEAM}&limit=3&projectId={PROJ}",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(req) as res:
    d = json.loads(res.read())
    print("=== Recent Deployments ===")
    for dep in d.get("deployments", []):
        print(f"State: {dep.get('state')} | Target: {dep.get('target')} | URL: https://{dep.get('url')}")

# Get project info
req2 = urllib.request.Request(
    f"https://api.vercel.com/v9/projects/{PROJ}?teamId={TEAM}",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(req2) as res2:
    p = json.loads(res2.read())
    print("\n=== Project Info ===")
    print(f"Name: {p.get('name')}")
    print(f"Framework: {p.get('framework')}")
    targets = p.get("targets", {})
    prod = targets.get("production", {})
    print(f"Production alias: {prod.get('alias', [])}")
    print(f"Protection Bypass: {p.get('ssoProtection')}")
