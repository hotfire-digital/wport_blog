#!/usr/bin/env bash
# Regenerate responsive WebP variants for static assets in public/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"

resize_webp() {
  local input="$1"
  local width="$2"
  local output="$3"
  cwebp -q 85 -resize "$width" 0 "$input" -o "$output"
}

resize_webp_square() {
  local input="$1"
  local size="$2"
  local output="$3"
  cwebp -q 90 -resize "$size" "$size" "$input" -o "$output"
}

echo "→ Hero mascots"
resize_webp "$PUBLIC/mascot-graduation.png" 480 "$PUBLIC/mascot-graduation-480w.webp"
resize_webp "$PUBLIC/mascot-graduation.png" 960 "$PUBLIC/mascot-graduation-960w.webp"
resize_webp "$PUBLIC/mascot-cooperation.png" 480 "$PUBLIC/mascot-cooperation-480w.webp"
resize_webp "$PUBLIC/mascot-cooperation.png" 960 "$PUBLIC/mascot-cooperation-960w.webp"

echo "→ Footer icons"
for icon in "$PUBLIC"/icons/footer/footer_*.png; do
  base="${icon%.png}"
  resize_webp_square "$icon" 24 "${base}-24w.webp"
  resize_webp_square "$icon" 48 "${base}-48w.webp"
done

echo "✅ Done"
