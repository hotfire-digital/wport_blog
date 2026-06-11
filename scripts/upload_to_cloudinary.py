#!/usr/bin/env python3
"""
一次性腳本：從 Google Drive 下載圖片並上傳到 Cloudinary wport 帳號
執行方式：python3 scripts/upload_to_cloudinary.py
"""

import subprocess
import tempfile
import os
import sys
import hashlib
import hmac
import time
import urllib.request
import urllib.parse
import json

# ── Cloudinary 設定 ──────────────────────────────────────────────
CLOUD_NAME = "dyebbsckc"
API_KEY    = "REDACTED_CLOUDINARY_API_KEY"
API_SECRET = "REDACTED_CLOUDINARY_API_SECRET"
FOLDER     = "wport-blog"

# ── Google Drive 檔案 ────────────────────────────────────────────
FILES = [
    {"id": "13DR5n-rmq2reF63Y1r5zWeyNNOBUAcdc", "name": "kaiyuan-seminar-large"},
    {"id": "1ooTVfdHayZACqokHIWx9_ytq-ikP5xi9", "name": "kaiyuan-seminar-small"},
]


def get_drive_token():
    try:
        result = subprocess.run(
            ["gcloud", "auth", "print-access-token", "--account=ericlu@wport.me"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"❌ 無法取得 token：{e}")
        print("   請先執行：gcloud auth login --enable-gdrive-access")
        sys.exit(1)


def download_from_drive(file_id, token, dest_path):
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp, open(dest_path, "wb") as f:
        f.write(resp.read())


def cloudinary_sign(params: dict) -> str:
    """產生 Cloudinary API 簽名"""
    to_sign = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    to_sign += API_SECRET
    return hashlib.sha256(to_sign.encode()).hexdigest()


def upload_to_cloudinary(image_path, public_id):
    ts = str(int(time.time()))
    params = {
        "folder": FOLDER,
        "public_id": public_id,
        "timestamp": ts,
    }
    signature = cloudinary_sign(params)

    # 用 curl 上傳（避免需要安裝 requests）
    cmd = [
        "curl", "-s", "-X", "POST",
        f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload",
        "-F", f"file=@{image_path}",
        "-F", f"folder={FOLDER}",
        "-F", f"public_id={public_id}",
        "-F", f"timestamp={ts}",
        "-F", f"api_key={API_KEY}",
        "-F", f"signature={signature}",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(result.stdout)

    if "secure_url" not in data:
        print(f"❌ Cloudinary 上傳失敗：{data}")
        sys.exit(1)

    return data["secure_url"]


def make_optimized_url(raw_url):
    """插入 transformation 參數"""
    return raw_url.replace(
        "/image/upload/",
        "/image/upload/f_auto,q_auto:good,w_1200,c_limit/"
    )


def main():
    print("🔑 取得 Google Drive token...")
    token = get_drive_token()

    results = []
    with tempfile.TemporaryDirectory() as tmpdir:
        for f in FILES:
            dest = os.path.join(tmpdir, f"{f['name']}.jpg")
            print(f"⬇️  下載 {f['name']}...")
            download_from_drive(f["id"], token, dest)
            size_kb = os.path.getsize(dest) // 1024
            print(f"   ✅ 下載完成（{size_kb} KB）")

            print(f"☁️  上傳 {f['name']} 到 Cloudinary...")
            raw_url = upload_to_cloudinary(dest, f["name"])
            opt_url = make_optimized_url(raw_url)
            results.append({"name": f["name"], "url": opt_url})
            print(f"   ✅ {opt_url}")

    print("\n" + "="*60)
    print("📋 請複製以下 URL 更新文章：\n")
    for r in results:
        print(f"  [{r['name']}]")
        print(f"  {r['url']}\n")


if __name__ == "__main__":
    main()
