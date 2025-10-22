# backend/HarvestHrSP.py
import os
import re
import json
import argparse
import urllib.parse
import requests

GRAPH_BASE = "https://graph.microsoft.com/v1.0"

def _get_bearer(explicit: str | None = None) -> str:
    """
    Returns the Microsoft Graph Bearer token.
    Priority: explicit param > env SP_BEARER_TOKEN.
    """
    token = (explicit or os.getenv("SP_BEARER_TOKEN", "")).strip()
    if not token or token.startswith("<"):
        raise RuntimeError(
            "Missing Graph token. Provide --token on CLI or set SP_BEARER_TOKEN in the environment."
        )
    return token

def _headers(bearer: str):
    return {
        "Authorization": f"Bearer {bearer}",
        "Accept": "application/json"
    }

# ---------------------------
# ID RESOLUTION HELPERS
# ---------------------------

def _graph_site_path_from_url(sp_url: str) -> tuple[str, str]:
    """
    Parses a SharePoint 'pretty' URL and returns (host, path_for_graph)
    E.g. https://cibc-my.sharepoint.com/personal/user_domain_com/Lists/<ListTitle>/AllItems.aspx
         -> host="cibc-my.sharepoint.com", path="/personal/user_domain_com"
    """
    u = urllib.parse.urlparse(sp_url)
    host = u.hostname
    if not host:
        raise ValueError("Invalid SharePoint URL: missing host")

    # We only need the site root path (e.g., /personal/... or /sites/...).
    # Strip /Lists/... if present.
    path = u.path or "/"
    # Known site roots
    m = re.search(r"^(/personal/[^/]+|/sites/[^/]+|/teams/[^/]+)", path, re.IGNORECASE)
    if not m:
        # fallback to first segment
        seg = "/" + path.strip("/").split("/")[0]
        path_for_graph = seg if seg else "/"
    else:
        path_for_graph = m.group(1)

    return host, path_for_graph

def resolve_site_id_from_pretty_url(sp_url: str, bearer: str | None = None) -> str:
    """
    Uses Graph: GET /sites/{host}:{path}?$select=id
    to fetch the siteId from a normal SharePoint URL.
    """
    b = _get_bearer(bearer)
    host, path = _graph_site_path_from_url(sp_url)
    # Graph pattern: /sites/{hostname}:{server-relative-path}
    url = f"{GRAPH_BASE}/sites/{host}:{path}"
    params = {"$select": "id,displayName,webUrl"}
    r = requests.get(url, headers=_headers(b), params=params, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Graph site resolve error {r.status_code}: {r.text}")
    return (r.json() or {}).get("id")

def extract_list_title_from_url(sp_url: str) -> str | None:
    """
    Pull 'QE Initiatives in Use and ROI' from:
    .../Lists/QE%20Initiatives%20in%20Use%20and%20ROI/AllItems.aspx
    """
    u = urllib.parse.urlparse(sp_url)
    parts = [p for p in u.path.split("/") if p]
    if "Lists" in parts:
        idx = parts.index("Lists")
        if idx + 1 < len(parts):
            return urllib.parse.unquote(parts[idx + 1])
    return None

def resolve_list_id(site_id: str, list_title: str, bearer: str | None = None) -> str:
    """
    Uses Graph: GET /sites/{siteId}/lists?$filter=displayName eq '<title>'&$select=id
    to fetch the listId by display name.
    """
    b = _get_bearer(bearer)
    # Escape single quotes for OData
    title = (list_title or "").replace("'", "''")
    url = f"{GRAPH_BASE}/sites/{site_id}/lists"
    params = {"$filter": f"displayName eq '{title}'", "$select": "id,displayName"}
    r = requests.get(url, headers=_headers(b), params=params, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Graph list resolve error {r.status_code}: {r.text}")
    vals = (r.json() or {}).get("value", [])
    if not vals:
        raise RuntimeError(f"List '{list_title}' not found under site '{site_id}'")
    return vals[0].get("id")

# ---------------------------
# MAIN FETCHER (existing behavior)
# ---------------------------

def fetch_harvested_hours(
    site_id: str = None,
    list_id: str = None,
    project_key: str = None,
    top: int = 500
):
    """
    Fetches items from a SharePoint List via Graph API and returns a simplified list of dicts:
    [{ id, fields: {...}, created, modified }, ...]

    - site_id: Graph site ID (e.g., "contoso.sharepoint.com,1234-...-abcd,5678-...-efgh")
    - list_id: Graph list ID or unique ID (GUID)
    - project_key: optional, used for light filtering (e.g., "<intake_number> — <intake_name>")
    """
    site_id = (site_id or os.getenv("SP_SITE_ID", "<YOUR_SP_SITE_ID>")).strip()
    list_id = (list_id or os.getenv("SP_LIST_ID", "<YOUR_SP_LIST_ID>")).strip()
    if not site_id or site_id.startswith("<"):
        raise RuntimeError("SP_SITE_ID not set. Set env var or pass siteId (Graph format).")
    if not list_id or list_id.startswith("<"):
        raise RuntimeError("SP_LIST_ID not set. Set env var or pass listId (GUID).")

    bearer = _get_bearer()
    url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items"
    params = {
        "$expand": "fields",
        "$select": "id,createdDateTime,lastModifiedDateTime,fields",
        "$top": str(top)
    }

    resp = requests.get(url, headers=_headers(bearer), params=params, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"Graph error {resp.status_code}: {resp.text}")

    data = resp.json() or {}
    items = data.get("value", [])

    out = []
    for it in items:
        fields = it.get("fields", {}) or {}
        row = {
            "id": it.get("id"),
            "fields": fields,
            "created": it.get("createdDateTime"),
            "modified": it.get("lastModifiedDateTime"),
        }
        out.append(row)

    if project_key:
        project_key = str(project_key).strip()
        out = [r for r in out if str(r.get("fields", {}).get("Project", "")).strip() == project_key]

    return out

# ---------------------------
# CLI UTILITY
# ---------------------------

def _cli():
    ap = argparse.ArgumentParser(
        description="Resolve Microsoft Graph Site ID and List ID from a SharePoint list URL."
    )
    ap.add_argument("--url", required=True, help="Full SharePoint list URL (from the browser)")
    ap.add_argument("--token", help="Graph Bearer token (optional; else reads SP_BEARER_TOKEN env)")
    args = ap.parse_args()

    token = _get_bearer(args.token)

    sp_url = args.url.strip()
    site_id = resolve_site_id_from_pretty_url(sp_url, bearer=token)
    if not site_id:
        raise RuntimeError("Failed to resolve site id from the provided URL")

    list_title = extract_list_title_from_url(sp_url)
    if not list_title:
        raise RuntimeError("Could not determine list title from URL. Ensure it contains /Lists/<Title>/...")

    list_id = resolve_list_id(site_id, list_title, bearer=token)

    # Print nice JSON and copy-paste helpers
    result = {
        "site_id": site_id,
        "list_title": list_title,
        "list_id": list_id
    }
    print(json.dumps(result, indent=2))
    print("\n# Paste into backend environment (recommended):")
    print(f"export SP_SITE_ID='{site_id}'")
    print(f"export SP_LIST_ID='{list_id}'")

    print("\n# Or paste into React constants (ProjectHarvestedHours.js):")
    print(f"const PLACEHOLDER_SITE_ID = \"{site_id}\";")
    print(f"const PLACEHOLDER_LIST_ID = \"{list_id}\";")

if __name__ == "__main__":
    _cli()
