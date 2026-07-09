#!/usr/bin/env python3
"""Provision GTM Data Layer Variables, Custom Event Triggers, and GA4 Event Tags
required by the wport blog analytics plan into container GTM-MGLNLCG5.

Idempotent: skips items that already exist by name. Does NOT publish; changes
land in the current workspace so you can review in GTM Preview before publishing.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/tagmanager.readonly",
    "https://www.googleapis.com/auth/tagmanager.edit.containers",
]
TOKEN_PATH = Path.home() / ".config/wport_blog/google_oauth_token.json"

TARGET_CONTAINER = "GTM-MGLNLCG5"
# Match existing container convention (see tag "GA4 - page_view").
GA4_MEASUREMENT_ID_VAR = "{{const - GA4 Measurement ID}}"

# --- Config: variables, triggers, tags -------------------------------------

DATA_LAYER_VARIABLES = [
    "post_id",
    "post_title",
    "post_tags",
    "publish_date",
    "page_type",
    "scroll_percent",
    "share_platform",
    "target_post_id",
]

# Custom Event triggers matching dataLayer event names emitted by blog
CUSTOM_EVENTS = [
    "post_view",
    "scroll_depth",
    "read_complete",
    "share_click",
    "related_post_click",
    "mark_read",
]

# Which event params attach to which GA4 Event Tag
COMMON_PARAMS = ["post_id", "post_title", "post_tags", "publish_date", "page_type"]
TAG_EXTRA_PARAMS = {
    "post_view": [],
    "scroll_depth": ["scroll_percent"],
    "read_complete": ["scroll_percent"],
    "share_click": ["share_platform"],
    "related_post_click": ["target_post_id"],
    "mark_read": ["scroll_percent"],
}

# --- Helpers ---------------------------------------------------------------


def get_token() -> str:
    if not TOKEN_PATH.exists():
        print(f"Token not found at {TOKEN_PATH}. Run google_api_auth_test.py first.")
        sys.exit(1)

    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_PATH.write_text(creds.to_json())

    granted = set((creds.scopes or []))
    required = {"https://www.googleapis.com/auth/tagmanager.edit.containers"}
    if not required.issubset(granted):
        print("Current token lacks tagmanager.edit.containers scope.")
        print("Delete", TOKEN_PATH, "and re-run google_api_auth_test.py to re-authorize.")
        sys.exit(1)

    return creds.token


def api(method: str, url: str, token: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": f"Bearer {token}"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        body_text = error.read().decode()
        try:
            payload = json.loads(body_text)
        except json.JSONDecodeError:
            payload = {"raw": body_text}
        raise SystemExit(f"HTTP {error.code} on {method} {url}\n{json.dumps(payload, indent=2)}")


def find_container(token: str) -> tuple[str, str, str]:
    accounts = api("GET", "https://tagmanager.googleapis.com/tagmanager/v2/accounts", token)
    for account in accounts.get("account", []):
        account_id = account["accountId"]
        containers = api(
            "GET",
            f"https://tagmanager.googleapis.com/tagmanager/v2/accounts/{account_id}/containers",
            token,
        )
        for container in containers.get("container", []):
            if container.get("publicId") == TARGET_CONTAINER:
                workspaces = api(
                    "GET",
                    f"https://tagmanager.googleapis.com/tagmanager/v2/accounts/{account_id}/containers/{container['containerId']}/workspaces",
                    token,
                )
                workspace = workspaces["workspace"][0]
                return account_id, container["containerId"], workspace["workspaceId"]
    raise SystemExit(f"Container {TARGET_CONTAINER} not found under authorized account.")


def base_path(account_id: str, container_id: str, workspace_id: str) -> str:
    return (
        f"https://tagmanager.googleapis.com/tagmanager/v2/accounts/{account_id}"
        f"/containers/{container_id}/workspaces/{workspace_id}"
    )


# --- Provisioning ----------------------------------------------------------


def ensure_variables(token: str, base: str) -> dict[str, str]:
    existing = api("GET", f"{base}/variables", token).get("variable", [])
    existing_by_name = {var["name"]: var for var in existing}

    result = {}
    for name in DATA_LAYER_VARIABLES:
        variable_name = f"DL - {name}"
        if variable_name in existing_by_name:
            result[name] = existing_by_name[variable_name]["variableId"]
            print(f"  [skip] variable {variable_name} already exists")
            continue

        body = {
            "name": variable_name,
            "type": "v",
            "parameter": [
                {"type": "template", "key": "name", "value": name},
                {"type": "integer", "key": "dataLayerVersion", "value": "2"},
            ],
        }
        created = api("POST", f"{base}/variables", token, body)
        result[name] = created["variableId"]
        print(f"  [new] variable {variable_name}")

    return result


def ensure_triggers(token: str, base: str) -> dict[str, str]:
    existing = api("GET", f"{base}/triggers", token).get("trigger", [])
    existing_by_name = {trg["name"]: trg for trg in existing}

    result = {}
    for event in CUSTOM_EVENTS:
        trigger_name = f"Blog - CE - {event}"
        if trigger_name in existing_by_name:
            result[event] = existing_by_name[trigger_name]["triggerId"]
            print(f"  [skip] trigger {trigger_name} already exists")
            continue

        body = {
            "name": trigger_name,
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
        created = api("POST", f"{base}/triggers", token, body)
        result[event] = created["triggerId"]
        print(f"  [new] trigger {trigger_name}")

    return result


def ensure_tags(token: str, base: str, trigger_ids: dict[str, str]) -> None:
    existing = api("GET", f"{base}/tags", token).get("tag", [])
    existing_names = {tag["name"] for tag in existing}

    for event in CUSTOM_EVENTS:
        tag_name = f"Blog - GA4 - {event}"
        if tag_name in existing_names:
            print(f"  [skip] tag {tag_name} already exists")
            continue

        params = COMMON_PARAMS + TAG_EXTRA_PARAMS.get(event, [])
        event_settings_table = [
            {
                "type": "map",
                "map": [
                    {"type": "template", "key": "parameter", "value": key},
                    {
                        "type": "template",
                        "key": "parameterValue",
                        "value": f"{{{{DL - {key}}}}}",
                    },
                ],
            }
            for key in params
        ]

        body = {
            "name": tag_name,
            "type": "gaawe",
            "parameter": [
                {"type": "boolean", "key": "sendEcommerceData", "value": "false"},
                {
                    "type": "list",
                    "key": "eventSettingsTable",
                    "list": event_settings_table,
                },
                {"type": "template", "key": "eventName", "value": event},
                {
                    "type": "template",
                    "key": "measurementIdOverride",
                    "value": GA4_MEASUREMENT_ID_VAR,
                },
            ],
            "firingTriggerId": [trigger_ids[event]],
            "tagFiringOption": "oncePerEvent",
        }
        api("POST", f"{base}/tags", token, body)
        print(f"  [new] tag {tag_name}")


def main() -> int:
    token = get_token()
    account_id, container_id, workspace_id = find_container(token)
    base = base_path(account_id, container_id, workspace_id)
    print(f"Container {TARGET_CONTAINER}: account={account_id} container={container_id} workspace={workspace_id}")

    print("Variables:")
    ensure_variables(token, base)
    print("Triggers:")
    trigger_ids = ensure_triggers(token, base)
    print("Tags:")
    ensure_tags(token, base, trigger_ids)

    print()
    print("Done. Review in GTM UI (Preview mode) then click Publish when ready.")
    print("These blog resources are named with prefixes 'DL - ', 'Blog - CE - ', 'Blog - GA4 - '.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
