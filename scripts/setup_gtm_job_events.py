#!/usr/bin/env python3
"""Provision GTM (GTM-MGLNLCG5) + GA4 for the in-article job-recommendation events.

Creates the Data Layer Variables, Custom Event triggers and GA4 Event tags that
back the `recommended_jobs_view` / `recommended_job_click` /
`recommended_jobs_search_click` dataLayer events pushed by the blog, and marks
`recommended_job_click` (and, optionally, the search click) as a GA4 key event.

Auth mirrors scripts/google_api_auth_test.py: an installed-app OAuth flow whose
token is cached at ~/.config/wport_blog/google_oauth_token.json. The scopes there
already include tagmanager edit/publish and analytics.edit.

SAFE BY DEFAULT: runs as a DRY RUN (prints every create it *would* POST, touches
nothing). Pass --apply to write into a GTM workspace. Nothing is published unless
you additionally pass --publish.

Usage:
    python3 scripts/setup_gtm_job_events.py                 # dry run (default)
    python3 scripts/setup_gtm_job_events.py --apply         # write to a workspace
    python3 scripts/setup_gtm_job_events.py --apply --publish
    # optional overrides when auto-detection is not possible:
    python3 scripts/setup_gtm_job_events.py --measurement-id G-XXXXXXX --ga4-property-id 123456789
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/analytics.edit",
    "https://www.googleapis.com/auth/tagmanager.readonly",
    "https://www.googleapis.com/auth/tagmanager.edit.containers",
    "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
    "https://www.googleapis.com/auth/tagmanager.publish",
]

DEFAULT_CLIENT_JSON = Path.home() / "Documents/憑證/eric_mac_wport.json"
TOKEN_PATH = Path.home() / ".config/wport_blog/google_oauth_token.json"

TARGET_CONTAINER_PUBLIC_ID = "GTM-MGLNLCG5"
GTM_BASE = "https://tagmanager.googleapis.com/tagmanager/v2"
GA4_ADMIN_BASE = "https://analyticsadmin.googleapis.com/v1beta"

WORKSPACE_NAME = "Blog job recommendations"

# Data Layer Variables to ensure (name -> dataLayer key). post_* may already
# exist from the earlier blog tracking work; we skip any that are already there.
DLV_KEYS = ["job_id", "job_title", "job_company", "job_position", "job_keyword", "jobs_count", "post_id", "post_title"]

# Custom Event triggers and the GA4 event tags built on them. `params` lists the
# GA4 event parameters (param name -> DLV name that feeds it).
EVENTS = [
    {
        "event": "recommended_jobs_view",
        "key_event": False,
        "params": ["jobs_count", "job_keyword", "post_id", "post_title"],
    },
    {
        "event": "recommended_job_click",
        "key_event": True,
        "params": ["job_id", "job_title", "job_company", "job_position", "job_keyword", "post_id"],
    },
    {
        "event": "recommended_jobs_search_click",
        "key_event": False,
        "params": ["job_keyword", "post_id"],
    },
]


# --------------------------------------------------------------------------- #
# Auth + HTTP helpers                                                          #
# --------------------------------------------------------------------------- #
def load_credentials(client_json: Path):
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as exc:
        raise SystemExit(
            "Missing dependencies. Run: pip3 install google-auth-oauthlib google-auth-httplib2"
        ) from exc

    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(client_json), SCOPES)
            creds = flow.run_local_server(port=0, open_browser=True)
        TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")

    return creds


def api(method: str, url: str, token: str, body: dict | None = None) -> tuple[int, dict | str]:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": f"Bearer {token}"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        try:
            return error.code, json.loads(raw)
        except json.JSONDecodeError:
            return error.code, raw


def get(url: str, token: str) -> dict:
    status, body = api("GET", url, token)
    if status != 200 or not isinstance(body, dict):
        raise SystemExit(f"GET {url} failed: HTTP {status} {body}")
    return body


# --------------------------------------------------------------------------- #
# GTM resource-body builders                                                   #
# --------------------------------------------------------------------------- #
def dlv_name(key: str) -> str:
    return f"DLV - {key}"


def dlv_body(key: str) -> dict:
    return {
        "name": dlv_name(key),
        "type": "v",
        "parameter": [
            {"type": "integer", "key": "dataLayerVersion", "value": "2"},
            {"type": "boolean", "key": "setDefaultValue", "value": "false"},
            {"type": "template", "key": "name", "value": key},
        ],
    }


def trigger_name(event: str) -> str:
    return f"CE - {event}"


def trigger_body(event: str) -> dict:
    return {
        "name": trigger_name(event),
        "type": "customEvent",
        "customEventFilter": [
            {
                "type": "equals",
                "parameter": [
                    {"type": "template", "key": "arg0", "value": "{{_event}}"},
                    {"type": "template", "key": "arg1", "value": event},
                ],
            }
        ],
    }


def tag_body(event: str, params: list[str], trigger_id: str, measurement_id: str, config_tag_name: str | None) -> dict:
    event_params = [
        {
            "type": "map",
            "map": [
                {"type": "template", "key": "name", "value": p},
                {"type": "template", "key": "value", "value": f"{{{{{dlv_name(p)}}}}}"},
            ],
        }
        for p in params
    ]
    parameter = [
        {"type": "template", "key": "eventName", "value": event},
        {"type": "list", "key": "eventParameters", "list": event_params},
    ]
    # Prefer referencing an existing GA4 config/Google tag; else send a
    # standalone measurement id override so the event tag works on its own.
    if config_tag_name:
        parameter.append({"type": "tagReference", "key": "measurementId", "value": config_tag_name})
    else:
        parameter.append({"type": "boolean", "key": "sendEcommerceData", "value": "false"})
        parameter.append({"type": "template", "key": "measurementIdOverride", "value": measurement_id})

    return {
        "name": f"GA4 - {event}",
        "type": "gaawe",
        "parameter": parameter,
        "firingTriggerId": [trigger_id] if trigger_id else [],
    }


# --------------------------------------------------------------------------- #
# Discovery                                                                    #
# --------------------------------------------------------------------------- #
def find_container(token: str) -> dict:
    accounts = get(f"{GTM_BASE}/accounts", token).get("account", [])
    for account in accounts:
        path = account["path"]
        containers = get(f"{GTM_BASE}/{path}/containers", token).get("container", [])
        for container in containers:
            if container.get("publicId") == TARGET_CONTAINER_PUBLIC_ID:
                return container
    raise SystemExit(f"Container {TARGET_CONTAINER_PUBLIC_ID} not found for this account.")


def detect_ga4_config(token: str, workspace_path: str) -> tuple[str | None, str | None]:
    """Return (config_tag_name, measurement_id) auto-detected from existing tags."""
    tags = get(f"{GTM_BASE}/{workspace_path}/tags", token).get("tag", [])
    for tag in tags:
        if tag.get("type") in ("googtag", "gaawc"):  # Google tag / GA4 config
            mid = None
            for p in tag.get("parameter", []):
                if p.get("key") in ("tagId", "measurementId") and str(p.get("value", "")).startswith("G-"):
                    mid = p["value"]
            return tag.get("name"), mid
    return None, None


def detect_ga4_property_id(token: str, measurement_id: str) -> str | None:
    """Map a GA4 measurement id (G-XXXX) to its numeric property id via the Admin API."""
    if not measurement_id:
        return None
    summaries = get(f"{GA4_ADMIN_BASE}/accountSummaries", token).get("accountSummaries", [])
    for summary in summaries:
        for prop in summary.get("propertySummaries", []):
            pid = prop.get("property", "").split("/")[-1]
            if not pid:
                continue
            status, streams = api("GET", f"{GA4_ADMIN_BASE}/properties/{pid}/dataStreams", token)
            if status != 200 or not isinstance(streams, dict):
                continue
            for stream in streams.get("dataStreams", []):
                if stream.get("webStreamData", {}).get("measurementId") == measurement_id:
                    return pid
    return None


# --------------------------------------------------------------------------- #
# Main                                                                         #
# --------------------------------------------------------------------------- #
def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="POST the creates (default: dry run)")
    parser.add_argument("--publish", action="store_true", help="publish a container version after applying")
    parser.add_argument("--client-json", type=Path, default=DEFAULT_CLIENT_JSON)
    parser.add_argument("--measurement-id", default=None, help="GA4 measurement id (G-XXXX) if not auto-detected")
    parser.add_argument("--ga4-property-id", default=None, help="GA4 numeric property id for key-event marking")
    args = parser.parse_args()

    if not args.client_json.exists():
        print(f"OAuth client JSON not found: {args.client_json}")
        return 1

    creds = load_credentials(args.client_json)
    token = creds.token
    mode = "APPLY" if args.apply else "DRY RUN"
    print(f"=== setup_gtm_job_events ({mode}) ===\n")

    container = find_container(token)
    print(f"Container: {container['name']} ({container['publicId']})  path={container['path']}")

    # Reuse an existing workspace with our name, else use the Default Workspace.
    workspaces = get(f"{GTM_BASE}/{container['path']}/workspaces", token).get("workspace", [])
    workspace = next((w for w in workspaces if w["name"] == WORKSPACE_NAME), None)
    if workspace is None:
        workspace = next((w for w in workspaces if w["name"] == "Default Workspace"), workspaces[0])
    ws_path = workspace["path"]
    print(f"Workspace: {workspace['name']}  path={ws_path}")

    config_tag_name, detected_mid = detect_ga4_config(token, ws_path)
    measurement_id = args.measurement_id or detected_mid
    if config_tag_name:
        print(f"GA4 config tag detected: {config_tag_name} (measurement id: {detected_mid or 'n/a'})")
    elif measurement_id:
        print(f"No GA4 config tag found; event tags will use measurementIdOverride={measurement_id}")
    else:
        print("WARNING: no GA4 config tag and no --measurement-id. Event tags need one to send to GA4.")

    existing_vars = {v["name"] for v in get(f"{GTM_BASE}/{ws_path}/variables", token).get("variable", [])}
    existing_trigs = {t["name"]: t["triggerId"] for t in get(f"{GTM_BASE}/{ws_path}/triggers", token).get("trigger", [])}
    existing_tags = {t["name"] for t in get(f"{GTM_BASE}/{ws_path}/tags", token).get("tag", [])}

    def maybe_create(kind: str, url: str, body: dict, exists: bool) -> str | None:
        if exists:
            print(f"  skip (exists): {kind} {body['name']}")
            return None
        if not args.apply:
            print(f"  would create: {kind} {body['name']}")
            print("    body:", json.dumps(body, ensure_ascii=False))
            return None
        status, created = api("POST", url, token, body)
        if status not in (200, 201) or not isinstance(created, dict):
            print(f"  FAILED {kind} {body['name']}: HTTP {status} {created}")
            return None
        print(f"  created: {kind} {body['name']}")
        return created.get("triggerId")

    print("\n-- Data Layer Variables --")
    for key in DLV_KEYS:
        maybe_create("variable", f"{GTM_BASE}/{ws_path}/variables", dlv_body(key), dlv_name(key) in existing_vars)

    print("\n-- Triggers --")
    trigger_ids: dict[str, str | None] = {}
    for ev in EVENTS:
        name = trigger_name(ev["event"])
        tid = existing_trigs.get(name)
        if tid is None:
            tid = maybe_create("trigger", f"{GTM_BASE}/{ws_path}/triggers", trigger_body(ev["event"]), False)
        else:
            print(f"  skip (exists): trigger {name} (id {tid})")
        trigger_ids[ev["event"]] = tid

    print("\n-- GA4 Event Tags --")
    for ev in EVENTS:
        body = tag_body(ev["event"], ev["params"], trigger_ids.get(ev["event"]) or "", measurement_id or "", config_tag_name)
        maybe_create("tag", f"{GTM_BASE}/{ws_path}/tags", body, body["name"] in existing_tags)

    print("\n-- GA4 key events (conversions) --")
    key_events = [ev["event"] for ev in EVENTS if ev["key_event"]]
    property_id = args.ga4_property_id or detect_ga4_property_id(token, measurement_id or "")
    if property_id and not args.ga4_property_id:
        print(f"  GA4 property auto-detected: {property_id}")
    if not property_id:
        print(f"  (could not resolve GA4 property id; pass --ga4-property-id) would mark: {key_events}")
    else:
        for name in key_events:
            url = f"{GA4_ADMIN_BASE}/properties/{property_id}/keyEvents"
            body = {"eventName": name, "countingMethod": "ONCE_PER_EVENT"}
            if not args.apply:
                print(f"  would mark key event: {name}")
            else:
                status, created = api("POST", url, token, body)
                ok = status in (200, 201)
                print(f"  {'marked' if ok else 'FAILED'} key event {name}: HTTP {status}"
                      + ("" if ok else f" {created}"))

    if args.apply and args.publish:
        print("\n-- Publish --")
        vurl = f"{GTM_BASE}/{ws_path}:create_version"
        status, ver = api("POST", vurl, token, {"name": WORKSPACE_NAME})
        if status not in (200, 201) or not isinstance(ver, dict):
            print(f"  version create FAILED: HTTP {status} {ver}")
        else:
            version_path = ver.get("containerVersion", {}).get("path")
            pstatus, _ = api("POST", f"{GTM_BASE}/{version_path}:publish", token)
            print(f"  publish: HTTP {pstatus} ({'ok' if pstatus == 200 else 'check output'})")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write, then review in the GTM UI before publishing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
