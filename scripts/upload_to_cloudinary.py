#!/usr/bin/env python3
"""
一次性腳本：從 Google Drive / 本機下載圖片並上傳到 Cloudinary wport 帳號
執行方式：python3 scripts/upload_to_cloudinary.py
"""

import subprocess
import tempfile
import os
import sys
import hashlib
import time
import urllib.request
import json

# ── Cloudinary 設定 ──────────────────────────────────────────────
CLOUD_NAME = "dyebbsckc"
API_KEY = "REDACTED_CLOUDINARY_API_KEY"
API_SECRET = "REDACTED_CLOUDINARY_API_SECRET"
FOLDER = "wport-blog"

# ── Google Drive 檔案 ────────────────────────────────────────────
FILES = [
    # 拜訪 #2 → 心得一
    {"id": "14tpvphi5828KwULYMCE3vscckU7BiymP", "name": "ntutec-visit2-howard-vc"},
    {"id": "1HXFJlrTttTl-jhYQvk2rscK2Jdf8GQxe", "name": "ntutec-visit2-zhiyou-journey"},
    {"id": "1EZ-HfTIqA1CdCMkzQPM6nFtqxeg_BDGm", "name": "ntutec-visit2-shon-wuwa"},
    {"id": "1THhNPJJdtdCRDvlCFA9SOfeBk_XM96L5", "name": "ntutec-visit2-walter"},
    {"id": "1E_a_eK8P0mBcA8DPtK-akyb9xTnUVp4E", "name": "ntutec-visit2-coco"},
    # SIC 額外心得 → 心得二
    {"id": "18urWU0tydAZydxuFZUFJN_2ad8IMllxP", "name": "sic-howard-vc-insights"},
    # 拜訪 #3 → 心得三
    {"id": "1y_PS8BmrKnHYGTvKKNL_y2LQ29APabcP", "name": "ntutec-visit3-dennis-pitch"},
    {"id": "1MeHhQGC48CMEBLdimIAneBzqAxZbAavR", "name": "ntutec-visit3-simon-feikuo"},
    # 拜訪 #4 → 心得四
    {"id": "1EbuDh72nfKnbAxdnilCQcIOIPxy6ekZe", "name": "ntutec-visit4-wport-team"},
    {"id": "1jIpA1Y3d3scOEkMO7FLu1KCNYlysiwkm", "name": "ntutec-visit4-gugu-hypelink"},
    {"id": "1-h_6dTMm3wmWQKwREcGfhJjffYiIzYcZ", "name": "ntutec-visit4-jiajia"},
    {"id": "1jl6gm8sd6FHCOxbzh8sliIJlwC9PaV6L", "name": "ntutec-visit4-mino-tommy"},
]

LOCAL_FILES = [
    {"path": "/Users/Eric/Downloads/IMG_5599.jpg", "name": "sic-david-wu-andong"},
]


def get_drive_token():
    try:
        result = subprocess.run(
            ["gcloud", "auth", "print-access-token", "--account=ericlu@wport.me"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"⚠️  無法取得 gcloud token，改用公開 Drive 連結：{e}")
        return None


def download_from_drive(file_id, token, dest_path):
    if token:
        url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        try:
            with urllib.request.urlopen(req) as resp, open(dest_path, "wb") as f:
                f.write(resp.read())
            return
        except Exception as e:
            print(f"   ⚠️  API 下載失敗，改用公開連結：{e}")

    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    with urllib.request.urlopen(url) as resp, open(dest_path, "wb") as f:
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

    cmd = [
        "curl",
        "-s",
        "-X",
        "POST",
        f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload",
        "-F",
        f"file=@{image_path}",
        "-F",
        f"folder={FOLDER}",
        "-F",
        f"public_id={public_id}",
        "-F",
        f"timestamp={ts}",
        "-F",
        f"api_key={API_KEY}",
        "-F",
        f"signature={signature}",
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
        "/image/upload/f_auto,q_auto:good,w_1200,c_limit/",
    )


def main():
    results = []

    if FILES:
        print("🔑 取得 Google Drive token（可選）...")
        token = get_drive_token()

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

    for f in LOCAL_FILES:
        if not os.path.isfile(f["path"]):
            print(f"❌ 找不到本機檔案：{f['path']}")
            sys.exit(1)

        size_kb = os.path.getsize(f["path"]) // 1024
        print(f"📁 本機檔案 {f['name']}（{size_kb} KB）")
        print(f"☁️  上傳 {f['name']} 到 Cloudinary...")
        raw_url = upload_to_cloudinary(f["path"], f["name"])
        opt_url = make_optimized_url(raw_url)
        results.append({"name": f["name"], "url": opt_url})
        print(f"   ✅ {opt_url}")

    print("\n" + "=" * 60)
    print("📋 請複製以下 URL 更新文章：\n")
    for r in results:
        print(f"  [{r['name']}]")
        print(f"  {r['url']}\n")


if __name__ == "__main__":
    main()
